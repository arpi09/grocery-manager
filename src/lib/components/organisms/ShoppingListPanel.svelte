<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from '$lib/components/atoms/Button.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import ShoppingListRow from '$lib/components/molecules/ShoppingListRow.svelte';
	import SkaffuList from '$lib/components/molecules/SkaffuList.svelte';
	import SkaffuListPanel from '$lib/components/molecules/SkaffuListPanel.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import ShoppingToPantrySheet from '$lib/components/molecules/ShoppingToPantrySheet.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import type { StorageLocation } from '$lib/domain/location';
	import {
		clearPantryBridgeYesCount,
		clearPantryBridgeYesHistory,
		getPantryBridgeYesCountForUser,
		markFirstCheckoffCoachSeen,
		PANTRY_BRIDGE_ALWAYS_THRESHOLD,
		recordPantryBridgeYes,
		shouldShowFirstCheckoffCoach,
		shouldShowPantryBridgeAlwaysNudge
	} from '$lib/utils/pantry-bridge-nudge';
	import type { PantryBridgePreview } from '$lib/application/shopping-to-pantry.service';
	import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
	import { TOAST_UNDO_DURATION_MS } from '$lib/utils/action-toast';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { fetchCheckedShoppingItems } from '$lib/client/shopping-data';
	import { trackProductEvent } from '$lib/client/product-events';
	import { recordShoppingListExport } from '$lib/utils/household-invite-prompt';
	import { recordShoppingListItemActivation } from '$lib/utils/onboarding';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { getDeleteCopy } from '$lib/utils/delete-safety';
	import { bindSubmittingWithToast } from '$lib/utils/form-submit-feedback';
	import { get } from 'svelte/store';
	import { buildAcquisitionRegisterUrl } from '$lib/marketing/acquisition-attribution';
	import { INKOP_PATH } from '$lib/navigation/app-home';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import {
		appendShoppingListExportFooter,
		formatShoppingListExportByFormat,
		formatShoppingListExportLine,
		type ShoppingListExportFormat
	} from '$lib/utils/shopping-list-export';

	const shoppingEmptyScanHref = scanModeHref('receipt', INKOP_PATH);

	let {
		items,
		checkedCount = 0,
		canEdit,
		shareLinkEnabled = false,
		shoppingToPantryMode = 'ask',
		memberCount = 0,
		id: panelId,
		tabindex: panelTabindex
	}: {
		items: ShoppingListItem[];
		checkedCount?: number;
		canEdit: boolean;
		shareLinkEnabled?: boolean;
		shoppingToPantryMode?: ShoppingToPantryMode;
		memberCount?: number;
		id?: string;
		tabindex?: number;
	} = $props();

	let listQuery = $state('');

	function formatLine(item: ShoppingListItem): string {
		return formatShoppingListExportLine(item);
	}

	function matchesListQuery(item: ShoppingListItem, query: string): boolean {
		if (!query) {
			return true;
		}
		return formatLine(item).toLowerCase().includes(query);
	}

	const unchecked = $derived(
		items.filter((item) => {
			if (item.checked) {
				return false;
			}
			const q = listQuery.trim().toLowerCase();
			return matchesListQuery(item, q);
		})
	);
	let checked = $state<ShoppingListItem[]>([]);
	let checkedLoaded = $state(false);
	let loadingChecked = $state(false);
	let showChecked = $state(false);

	$effect.pre(() => {
		void items.length;
		void checkedCount;
		checked = [];
		checkedLoaded = false;
		showChecked = false;
	});

	const visibleChecked = $derived(
		showChecked
			? checked.filter((item) => {
					const q = listQuery.trim().toLowerCase();
					return matchesListQuery(item, q);
				})
			: []
	);

	let undoPayload = $state<{
		name: string;
		quantity: string | null;
		unit: string | null;
	} | null>(null);
	let undoSubmitting = $state(false);
	let exportCopiedFormat = $state<ShoppingListExportFormat | null>(null);
	let shareLinkCopied = $state(false);
	let shareLinkSubmitting = $state(false);
	let shareMenuOpen = $state(false);
	let addSubmitting = $state(false);
	let removingIds = $state(new Set<string>());
	let pantrySheetOpen = $state(false);
	let pantryBridgeItem = $state<ShoppingListItem | null>(null);
	let pantryBridgePreview = $state<PantryBridgePreview | null>(null);
	let pantryBridgeMode = $state<ShoppingToPantryMode>(shoppingToPantryMode);
	let alwaysNudgeLocation = $state<StorageLocation | null>(null);
	let alwaysNudgeDismissed = $state(false);
	let showFirstPantryCoach = $state(false);
	const REMOVE_ANIMATION_MS = 280;

	$effect(() => {
		pantryBridgeMode = shoppingToPantryMode;
	});

	const undoCopy = $derived(getDeleteCopy(1, 'shoppingListItem'));
	const hasShareableItems = $derived(unchecked.length > 0 || checkedCount > 0);
	const undoMessage = $derived(
		undoPayload
			? getDeleteCopy(1, 'shoppingListItem', { itemName: undoPayload.name }).undoToastMessage ??
					t('delete.shoppingItem.undo')
			: ''
	);

	async function ensureCheckedLoaded() {
		if (checkedLoaded || checkedCount === 0 || !browser) {
			return;
		}

		loadingChecked = true;
		try {
			const checkedPage = await fetchCheckedShoppingItems();
			checked = checkedPage.items;
			checkedLoaded = true;
		} finally {
			loadingChecked = false;
		}
	}

	async function toggleCheckedSection() {
		const next = !showChecked;
		showChecked = next;
		if (next) {
			await ensureCheckedLoaded();
		}
	}

	async function allItemsForExport(): Promise<ShoppingListItem[]> {
		await ensureCheckedLoaded();
		return [...unchecked, ...checked];
	}

	function exportRegisterUrl(): string {
		const origin = browser ? window.location.origin : undefined;
		const url = buildAcquisitionRegisterUrl('export', origin);
		if (browser && url.startsWith('/')) {
			return `${window.location.origin}${url}`;
		}
		return url;
	}

	function closeShareMenu() {
		shareMenuOpen = false;
	}

	async function copyExportList(format: ShoppingListExportFormat) {
		const exportItems = await allItemsForExport();
		let text = formatShoppingListExportByFormat(exportItems, format);
		if (!text) {
			return;
		}
		if (shareLinkEnabled) {
			text = appendShoppingListExportFooter(
				text,
				t('shopping.exportFooter', { url: exportRegisterUrl() })
			);
		}
		await navigator.clipboard.writeText(text);
		exportCopiedFormat = format;
		void trackProductEvent('shopping_list_export', { format });
		recordShoppingListExport(get(page).data.user?.id);
		closeShareMenu();
		setTimeout(() => {
			exportCopiedFormat = null;
		}, 2000);
	}

	async function copyShareLink(link: string) {
		if (!browser) {
			return;
		}
		await navigator.clipboard.writeText(link);
		shareLinkCopied = true;
		setTimeout(() => {
			shareLinkCopied = false;
		}, 2000);
	}

	async function shareListLink() {
		if (!browser || shareLinkSubmitting || !hasShareableItems) {
			return;
		}

		void trackProductEvent('shopping_list_share_clicked', {
			itemCount: unchecked.length + checkedCount,
			memberCount
		});

		shareLinkSubmitting = true;
		try {
			const response = await fetch('/api/shopping-list/share', { method: 'POST' });
			const body = (await response.json()) as { ok?: boolean; url?: string; error?: string };
			if (!response.ok || !body.ok || !body.url) {
				showClientToast(body.error ?? t('shoppingListShare.shareLinkError'), { variant: 'error' });
				return;
			}

			await copyShareLink(body.url);

			if (navigator.share && navigator.canShare?.({ url: body.url })) {
				try {
					await navigator.share({
						title: t('shoppingListShare.shareLinkTitle'),
						text: t('shoppingListShare.shareLinkNote'),
						url: body.url
					});
				} catch (error) {
					if (error instanceof DOMException && error.name === 'AbortError') {
						return;
					}
				}
			}
		} catch {
			showClientToast(t('shoppingListShare.shareLinkError'), { variant: 'error' });
		} finally {
			shareLinkSubmitting = false;
			closeShareMenu();
		}
	}

	function createRemoveEnhance(item: ShoppingListItem): SubmitFunction {
		return () => {
			const snapshot = {
				name: item.name,
				quantity: item.quantity,
				unit: item.unit
			};
			return async ({ update }) => {
				await update();
				undoPayload = snapshot;
			};
		};
	}

	async function autoAddPantryBridge(bridge: {
		item: ShoppingListItem;
		preview: PantryBridgePreview;
		mode: ShoppingToPantryMode;
	}): Promise<boolean> {
		const formData = new FormData();
		formData.set('shoppingItemId', bridge.item.id);
		formData.set('location', bridge.preview.location);
		formData.set('quantity', bridge.preview.quantity);
		formData.set('unit', bridge.preview.unit ?? '');
		formData.set('merge', bridge.preview.mergeCandidate ? '1' : '0');
		formData.set('shoppingToPantryMode', bridge.mode);

		try {
			const response = await fetch('?/addToPantry', {
				method: 'POST',
				body: formData,
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await response.text()) as {
				type: string;
				data?: { pantryAdded?: { message?: string; location?: StorageLocation } };
			};

			if (result.type === 'success' && result.data?.pantryAdded?.message) {
				handlePantryAdded(result.data.pantryAdded.message, result.data.pantryAdded.location);
				return true;
			}
		} catch {
			// Fall back to the sheet when auto-add fails.
		}

		return false;
	}

	function shouldAutoAddPantryBridge(userId: string | undefined): boolean {
		if (!userId || pantryBridgeMode !== 'ask') {
			return false;
		}
		return (
			getPantryBridgeYesCountForUser(userId) >= PANTRY_BRIDGE_ALWAYS_THRESHOLD - 1
		);
	}

	function createToggleEnhance(item: ShoppingListItem): SubmitFunction {
		return () => async ({ result, update }) => {
			const isCheckingOff = !item.checked;
			await update();
			if (result.type === 'success') {
				const data = result.data as
					| {
							pantryBridge?: {
								item: ShoppingListItem;
								preview: PantryBridgePreview;
								mode: ShoppingToPantryMode;
							};
							pantryAdded?: {
								message?: string;
								auto?: boolean;
								location?: StorageLocation;
							};
					  }
					| undefined;

				if (isCheckingOff) {
					removingIds = new Set([...removingIds, item.id]);
					const pantryAutoAdded = Boolean(
						data?.pantryAdded?.message && data.pantryAdded.auto
					);
					if (!pantryAutoAdded) {
						showSuccessToast(t('actionToast.shoppingChecked', { label: item.name }));
					}
					await new Promise((resolve) => window.setTimeout(resolve, REMOVE_ANIMATION_MS));
				}

				if (data?.pantryAdded?.message) {
					handlePantryAdded(data.pantryAdded.message, data.pantryAdded.location);
				} else if (data?.pantryBridge) {
					const userId = get(page).data.user?.id;
					if (shouldAutoAddPantryBridge(userId)) {
						const autoAdded = await autoAddPantryBridge(data.pantryBridge);
						if (autoAdded) {
							const next = new Set(removingIds);
							next.delete(item.id);
							removingIds = next;
							await invalidateAll();
							return;
						}
					}

					pantryBridgeItem = data.pantryBridge.item;
					pantryBridgePreview = data.pantryBridge.preview;
					pantryBridgeMode = data.pantryBridge.mode;
					showFirstPantryCoach = Boolean(userId && shouldShowFirstCheckoffCoach(userId));
					pantrySheetOpen = true;
				}

				const next = new Set(removingIds);
				next.delete(item.id);
				removingIds = next;
				await invalidateAll();
			} else if (result.type === 'failure') {
				showClientToast((result.data as { message?: string } | undefined)?.message ?? t('actionToast.shoppingCheckoffFailed'), { variant: 'error' });
			}
		};
	}

	function closePantrySheet() {
		pantrySheetOpen = false;
		pantryBridgeItem = null;
		pantryBridgePreview = null;
		showFirstPantryCoach = false;
	}

	function dismissFirstPantryCoach() {
		const userId = get(page).data.user?.id;
		if (userId) {
			markFirstCheckoffCoachSeen(userId);
		}
		showFirstPantryCoach = false;
	}

	function skipPantrySheet() {
		closePantrySheet();
		void invalidateAll();
	}

	function showSuccessToast(message: string) {
		showClientToast(message, { variant: 'success' });
	}

	function handlePantryAdded(message: string, location?: StorageLocation) {
		showSuccessToast(message);
		const userId = get(page).data.user?.id;
		if (!location || pantryBridgeMode === 'always' || alwaysNudgeDismissed || !userId) {
			return;
		}
		recordPantryBridgeYes(userId, location);
		if (shouldShowPantryBridgeAlwaysNudge(userId)) {
			alwaysNudgeLocation = location;
		}
	}

	function dismissAlwaysNudge() {
		alwaysNudgeDismissed = true;
		const userId = get(page).data.user?.id;
		if (userId) {
			clearPantryBridgeYesHistory(userId);
		}
		if (alwaysNudgeLocation) {
			clearPantryBridgeYesCount(alwaysNudgeLocation);
		}
		alwaysNudgeLocation = null;
	}

	$effect(() => {
		if (shoppingToPantryMode === 'always') {
			alwaysNudgeLocation = null;
		}
	});

	function createClearCheckedEnhance(): SubmitFunction {
		return () => async ({ result, update }) => {
			await update();
			if (result.type === 'success') {
				showSuccessToast(t('actionToast.shoppingCleared'));
				await invalidateAll();
			}
		};
	}

	async function undoRemove() {
		if (!undoPayload) {
			return;
		}
		undoSubmitting = true;
		const formData = new FormData();
		formData.set('name', undoPayload.name);
		if (undoPayload.quantity) {
			formData.set('quantity', undoPayload.quantity);
		}
		if (undoPayload.unit) {
			formData.set('unit', undoPayload.unit);
		}
		try {
			await fetch('?/add', { method: 'POST', body: formData });
			undoPayload = null;
			await invalidateAll();
		} finally {
			undoSubmitting = false;
		}
	}

	

	function dismissUndo() {
		undoPayload = null;
	}

	$effect(() => {
		if (!shareMenuOpen) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			if (target.closest('.share-menu-wrap')) {
				return;
			}
			closeShareMenu();
		}

		const id = window.setTimeout(() => {
			window.addEventListener('pointerdown', handlePointerDown);
		}, 0);

		return () => {
			window.clearTimeout(id);
			window.removeEventListener('pointerdown', handlePointerDown);
		};
	});
