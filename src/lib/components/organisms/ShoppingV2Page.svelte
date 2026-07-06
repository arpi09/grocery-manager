<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { deserialize, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import ModeToggle from '$lib/components/molecules/ModeToggle.svelte';
	import ShoppingToPantrySheet from '$lib/components/molecules/ShoppingToPantrySheet.svelte';
	import ShoppingUnpackSheet from '$lib/components/molecules/ShoppingUnpackSheet.svelte';
	import ShoppingListShareMenu from '$lib/components/molecules/ShoppingListShareMenu.svelte';
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
	import type { SundaySuggestion } from '$lib/domain/sunday-suggestion';
	import type { DedupeWarning } from '$lib/domain/dedupe-autopilot';
	import {
		clampFocusIndex,
		getLiveTripTotal,
		sortUncheckedItems,
		splitTripItems,
		type ShoppingTripMode
	} from '$lib/domain/shopping-trip';
	import type { UnpackRowInput } from '$lib/domain/shopping-unpack';
	import { receiptOneTapHref } from '$lib/utils/scan-nav';
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
		sundayProposal: SundaySuggestion[];
		shoppingToPantryMode: ShoppingToPantryMode;
		shareLinkEnabled: boolean;
		memberCount: number;
		showReceiptImportLead?: boolean;
		storeDedupeByKey?: Record<string, DedupeWarning[]>;
	}

	let {
		items,
		checkedCount,
		canEdit,
		householdId,
		sundayProposal,
		shoppingToPantryMode,
		shareLinkEnabled,
		memberCount,
		showReceiptImportLead = false,
		storeDedupeByKey = {}
	}: Props = $props();

	let session = $state<ShoppingTripSession>(defaultShoppingTripSession());
	let initializedHouseholdId = $state<string | null>(null);
	let shopDeeplinkHandled = $state(false);
	let quickParamHandled = $state(false);
	let joinedParamHandled = $state(false);
	let legacyOpen = $state(false);
	let showQuickAdd = $state(false);
	let addingKey = $state<string | null>(null);
	let addingAll = $state(false);
	let dismissingKey = $state<string | null>(null);
	let picking = $state(false);
	let addingItem = $state(false);
	let liveMessage = $state('');
	let lastPicked = $state<ShoppingListItem | null>(null);
	let undoingPick = $state(false);
	let togglingUnavailable = $state(false);
	let unpackOpen = $state(false);
	let unpackLoading = $state(false);
	let unpackRows = $state<UnpackRowInput[]>([]);
	/** Cleared list held for undo — "Börja om" is never a dead end. */
	let lastClearedItems = $state<Array<{ name: string; quantity: string | null; unit: string | null }>>([]);
	let clearingList = $state(false);
	let restoringList = $state(false);

	let pantryBridgeItem = $state<ShoppingListItem | null>(null);
	let pantryBridgePreview = $state<PantryBridgePreview | null>(null);
	let pantryBridgeMode = $state<ShoppingToPantryMode>(shoppingToPantryMode);
	let pantrySheetOpen = $state(false);
	let tripCompletedTrigger = $state(0);

	const unchecked = $derived(sortUncheckedItems(items));
	const listHasItems = $derived(items.length > 0 || checkedCount > 0);
	/* The add form stays visible on an empty list so the page's core function is always at hand. */
	const showAddForm = $derived(showQuickAdd || (session.mode === 'plan' && unchecked.length === 0));

	/* Trip queue excludes items marked "not in store" during this trip; they regroup below. */
	const tripSplit = $derived(splitTripItems(items, session.tripStartedAt));
	const tripUnchecked = $derived(sortUncheckedItems(tripSplit.available));
	/* Total follows the live list so items a partner adds mid-trip count toward completion. */
	const liveTripTotal = $derived(getLiveTripTotal(session.pickedCount, tripUnchecked.length));

	async function openQuickAdd() {
		showQuickAdd = true;
		await tick();
		document.getElementById('shopping-v2-name')?.focus();
	}

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
		if (!browser || quickParamHandled || page.url.searchParams.get('quick') !== '1') {
			return;
		}

		quickParamHandled = true;
		showQuickAdd = true;

		const url = new URL(page.url);
		url.searchParams.delete('quick');
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	});

	$effect(() => {
		if (!browser || joinedParamHandled || page.url.searchParams.get('joined') !== '1') {
			return;
		}

		joinedParamHandled = true;
		showClientToast(t('shoppingListShare.listaJoinToast'), { variant: 'success' });

		const url = new URL(page.url);
		url.searchParams.delete('joined');
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
			lastPicked = null;
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

	function handleScanReceipt() {
		void goto(receiptOneTapHref('/inkop'));
	}

	async function openUnpack() {
		if (!canEdit || unpackLoading) {
			return;
		}

		unpackLoading = true;
		const formData = new FormData();
		formData.set('since', String(session.tripStartedAt ?? 0));

		try {
			const response = await fetch('?/unpackPreview', {
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
					unpack?: {
						rows: Array<{ item: ShoppingListItem; preview: PantryBridgePreview }>;
					};
				};
			};

			if (result.type !== 'success' || !result.data?.unpack) {
				showClientToast(t('shopping.v2.unpack.loadFailed'), { variant: 'error' });
				return;
			}

			unpackRows = result.data.unpack.rows.map(({ item, preview }) => ({
				shoppingItemId: item.id,
				name: item.name,
				location: preview.location,
				quantity: preview.quantity,
				unit: preview.unit
			}));
			unpackOpen = true;
		} catch {
			showClientToast(t('shopping.v2.unpack.loadFailed'), { variant: 'error' });
		} finally {
			unpackLoading = false;
		}
	}

	function handleUnpacked(message: string) {
		unpackOpen = false;
		unpackRows = [];
		showClientToast(message, { variant: 'success' });
		/* Trip is packed away — reset to plan mode so the next week starts clean. */
		handleCompletePlan();
		void invalidateAll();
	}

	function sundayRowPayload(row: SundaySuggestion) {
		return {
			source: row.source,
			name: row.name,
			quantity: row.quantityLabel,
			normalizedKey: row.normalizedKey,
			relatedMealDate: row.relatedMealDate,
			relatedRecipeTitle: row.relatedRecipeTitle
		};
	}

	async function postSundayAdd(rows: SundaySuggestion[]): Promise<number | null> {
		const formData = new FormData();
		formData.set('rows', JSON.stringify(rows.map(sundayRowPayload)));

		const response = await fetch('?/sundayAdd', {
			method: 'POST',
			body: formData,
			headers: { accept: 'application/json', 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await response.text()) as {
			type: string;
			data?: { sundayAdded?: { added: number; skipped: number } };
		};

		if (result.type !== 'success' || !result.data?.sundayAdded) {
			return null;
		}
		return result.data.sundayAdded.added;
	}

	async function sundayAdd(row: SundaySuggestion) {
		if (!canEdit || addingKey || addingAll) {
			return;
		}

		addingKey = row.key;
		try {
			const added = await postSundayAdd([row]);
			if (added === null) {
				showClientToast(t('shopping.sunday.addFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('shopping.sunday.addedOneToast', { name: row.name }), { variant: 'success' });
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.sunday.addFailed'), { variant: 'error' });
		} finally {
			addingKey = null;
		}
	}

	async function sundayAddAll(rows: SundaySuggestion[]) {
		if (!canEdit || addingAll || addingKey || rows.length === 0) {
			return;
		}

		addingAll = true;
		try {
			const added = await postSundayAdd(rows);
			if (added === null) {
				showClientToast(t('shopping.sunday.addFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('shopping.sunday.addedToast', { count: added }), { variant: 'success' });
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.sunday.addFailed'), { variant: 'error' });
		} finally {
			addingAll = false;
		}
	}

	async function sundayDismiss(row: SundaySuggestion) {
		if (!canEdit || dismissingKey) {
			return;
		}

		/* AI rows are hidden client-side by the panel — nothing to persist. Only replenishment
		 * dismissals are recorded so the cadence suggestion stops resurfacing. */
		if (row.source !== 'replenishment' || !row.normalizedKey) {
			return;
		}

		dismissingKey = row.key;
		try {
			const response = await fetch('/api/replenishment/dismiss', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey: row.normalizedKey })
			});
			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				showClientToast(data.error ?? t('replenishment.dismissFailed'), { variant: 'error' });
				return;
			}

			void trackProductEvent('memory_suggestion_ignored', {
				suggestionId: row.normalizedKey,
				source: 'inkop_sunday',
				itemName: row.name
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
		/* No per-pick pantry modal in store — the bridge runs at trip complete ("Packa upp"). */
		formData.set('bridge', 'defer');

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
			const nextUnchecked = Math.max(tripUnchecked.length - 1, 0);
			const nextFocus = clampFocusIndex(session.focusIndex, nextUnchecked);

			persistSession({
				...session,
				pickedCount: nextPicked,
				focusIndex: nextFocus
			});

			lastPicked = item;
			liveMessage = t('shopping.v2.shop.pickedLive', { name: item.name });

			void trackProductEvent('trip_item_checked', {
				itemId: item.id,
				position: session.focusIndex,
				remaining: nextUnchecked
			});

			if (nextUnchecked === 0) {
				void trackProductEvent('trip_completed', {
					total: getLiveTripTotal(nextPicked, 0),
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

	async function handleUndoPick() {
		if (!canEdit || undoingPick || !lastPicked) {
			return;
		}

		const target = lastPicked;
		undoingPick = true;
		const formData = new FormData();
		formData.set('id', target.id);

		try {
			const response = await fetch('?/toggle', {
				method: 'POST',
				body: formData,
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await response.text()) as { type: string };

			if (result.type !== 'success') {
				showClientToast(t('shopping.v2.error.toggleFailed'), { variant: 'error' });
				return;
			}

			persistSession({
				...session,
				pickedCount: Math.max(session.pickedCount - 1, 0)
			});
			lastPicked = null;
			closePantrySheet();

			const message = t('shopping.v2.shop.undoToast', { name: target.name });
			liveMessage = message;
			showClientToast(message, { variant: 'success' });
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.v2.error.toggleFailed'), { variant: 'error' });
		} finally {
			undoingPick = false;
		}
	}

	async function toggleUnavailable(item: ShoppingListItem) {
		if (!canEdit || togglingUnavailable) {
			return;
		}

		togglingUnavailable = true;
		const formData = new FormData();
		formData.set('id', item.id);

		try {
			const response = await fetch('?/toggleUnavailable', {
				method: 'POST',
				body: formData,
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await response.text()) as {
				type: string;
				data?: { unavailable?: boolean };
			};

			if (result.type !== 'success') {
				showClientToast(t('shopping.v2.error.toggleFailed'), { variant: 'error' });
				return;
			}

			const nowUnavailable = result.data?.unavailable === true;
			if (nowUnavailable) {
				persistSession({
					...session,
					focusIndex: clampFocusIndex(session.focusIndex, Math.max(tripUnchecked.length - 1, 0))
				});
			}

			const message = nowUnavailable
				? t('shopping.v2.shop.unavailableToast', { name: item.name })
				: t('shopping.v2.shop.unavailableRestoredToast', { name: item.name });
			liveMessage = message;
			showClientToast(message, { variant: 'success' });
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.v2.error.toggleFailed'), { variant: 'error' });
		} finally {
			togglingUnavailable = false;
		}
	}

	async function handleClearList() {
		if (!canEdit || clearingList || unchecked.length === 0) {
			return;
		}

		const snapshot = unchecked.map((item) => ({
			name: item.name,
			quantity: item.quantity,
			unit: item.unit
		}));

		clearingList = true;
		try {
			const response = await fetch('?/clearList', {
				method: 'POST',
				body: new FormData(),
				headers: { accept: 'application/json', 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text()) as { type: string };
			if (result.type !== 'success') {
				showClientToast(t('shopping.v2.clear.failed'), { variant: 'error' });
				return;
			}

			lastClearedItems = snapshot;
			showClientToast(t('shopping.v2.clear.done', { count: snapshot.length }), { variant: 'success' });
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.v2.clear.failed'), { variant: 'error' });
		} finally {
			clearingList = false;
		}
	}

	async function handleRestoreList() {
		if (!canEdit || restoringList || lastClearedItems.length === 0) {
			return;
		}

		restoringList = true;
		const formData = new FormData();
		formData.set('items', JSON.stringify(lastClearedItems));

		try {
			const response = await fetch('?/restoreList', {
				method: 'POST',
				body: formData,
				headers: { accept: 'application/json', 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text()) as { type: string };
			if (result.type !== 'success') {
				showClientToast(t('shopping.v2.clear.restoreFailed'), { variant: 'error' });
				return;
			}

			lastClearedItems = [];
			showClientToast(t('shopping.v2.clear.restored'), { variant: 'success' });
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.v2.clear.restoreFailed'), { variant: 'error' });
		} finally {
			restoringList = false;
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
	<!-- Read-only members can still follow shop mode in store; edit actions stay hidden. -->
	<ModeToggle
		mode={session.mode}
		shopDisabled={!listHasItems}
		onchange={(next) => switchMode(next, 'toggle')}
	/>

	<InkopHouseholdInviteBanner
		memberCount={memberCount}
		uncheckedCount={unchecked.length}
		checkedCount={checkedCount}
		listHasItems={listHasItems}
	/>

	<TripCompletedInviteBanner memberCount={memberCount} trigger={tripCompletedTrigger} />

	{#if lastClearedItems.length > 0}
		<div class="clear-undo" role="status" data-testid="shopping-v2-clear-undo">
			<span>{t('shopping.v2.clear.done', { count: lastClearedItems.length })}</span>
			<button
				type="button"
				class="clear-undo-btn"
				disabled={restoringList}
				data-testid="shopping-v2-clear-undo-btn"
				onclick={() => void handleRestoreList()}
			>
				{t('shopping.v2.clear.undo')}
			</button>
		</div>
	{/if}

	{#if session.mode === 'plan'}
		<ShoppingV2PlanView
			{items}
			{sundayProposal}
			{canEdit}
			showReceiptLead={showReceiptImportLead}
			{addingKey}
			{addingAll}
			{dismissingKey}
			onSundayAdd={sundayAdd}
			onSundayAddAll={sundayAddAll}
			onSundayDismiss={sundayDismiss}
			onStartShop={handleStartShop}
			onAddItem={() => void openQuickAdd()}
			onClearList={handleClearList}
			onOpenLegacy={() => {
				legacyOpen = true;
			}}
		/>

		<!-- Share sits at the "Börja handla"-moment: co-shopping is decided right before the trip. -->
		{#if canEdit && shareLinkEnabled && listHasItems}
			<ShoppingListShareMenu
				uncheckedItems={items}
				checkedCount={checkedCount}
				{canEdit}
				{shareLinkEnabled}
				memberCount={memberCount}
				shareFirst={true}
			/>
		{/if}
	{:else}
		<ShoppingV2ShopView
			items={tripSplit.available}
			unavailableItems={tripSplit.unavailable}
			focusIndex={session.focusIndex}
			tripTotal={liveTripTotal}
			pickedCount={session.pickedCount}
			{canEdit}
			{picking}
			lastPickedName={lastPicked?.name ?? null}
			{storeDedupeByKey}
			onPick={handlePick}
			onUndoPick={handleUndoPick}
			onMarkUnavailable={(item) => void toggleUnavailable(item)}
			onRestoreUnavailable={(item) => void toggleUnavailable(item)}
			onAddItem={() => void openQuickAdd()}
			onBackToPlan={handleBackToPlan}
			onScanReceipt={handleScanReceipt}
			onUnpack={() => void openUnpack()}
			{unpackLoading}
			onCompletePlan={handleCompletePlan}
			onOpenLegacy={() => {
				legacyOpen = true;
			}}
		/>
	{/if}

	{#if showAddForm && canEdit}
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

<ShoppingUnpackSheet
	open={unpackOpen}
	initialRows={unpackRows}
	onClose={() => {
		unpackOpen = false;
	}}
	onDone={handleUnpacked}
/>

<style>
	.shopping-v2-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-width: 0;
	}

	.clear-undo {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		font-size: 0.9375rem;
	}

	.clear-undo-btn {
		flex-shrink: 0;
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: underline;
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.clear-undo-btn:disabled {
		opacity: 0.55;
		cursor: progress;
	}

	.clear-undo-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.quick-add {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		min-width: 0;
		box-sizing: border-box;
	}

	.quick-add input {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		min-height: var(--touch-target-min);
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
	}

	@media (min-width: 480px) {
		.quick-add {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			grid-template-areas:
				'name name'
				'qty unit'
				'submit submit';
		}

		.quick-add input#shopping-v2-name {
			grid-area: name;
		}

		.quick-add input[name='quantity'] {
			grid-area: qty;
		}

		.quick-add input[name='unit'] {
			grid-area: unit;
		}

		.quick-add :global(.btn) {
			grid-area: submit;
		}
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
