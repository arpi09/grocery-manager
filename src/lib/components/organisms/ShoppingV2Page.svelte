<script lang="ts">
	import { browser } from '$app/environment';
	import { deserialize, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import ModeToggle from '$lib/components/molecules/ModeToggle.svelte';
	import ShoppingToPantrySheet from '$lib/components/molecules/ShoppingToPantrySheet.svelte';
	import InkopHouseholdInviteBanner from '$lib/components/organisms/InkopHouseholdInviteBanner.svelte';
	import TripCompletedInviteBanner from '$lib/components/organisms/TripCompletedInviteBanner.svelte';
	import ShoppingLegacyDrawer from '$lib/components/organisms/ShoppingLegacyDrawer.svelte';
	import ShoppingV2PlanView from '$lib/components/organisms/ShoppingV2PlanView.svelte';
	import ShoppingV2ShopView from '$lib/components/organisms/ShoppingV2ShopView.svelte';
	import {
		clearShoppingTripSession,
		defaultShoppingTripSession,
		readShoppingTripSession,
		writeShoppingTripSession,
		type ShoppingTripSession
	} from '$lib/client/shopping-trip-session';
	import { trackProductEvent } from '$lib/client/product-events';
	import type { PantryBridgePreview } from '$lib/application/shopping-to-pantry.service';
	import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';
	import {
		clampFocusIndex,
		sortUncheckedItems,
		type ShoppingTripMode
	} from '$lib/domain/shopping-trip';
	import { memorySuggestionId } from '$lib/domain/shopping-v2-presenter';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { bindSubmittingWithToast } from '$lib/utils/form-submit-feedback';

	interface Props {
		items: ShoppingListItem[];
		checkedCount: number;
		canEdit: boolean;
		householdId: string;
		replenishmentSuggestions: ReplenishmentSuggestion[];
		shoppingToPantryMode: ShoppingToPantryMode;
		shareLinkEnabled: boolean;
		memberCount: number;
		showReceiptImportLead?: boolean;
	}

	let {
		items,
		checkedCount,
		canEdit,
		householdId,
		replenishmentSuggestions,
		shoppingToPantryMode,
		shareLinkEnabled,
		memberCount,
		showReceiptImportLead = false,
	}: Props = $props();

	let session = $state<ShoppingTripSession>(defaultShoppingTripSession());
	let initializedHouseholdId = $state<string | null>(null);
	let shopDeeplinkHandled = $state(false);
	let legacyOpen = $state(false);
	let showQuickAdd = $state(false);
	let acceptingKey = $state<string | null>(null);
	let dismissingKey = $state<string | null>(null);
	let picking = $state(false);
	let addingItem = $state(false);
	let liveMessage = $state('');

	let pantryBridgeItem = $state<ShoppingListItem | null>(null);
	let pantryBridgePreview = $state<PantryBridgePreview | null>(null);
	let pantryBridgeMode = $state<ShoppingToPantryMode>(shoppingToPantryMode);
	let pantrySheetOpen = $state(false);
	let tripCompletedTrigger = $state(0);

	const unchecked = $derived(sortUncheckedItems(items));
	const listHasItems = $derived(items.length > 0 || checkedCount > 0);

	$effect(() => {
		if (!browser || !householdId) {
			return;
		}

		if (initializedHouseholdId && initializedHouseholdId !== householdId) {
			clearShoppingTripSession(initializedHouseholdId);
		}

		if (initializedHouseholdId !== householdId) {
			initializedHouseholdId = householdId;
			const stored = readShoppingTripSession(householdId);
			session = stored ?? defaultShoppingTripSession();
		}
	});

	$effect(() => {
		if (!browser || shopDeeplinkHandled || page.url.searchParams.get('mode') !== 'shop') {
			return;
		}

		shopDeeplinkHandled = true;
		switchMode('shop', 'deeplink');

		const url = new URL(page.url);
		url.searchParams.delete('mode');
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	});

	$effect(() => {
		if (!browser || !householdId) {
			return;
		}
		writeShoppingTripSession(householdId, session);
	});

	$effect(() => {
		pantryBridgeMode = shoppingToPantryMode;
	});

	function persistSession(next: ShoppingTripSession) {
		session = next;
	}

	function switchMode(next: ShoppingTripMode, source: 'cta' | 'toggle' | 'deeplink') {
		if (next === 'shop' && unchecked.length === 0) {
			showClientToast(t('shopping.v2.shop.progressEmpty'), { variant: 'default' });
			return;
		}

		const from = session.mode;
		if (from === next) {
			return;
		}

		if (next === 'shop') {
			persistSession({
				mode: 'shop',
				focusIndex: 0,
				tripTotal: unchecked.length,
				pickedCount: 0,
				tripStartedAt: Date.now()
			});
			void trackProductEvent('trip_started', {
				uncheckedCount: unchecked.length,
				source
			});
		} else {
			persistSession({
				...session,
				mode: 'plan'
			});
		}

		void trackProductEvent('shopping_mode_switched', {
			from,
			to: next,
			uncheckedCount: unchecked.length
		});
	}

	function handleStartShop() {
		switchMode('shop', 'cta');
	}

	function handleBackToPlan() {
		switchMode('plan', 'toggle');
	}

	function handleCompletePlan() {
		persistSession({
			...defaultShoppingTripSession()
		});
	}

	function handleCompletePantry() {
		void goto('/skafferi');
	}

	async function acceptSuggestion(suggestion: ReplenishmentSuggestion) {
		if (!canEdit || acceptingKey) {
			return;
		}

		acceptingKey = suggestion.normalizedKey;
		try {
			const response = await fetch('/api/replenishment/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey: suggestion.normalizedKey, surface: 'inkop' })
			});
			const data = (await response.json()) as { error?: string; name?: string };

			if (!response.ok) {
				showClientToast(data.error ?? t('shopping.v2.memory.acceptFailed'), { variant: 'error' });
				return;
			}

			void trackProductEvent('memory_suggestion_added', {
				suggestionId: memorySuggestionId(suggestion),
				source: 'inkop',
				itemName: data.name ?? suggestion.displayName
			});

			showClientToast(t('shopping.v2.memory.acceptSuccess', { name: data.name ?? suggestion.displayName }), {
				variant: 'success'
			});
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.v2.memory.acceptFailed'), { variant: 'error' });
		} finally {
			acceptingKey = null;
		}
	}

	async function dismissSuggestion(suggestion: ReplenishmentSuggestion) {
		if (!canEdit || dismissingKey) {
			return;
		}

		dismissingKey = suggestion.normalizedKey;
		try {
			const response = await fetch('/api/replenishment/dismiss', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey: suggestion.normalizedKey })
			});
			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				showClientToast(data.error ?? t('replenishment.dismissFailed'), { variant: 'error' });
				return;
			}

			void trackProductEvent('memory_suggestion_ignored', {
				suggestionId: memorySuggestionId(suggestion),
				source: 'inkop',
				itemName: suggestion.displayName
			});

			await invalidateAll();
		} catch {
			showClientToast(t('replenishment.dismissFailed'), { variant: 'error' });
		} finally {
			dismissingKey = null;
		}
	}

	function closePantrySheet() {
		pantrySheetOpen = false;
		pantryBridgeItem = null;
		pantryBridgePreview = null;
	}

	function handlePantryAdded(message: string) {
		showClientToast(message, { variant: 'success' });
		closePantrySheet();
	}

	async function handlePick(item: ShoppingListItem) {
		if (!canEdit || picking) {
			return;
		}

		picking = true;
		const formData = new FormData();
		formData.set('id', item.id);

		try {
			const response = await fetch('?/toggle', {
				method: 'POST',
				body: formData,
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await response.text()) as {
				type: string;
				data?: {
					pantryBridge?: {
						item: ShoppingListItem;
						preview: PantryBridgePreview;
						mode: ShoppingToPantryMode;
					};
					pantryAdded?: { message?: string; auto?: boolean };
				};
			};

			if (result.type !== 'success') {
				showClientToast(t('shopping.v2.error.toggleFailed'), { variant: 'error' });
				return;
			}

			const nextPicked = session.pickedCount + 1;
			const nextUnchecked = Math.max(unchecked.length - 1, 0);
			const nextFocus = clampFocusIndex(session.focusIndex, nextUnchecked);

			persistSession({
				...session,
				pickedCount: nextPicked,
				focusIndex: nextFocus
			});

			liveMessage = t('shopping.v2.shop.pickedLive', { name: item.name });

			void trackProductEvent('trip_item_checked', {
				itemId: item.id,
				position: session.focusIndex,
				remaining: Math.max(session.tripTotal - nextPicked, 0)
			});

			if (nextPicked >= session.tripTotal) {
				void trackProductEvent('trip_completed', {
					total: session.tripTotal,
					durationMs: session.tripStartedAt ? Date.now() - session.tripStartedAt : undefined
				});
				tripCompletedTrigger += 1;
			}

			if (result.data?.pantryAdded?.message) {
				showClientToast(result.data.pantryAdded.message, { variant: 'success' });
			} else if (result.data?.pantryBridge) {
				pantryBridgeItem = result.data.pantryBridge.item;
				pantryBridgePreview = result.data.pantryBridge.preview;
				pantryBridgeMode = result.data.pantryBridge.mode;
				pantrySheetOpen = true;
			}

			await invalidateAll();
		} catch {
			showClientToast(t('shopping.v2.error.toggleFailed'), { variant: 'error' });
		} finally {
			picking = false;
		}
	}

	const addEnhance = bindSubmittingWithToast(
		(value) => {
			addingItem = value;
		},
		() => {
			showClientToast(t('actionToast.shoppingAdded'), { variant: 'success' });
			showQuickAdd = false;
			void invalidateAll();
		}
	);
</script>

<div class="shopping-v2-page" data-testid="shopping-v2-page">
	<ModeToggle
		mode={session.mode}
		disabled={!canEdit}
		onchange={(next) => switchMode(next, 'toggle')}
	/>

	<InkopHouseholdInviteBanner
		memberCount={memberCount}
		uncheckedCount={unchecked.length}
		checkedCount={checkedCount}
		{listHasItems}
	/>

	<TripCompletedInviteBanner memberCount={memberCount} trigger={tripCompletedTrigger} />

	{#if session.mode === 'plan'}
		<ShoppingV2PlanView
			{items}
			suggestions={replenishmentSuggestions}
			{canEdit}
			showReceiptLead={showReceiptImportLead}
			{acceptingKey}
			{dismissingKey}
			onAcceptSuggestion={acceptSuggestion}
			onDismissSuggestion={dismissSuggestion}
			onStartShop={handleStartShop}
			onAddItem={() => {
				showQuickAdd = true;
			}}
			onOpenLegacy={() => {
				legacyOpen = true;
			}}
		/>

		{#if showQuickAdd && canEdit}
			<form method="POST" action="?/add" use:enhance={addEnhance} class="quick-add" data-testid="shopping-v2-quick-add">
				<label class="sr-only" for="shopping-v2-name">{t('shopping.v2.add.placeholder')}</label>
				<input
					id="shopping-v2-name"
					name="name"
					required
					placeholder={t('shopping.v2.add.placeholder')}
					autocomplete="off"
				/>
				<input name="quantity" placeholder={t('shopping.v2.add.quantityPlaceholder')} />
				<input name="unit" placeholder={t('shopping.v2.add.unitPlaceholder')} />
				<Button type="submit" loading={addingItem}>{t('shopping.v2.add.submit')}</Button>
			</form>
		{/if}
	{:else}
		<ShoppingV2ShopView
			{items}
			focusIndex={session.focusIndex}
			tripTotal={session.tripTotal}
			pickedCount={session.pickedCount}
			{canEdit}
			{picking}
			onPick={handlePick}
			onBackToPlan={handleBackToPlan}
			onCompletePantry={handleCompletePantry}
			onCompletePlan={handleCompletePlan}
			onOpenLegacy={() => {
				legacyOpen = true;
			}}
		/>
	{/if}

	<ShoppingLegacyDrawer
		open={legacyOpen}
		{items}
		{checkedCount}
		{canEdit}
		{shareLinkEnabled}
		{shoppingToPantryMode}
		memberCount={memberCount}
		closeLabel={session.mode === 'shop' ? t('shopping.v2.shop.backToShop') : t('dataGrid.backToPlan')}
		onClose={() => {
			legacyOpen = false;
		}}
	/>

	<p class="sr-live" aria-live="polite">{liveMessage}</p>
</div>

<ShoppingToPantrySheet
	open={pantrySheetOpen}
	item={pantryBridgeItem}
	preview={pantryBridgePreview}
	mode={pantryBridgeMode}
	onClose={closePantrySheet}
	onSkip={closePantrySheet}
	onAdded={handlePantryAdded}
/>

<style>
	.shopping-v2-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-width: 0;
	}

	.quick-add {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.quick-add input {
		min-height: var(--touch-target-min);
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
	}

	.sr-live {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