</script>

<SkaffuListPanel
	class="panel"
	id={panelId}
	tabindex={panelTabindex}
	aria-label={t('shopping.listAria')}
>
	{#snippet header()}
		{#if (canEdit && (items.length > 0 || checkedCount > 0)) || items.length > 0 || checkedCount > 0}
			<div class="panel-header-row">
				{#if items.length > 0 || checkedCount > 0}
					<div class="panel-search">
						<SearchInput bind:value={listQuery} placeholder={t('shopping.searchPlaceholder')} />
					</div>
				{/if}
				{#if canEdit && (items.length > 0 || checkedCount > 0)}
					<div class="share-menu-wrap">
						<button
							type="button"
							class="overflow-trigger"
							aria-expanded={shareMenuOpen}
							aria-haspopup="menu"
							aria-label={t('shopping.duoActionBar.aria')}
							onclick={() => (shareMenuOpen = !shareMenuOpen)}
						>
							⋯
						</button>
						{#if shareMenuOpen}
							<div class="share-menu-panel" role="menu">
								{#if shareLinkEnabled}
									<button
										type="button"
										class="share-menu-item"
										role="menuitem"
										disabled={!hasShareableItems || shareLinkSubmitting}
										onclick={shareListLink}
									>
										{shareLinkCopied ? t('common.copied') : t('shoppingListShare.shareLink')}
									</button>
								{/if}
								<button
									type="button"
									class="share-menu-item"
									role="menuitem"
									disabled={unchecked.length === 0 && checkedCount === 0}
									onclick={() => copyExportList('bring')}
								>
									{exportCopiedFormat === 'bring' ? t('common.copied') : t('shopping.exportBring')}
								</button>
								<button
									type="button"
									class="share-menu-item"
									role="menuitem"
									disabled={unchecked.length === 0 && checkedCount === 0}
									onclick={() => copyExportList('anylist')}
								>
									{exportCopiedFormat === 'anylist' ? t('common.copied') : t('shopping.exportAnyList')}
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#if items.length === 0 && checkedCount === 0}
		<EmptyState
			iconId="box"
			title={t('shopping.emptyList')}
			description={t('shopping.emptyDescription')}
			actionLabel={t('shopping.emptyAction')}
			actionHref={shoppingEmptyScanHref}
			primaryAnalyticsId="shopping.empty_scan_receipt"
		/>
		{#if canEdit}
			<form
				method="POST"
				action="?/add"
				use:enhance={bindSubmittingWithToast(
					(v) => (addSubmitting = v),
					() => {
						showSuccessToast(t('actionToast.shoppingAdded'));
						recordShoppingListItemActivation(get(page).data.user?.id);
					}
				)}
				class="add-form add-form--empty"
			>
				<div class="add-card">
					<div class="add-primary">
						<input
							id="shopping-name"
							name="name"
							required
							maxlength="200"
							placeholder={t('shopping.itemPlaceholder')}
							aria-label={t('shopping.itemPlaceholder')}
						/>
						<Button
							type="submit"
							loading={addSubmitting}
							loadingLabel={t('common.saving')}
							aria-label={t('shopping.addLabel')}
						>
							+
						</Button>
					</div>
				</div>
			</form>
		{/if}
	{:else}
		<SkaffuList class="list">
			{#each unchecked as item (item.id)}
				<ShoppingListRow
					{item}
					{canEdit}
					lineLabel={formatLine(item)}
					removing={removingIds.has(item.id)}
					toggleEnhance={createToggleEnhance(item)}
					removeEnhance={createRemoveEnhance(item)}
				/>
			{/each}
		</SkaffuList>

		{#if checkedCount > 0}
			<div class="checked-block">
				<div class="checked-head">
					<button type="button" class="checked-toggle" onclick={toggleCheckedSection}>
						<h2>
							{loadingChecked && showChecked
								? t('common.loading')
								: showChecked
									? t('shopping.hideChecked')
									: t('shopping.showChecked', { count: checkedCount })}
							<span class="checked-badge">{checkedCount}</span>
						</h2>
					</button>
					{#if canEdit && showChecked && visibleChecked.length > 0}
						<DeleteConfirmButton
							tier={3}
							context="shoppingListClearChecked"
							copyOptions={{ count: visibleChecked.length }}
							action="?/clearChecked"
							submitEnhance={createClearCheckedEnhance()}
							variant="ghost"
							label={t('delete.clearChecked.confirm')}
							class="clear-checked-action"
							ariaLabel={t('shopping.clearCheckedAria')}
						/>
					{/if}
				</div>
				{#if showChecked}
					<SkaffuList class="list checked">
						{#each visibleChecked as item (item.id)}
							<ShoppingListRow
								{item}
								{canEdit}
								checked
								lineLabel={formatLine(item)}
								toggleEnhance={createToggleEnhance(item)}
							/>
						{/each}
					</SkaffuList>
				{/if}
			</div>
		{/if}

		{#if canEdit}
			<form
				method="POST"
				action="?/add"
				use:enhance={bindSubmittingWithToast(
					(v) => (addSubmitting = v),
					() => {
						showSuccessToast(t('actionToast.shoppingAdded'));
						recordShoppingListItemActivation(get(page).data.user?.id);
					}
				)}
				class="add-form"
			>
				<div class="add-card">
					<div class="add-primary">
						<input
							id="shopping-name"
							name="name"
							required
							maxlength="200"
							placeholder={t('shopping.itemPlaceholder')}
							aria-label={t('shopping.itemPlaceholder')}
						/>
						<Button
							type="submit"
							loading={addSubmitting}
							loadingLabel={t('common.saving')}
							aria-label={t('shopping.addLabel')}
						>
							+
						</Button>
					</div>
					<div class="qty-row">
						<input
							name="quantity"
							inputmode="decimal"
							placeholder={t('shopping.quantityPlaceholder')}
							aria-label={t('shopping.quantityPlaceholder')}
						/>
						<input
							name="unit"
							maxlength="40"
							placeholder={t('shopping.unitPlaceholder')}
							aria-label={t('shopping.unitPlaceholder')}
						/>
					</div>
				</div>
			</form>
		{:else}
			<p class="readonly">{t('inventory.readonly')}</p>
		{/if}
	{/if}
</SkaffuListPanel>


{#if alwaysNudgeLocation && shoppingToPantryMode !== 'always'}
	<div class="always-nudge">
		<FeedbackBanner
			tone="info"
			message={t('shopping.pantryBridge.alwaysNudge', {
				location: locationLabel(getLocale(), alwaysNudgeLocation)
			})}
		/>
		<form method="POST" action="?/savePantryMode" use:enhance={() => async ({ update }) => {
			await update();
			dismissAlwaysNudge();
			await invalidateAll();
		}}>
			<input type="hidden" name="shoppingToPantryMode" value="always" />
			<Button type="submit" variant="secondary">{t('shopping.pantryBridge.alwaysNudgeCta')}</Button>
		</form>
		<button type="button" class="text-action" onclick={dismissAlwaysNudge}>
			{t('shopping.pantryBridge.alwaysNudgeDismiss')}
		</button>
	</div>
{/if}

<ShoppingToPantrySheet
	open={pantrySheetOpen}
	item={pantryBridgeItem}
	preview={pantryBridgePreview}
	mode={pantryBridgeMode}
	showFirstCoach={showFirstPantryCoach}
	onFirstCoachDismiss={dismissFirstPantryCoach}
	onClose={closePantrySheet}
	onSkip={skipPantrySheet}
	onAdded={(message) => handlePantryAdded(message, pantryBridgePreview?.location ?? undefined)}
/>

{#if undoPayload}
	<!-- Local undo toast: longer duration + inline undo action -->
	<div class="undo-toast-wrap">
		<Toast
			message={undoMessage ?? ''}
			visible={true}
			variant="success"
			size="action"
			portal={false}
			durationMs={TOAST_UNDO_DURATION_MS}
			tapToDismiss={true}
			onDismiss={dismissUndo}
		/>
		<button
			type="button"
			class="undo-btn"
			disabled={undoSubmitting}
			onclick={undoRemove}
			aria-label={undoCopy.undoActionLabel ?? t('common.undo')}
		>
			{undoCopy.undoActionLabel ?? t('common.undo')}
		</button>
	</div>
{/if}

<style>
	.intro,
	.readonly {
		margin: 0;
		color: var(--color-text-muted);
	}

	.lista-invite-banner {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.lista-invite-body {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.lista-invite-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.panel-header-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: 0;
	}

	.panel-search {
		flex: 1;
		min-width: 0;
	}

	.panel-search :global(.search) {
		width: 100%;
	}

	.share-menu-wrap {
		flex-shrink: 0;
		position: relative;
	}

	.overflow-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		font-family: inherit;
	}

	.overflow-trigger:hover,
	.overflow-trigger[aria-expanded='true'] {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.share-menu-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.75rem;
		font-weight: 600;
	}

	.share-menu-panel {
		position: absolute;
		right: 0;
		bottom: calc(100% + 0.35rem);
		z-index: 20;
		min-width: 12rem;
		padding: var(--space-xs);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
	}

	.share-menu-item {
		display: block;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: left;
		cursor: pointer;
	}

	.share-menu-item:hover:not(:disabled) {
		background: var(--color-surface-muted);
		color: var(--color-primary);
	}

	.share-menu-item:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	:global(.clear-checked-action .btn) {
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.65rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.add-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.add-form--empty .add-card {
		background: var(--color-surface);
	}

	.add-primary {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-sm);
	}

	.add-primary input,
	.qty-row input {
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		min-height: var(--touch-target-min);
	}

	.qty-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0;
		min-width: 0;
	}

	.checked-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.checked-head h2 {
		margin: 0;
		font-size: 1rem;
	}

	.checked-toggle {
		display: inline-flex;
		align-items: center;
		border: none;
		background: transparent;
		min-height: var(--touch-target-min);
		padding: 0.375rem 0;
		cursor: pointer;
		text-align: left;
		color: inherit;
	}

	.checked-toggle:hover h2 {
		color: var(--color-primary);
	}

	.checked-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.35rem;
		height: 1.35rem;
		margin-left: var(--space-xs);
		padding: 0 0.35rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-text-muted) 14%, transparent);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.always-nudge {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.undo-toast-wrap {
		position: fixed;
		left: 50%;
		bottom: calc(var(--content-bottom-safe) + var(--space-sm));
		transform: translateX(-50%);
		z-index: var(--z-toast);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		max-width: calc(100vw - 2 * var(--page-padding-x));
	}

	.undo-btn {
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.75rem;
		font-weight: 600;
		font-size: 0.85rem;
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		box-shadow: var(--shadow-md);
	}

	.undo-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 899px) {
		.list,
		.checked-block {
			padding-bottom: calc(var(--touch-target-min) + var(--space-xl));
		}

		.add-form {
			order: 99;
			position: sticky;
			bottom: calc(var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom, 0));
			z-index: 2;
			margin-top: auto;
			margin-inline: calc(-1 * var(--space-md));
			padding: var(--space-sm) var(--space-md);
			background: var(--color-surface);
			border-top: 1px solid var(--color-border);
			box-shadow: 0 -4px 16px color-mix(in srgb, var(--color-text) 6%, transparent);
		}

		.panel-footer {
			order: 100;
			padding-bottom: var(--space-xs);
		}
	}

	@media (max-width: 640px) {
		.panel {
			padding: var(--space-sm);
		}

		.add-form,
		.panel-footer {
			margin-inline: calc(-1 * var(--space-sm));
			padding-inline: var(--space-sm);
		}

		.add-primary input,
		.qty-row input {
			min-width: 0;
			width: 100%;
		}

		.panel-footer {
			justify-content: stretch;
		}

		.share-menu-wrap {
			width: 100%;
		}

		.share-menu-trigger {
			width: 100%;
		}

		.share-menu-panel {
			left: 0;
			right: 0;
		}

		.checked-head {
			flex-direction: column;
			align-items: stretch;
		}

	}
</style>
