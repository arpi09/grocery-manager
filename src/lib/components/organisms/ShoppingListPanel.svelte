<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from '$lib/components/atoms/Button.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import ShoppingToPantrySheet from '$lib/components/molecules/ShoppingToPantrySheet.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import type { StorageLocation } from '$lib/domain/location';
	import {
		clearPantryBridgeYesCount,
		clearPantryBridgeYesHistory,
		recordPantryBridgeYes,
		shouldShowPantryBridgeAlwaysNudge
	} from '$lib/utils/pantry-bridge-nudge';
	import type { PantryBridgePreview } from '$lib/application/shopping-to-pantry.service';
	import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
	import { TOAST_UNDO_DURATION_MS } from '$lib/utils/action-toast';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { fetchCheckedShoppingItems } from '$lib/client/shopping-data';
	import { trackProductEvent } from '$lib/client/product-events';
	import { recordShoppingListExport } from '$lib/utils/household-invite-prompt';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { getDeleteCopy } from '$lib/utils/delete-safety';
	import { bindSubmittingWithToast } from '$lib/utils/form-submit-feedback';
	import { get } from 'svelte/store';
	import {
		formatShoppingListExportByFormat,
		formatShoppingListExportLine,
		type ShoppingListExportFormat
	} from '$lib/utils/shopping-list-export';

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
	let listaInviteVisible = $state(false);
	let listaInviteSharing = $state(false);
	let listaInviteCopied = $state(false);
	let listaInviteShownEventSent = $state(false);
	let addSubmitting = $state(false);
	let removingIds = $state(new Set<string>());
	let pantrySheetOpen = $state(false);
	let pantryBridgeItem = $state<ShoppingListItem | null>(null);
	let pantryBridgePreview = $state<PantryBridgePreview | null>(null);
	let pantryBridgeMode = $state<ShoppingToPantryMode>(shoppingToPantryMode);
	let alwaysNudgeLocation = $state<StorageLocation | null>(null);
	let alwaysNudgeDismissed = $state(false);
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

	async function copyExportList(format: ShoppingListExportFormat) {
		const exportItems = await allItemsForExport();
		const text = formatShoppingListExportByFormat(exportItems, format);
		if (!text) {
			return;
		}
		await navigator.clipboard.writeText(text);
		exportCopiedFormat = format;
		void trackProductEvent('shopping_list_export', { format });
		recordShoppingListExport(get(page).data.user?.id);
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
			if (memberCount === 1) {
				listaInviteVisible = true;
			}

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
					showSuccessToast(t('actionToast.shoppingChecked', { label: item.name }));
					await new Promise((resolve) => window.setTimeout(resolve, REMOVE_ANIMATION_MS));
				}

				if (data?.pantryAdded?.message) {
					handlePantryAdded(data.pantryAdded.message, data.pantryAdded.location);
				} else if (data?.pantryBridge) {
					pantryBridgeItem = data.pantryBridge.item;
					pantryBridgePreview = data.pantryBridge.preview;
					pantryBridgeMode = data.pantryBridge.mode;
					pantrySheetOpen = true;
				}

				const next = new Set(removingIds);
				next.delete(item.id);
				removingIds = next;
				await invalidateAll();
			}
		};
	}

	function closePantrySheet() {
		pantrySheetOpen = false;
		pantryBridgeItem = null;
		pantryBridgePreview = null;
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

	async function copyListaInviteLink(link: string) {
		if (!browser) {
			return;
		}
		await navigator.clipboard.writeText(link);
		listaInviteCopied = true;
		setTimeout(() => {
			listaInviteCopied = false;
		}, 2000);
	}

	async function shareListaInviteLink(link: string) {
		if (!browser || !navigator.share) {
			await copyListaInviteLink(link);
			return;
		}

		try {
			await navigator.share({
				title: t('household.shareInvite'),
				text: t('household.shareInviteNote'),
				url: link
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			await copyListaInviteLink(link);
		}
	}

	async function invitePartnerFromLista() {
		if (!browser || listaInviteSharing) {
			return;
		}

		void trackProductEvent('household_invite_prompt_clicked', { context: 'lista' });
		listaInviteSharing = true;
		try {
			const response = await fetch('/api/household/share-invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ context: 'lista' })
			});
			const body = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				inviteUrl?: string;
			};

			if (response.ok && body.ok && body.inviteUrl) {
				await shareListaInviteLink(body.inviteUrl);
			}
		} finally {
			listaInviteSharing = false;
		}
	}

	function dismissListaInvite() {
		void trackProductEvent('household_invite_prompt_dismissed', { context: 'lista' });
		listaInviteVisible = false;
		listaInviteShownEventSent = false;
	}

	$effect(() => {
		if (!listaInviteVisible || listaInviteShownEventSent) {
			if (!listaInviteVisible) {
				listaInviteShownEventSent = false;
			}
			return;
		}

		void trackProductEvent('household_invite_prompt_shown', { context: 'lista' });
		listaInviteShownEventSent = true;
	});
</script>

<section
	class="panel"
	id={panelId}
	tabindex={panelTabindex}
	aria-label={t('shopping.listAria')}
>
	{#if items.length > 0 || checkedCount > 0}
		<p class="intro">{t('shopping.intro')}</p>
	{/if}

	{#if canEdit}
		<form
			method="POST"
			action="?/add"
			use:enhance={bindSubmittingWithToast(
				(v) => (addSubmitting = v),
				() => showSuccessToast(t('actionToast.shoppingAdded'))
			)}
			class="add-form"
		>
			<div class="add-row">
				<input
					id="shopping-name"
					name="name"
					required
					maxlength="200"
					placeholder={t('shopping.itemPlaceholder')}
					aria-label={t('shopping.itemPlaceholder')}
				/>
				<input name="quantity" inputmode="decimal" placeholder={t('shopping.quantityPlaceholder')} aria-label={t('shopping.quantityPlaceholder')} />
				<input name="unit" maxlength="40" placeholder={t('shopping.unitPlaceholder')} aria-label={t('shopping.unitPlaceholder')} />
				<Button
					type="submit"
					loading={addSubmitting}
					loadingLabel={t('common.saving')}
					aria-label={t('shopping.addLabel')}
				>
					+
				</Button>
			</div>
		</form>
	{:else}
		<p class="readonly">{t('inventory.readonly')}</p>
	{/if}

	{#if items.length === 0 && checkedCount === 0}
		<EmptyState
			iconId="box"
			title={t('shopping.emptyList')}
			description={t('shopping.emptyDescription')}
			actionLabel={t('shopping.emptyAction')}
			actionHref="#shopping-suggestions"
		/>
	{:else}
		<SearchInput bind:value={listQuery} placeholder={t('shopping.searchPlaceholder')} />
		<ul class="list">
			{#each unchecked as item (item.id)}
				<li class:removing={removingIds.has(item.id)}>
					{#if canEdit}
						<form method="POST" action="?/toggle" class="row-form" use:enhance={createToggleEnhance(item)}>
							<input type="hidden" name="id" value={item.id} />
							<label class="check-row">
								<input type="checkbox" onchange={(e) => e.currentTarget.form?.requestSubmit()} />
								<span>{formatLine(item)}</span>
							</label>
						</form>
						<DeleteConfirmButton
							tier={1}
							context="shoppingListItem"
							copyOptions={{ itemName: item.name }}
							action="?/remove"
							variant="ghost"
							submitEnhance={createRemoveEnhance(item)}
							label="×"
							ariaLabel={t('shopping.removeLine', { line: formatLine(item) })}
							class="remove-trigger"
						>
							<input type="hidden" name="id" value={item.id} />
						</DeleteConfirmButton>
					{:else}
						<span>{formatLine(item)}</span>
					{/if}
				</li>
			{/each}
		</ul>

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
					<ul class="list checked">
						{#each visibleChecked as item (item.id)}
							<li>
								{#if canEdit}
									<form method="POST" action="?/toggle" class="row-form" use:enhance={createToggleEnhance(item)}>
										<input type="hidden" name="id" value={item.id} />
										<label class="check-row">
											<input type="checkbox" checked onchange={(e) => e.currentTarget.form?.requestSubmit()} />
											<span>{formatLine(item)}</span>
										</label>
									</form>
								{:else}
									<span class="done">{formatLine(item)}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		{#if listaInviteVisible && shareLinkEnabled}
			<aside
				class="lista-invite-banner"
				role="region"
				aria-label={t('householdInvite.listaBannerAria')}
				data-testid="lista-household-invite-banner"
			>
				<p class="lista-invite-body">{t('householdInvite.listaBannerBody')}</p>
				<div class="lista-invite-actions">
					<Button
						type="button"
						variant="primary"
						disabled={listaInviteSharing}
						data-analytics-id="household_invite.lista_cta"
						onclick={invitePartnerFromLista}
					>
						{listaInviteSharing
							? t('common.loading')
							: listaInviteCopied
								? t('common.copied')
								: t('householdInvite.listaBannerCta')}
					</Button>
					<Button type="button" variant="ghost" onclick={dismissListaInvite}>
						{t('householdInvite.listaBannerDismiss')}
					</Button>
				</div>
			</aside>
		{/if}

		{#if canEdit}
			<div class="panel-footer">
				{#if shareLinkEnabled}
					<button
						type="button"
						class="text-action"
						disabled={!hasShareableItems || shareLinkSubmitting}
						aria-label={hasShareableItems ? t('shoppingListShare.shareLinkAria') : t('shopping.exportEmpty')}
						onclick={shareListLink}
					>
						{shareLinkCopied ? t('common.copied') : t('shoppingListShare.shareLink')}
					</button>
				{/if}
				<button
					type="button"
					class="text-action"
					disabled={unchecked.length === 0 && checkedCount === 0}
					aria-label={unchecked.length === 0 ? t('shopping.exportEmpty') : t('shopping.exportBringAria')}
					onclick={() => copyExportList('bring')}
				>
					{exportCopiedFormat === 'bring' ? t('common.copied') : t('shopping.exportBring')}
				</button>
				<button
					type="button"
					class="text-action"
					disabled={unchecked.length === 0 && checkedCount === 0}
					aria-label={unchecked.length === 0 ? t('shopping.exportEmpty') : t('shopping.exportAnyListAria')}
					onclick={() => copyExportList('anylist')}
				>
					{exportCopiedFormat === 'anylist' ? t('common.copied') : t('shopping.exportAnyList')}
				</button>
			</div>
		{/if}
	{/if}
</section>

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
	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		min-width: 0;
	}

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

	.panel-footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding-top: var(--space-xs);
		border-top: 1px solid var(--color-border);
	}

	.panel-footer .text-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.5rem;
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

	.add-row {
		display: grid;
		grid-template-columns: 1fr 5rem 5rem auto;
		gap: var(--space-sm);
	}

	.add-row input {
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.65rem;
		background: var(--color-surface-muted);
		transition:
			opacity 0.24s ease,
			transform 0.24s ease,
			max-height 0.24s ease,
			margin 0.24s ease,
			padding 0.24s ease;
	}

	.list li.removing {
		opacity: 0;
		transform: translateX(0.75rem);
		max-height: 0;
		margin: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-width: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.list.checked li {
		opacity: 0.65;
		text-decoration: line-through;
	}

	.row-form {
		flex: 1;
		margin: 0;
	}

	:global(.remove-trigger .btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0.35rem 0.5rem;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		color: var(--color-text-muted);
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
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

		.add-row {
			grid-template-columns: auto minmax(4rem, 0.6fr) minmax(7rem, 1fr);
		}

		.add-row input:first-of-type {
			grid-column: 1 / -1;
		}

		.add-row input[name='quantity'] {
			grid-column: 2;
		}

		.add-row input[name='unit'] {
			grid-column: 3;
		}

		.add-row input {
			min-width: 0;
			min-height: 2.75rem;
			width: 100%;
		}

		.add-row :global(.btn) {
			grid-column: 1;
			grid-row: 2;
			min-width: 2.75rem;
			padding-inline: 0.85rem;
		}

		.panel-footer {
			justify-content: stretch;
		}

		.panel-footer .text-action {
			flex: 1 1 auto;
			min-width: min(100%, 10rem);
		}

		.list li {
			min-height: 2.75rem;
		}

		.check-row {
			min-height: 2.75rem;
		}

		:global(.remove-trigger .btn) {
			min-width: var(--touch-target-min);
			min-height: var(--touch-target-min);
		}

		.checked-head {
			flex-direction: column;
			align-items: stretch;
		}

	}
</style>
