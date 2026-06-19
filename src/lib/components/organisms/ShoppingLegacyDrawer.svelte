<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import ShoppingChecklistDataGrid from '$lib/components/organisms/ShoppingChecklistDataGrid.svelte';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
	import { t } from '$lib/i18n';
	import { buildAcquisitionRegisterUrl } from '$lib/marketing/acquisition-attribution';
	import { fetchCheckedShoppingItems } from '$lib/client/shopping-data';
	import { trackProductEvent } from '$lib/client/product-events';
	import { recordShoppingListExport } from '$lib/utils/household-invite-prompt';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		focusInitialElement,
		restoreFocus,
		saveFocus,
		trapFocus
	} from '$lib/utils/modal-a11y';
	import {
		appendShoppingListExportFooter,
		formatShoppingListExportByFormat,
		type ShoppingListExportFormat
	} from '$lib/utils/shopping-list-export';

	interface Props {
		open: boolean;
		items: ShoppingListItem[];
		checkedCount: number;
		canEdit: boolean;
		shareLinkEnabled: boolean;
		shoppingToPantryMode: ShoppingToPantryMode;
		memberCount: number;
		onClose: () => void;
	}

	let {
		open,
		items,
		checkedCount,
		canEdit,
		shareLinkEnabled,
		shoppingToPantryMode,
		memberCount,
		onClose
	}: Props = $props();

	let drawerEl = $state<HTMLElement | null>(null);
	let exportCopiedFormat = $state<ShoppingListExportFormat | null>(null);
	let shareLinkCopied = $state(false);
	let shareLinkSubmitting = $state(false);
	let shareMenuOpen = $state(false);

	const hasShareableItems = $derived(items.length > 0 || checkedCount > 0);

	function closeShareMenu() {
		shareMenuOpen = false;
	}

	function exportRegisterUrl(): string {
		const origin = browser ? window.location.origin : undefined;
		const url = buildAcquisitionRegisterUrl('export', origin);
		if (browser && url.startsWith('/')) {
			return `${window.location.origin}${url}`;
		}
		return url;
	}

	async function allItemsForExport(): Promise<ShoppingListItem[]> {
		if (checkedCount === 0 || !browser) {
			return items;
		}
		const checkedPage = await fetchCheckedShoppingItems();
		return [
			...items,
			...checkedPage.items.map((item) => ({
				...item,
				createdAt: new Date(item.createdAt),
				updatedAt: new Date(item.updatedAt)
			}))
		];
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
		recordShoppingListExport(page.data.user?.id);
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
			itemCount: items.length + checkedCount,
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

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			onClose();
		}
	}

	$effect(() => {
		if (!open) {
			closeShareMenu();
			return;
		}
		saveFocus();
		return () => {
			restoreFocus();
		};
	});

	$effect(() => {
		if (!open || !drawerEl) {
			return;
		}
		const releaseTrap = trapFocus(drawerEl);
		const frame = requestAnimationFrame(() => {
			if (drawerEl) {
				focusInitialElement(drawerEl);
			}
		});
		return () => {
			cancelAnimationFrame(frame);
			releaseTrap();
		};
	});

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

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
	<div
		bind:this={drawerEl}
		class="legacy-drawer"
		role="dialog"
		aria-modal="true"
		aria-label={t('shopping.v2.overflow.legacyList')}
		data-testid="shopping-v2-legacy-drawer"
	>
		<header class="drawer-header">
			<button type="button" class="back-link" onclick={onClose}>
				{t('dataGrid.backToPlan')}
			</button>
			<div class="header-actions">
				{#if canEdit && hasShareableItems}
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
									disabled={!hasShareableItems}
									onclick={() => copyExportList('bring')}
								>
									{exportCopiedFormat === 'bring' ? t('common.copied') : t('shopping.exportBring')}
								</button>
								<button
									type="button"
									class="share-menu-item"
									role="menuitem"
									disabled={!hasShareableItems}
									onclick={() => copyExportList('anylist')}
								>
									{exportCopiedFormat === 'anylist'
										? t('common.copied')
										: t('shopping.exportAnyList')}
								</button>
							</div>
						{/if}
					</div>
				{/if}
				<button type="button" class="close" onclick={onClose} aria-label={t('common.close')}>
					×
				</button>
			</div>
		</header>

		<ShoppingChecklistDataGrid
			uncheckedItems={items}
			{checkedCount}
			{canEdit}
			{shoppingToPantryMode}
		/>
	</div>
{/if}

<style>
	.legacy-drawer {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		min-width: 0;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-width: 0;
	}

	.back-link {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 650;
		color: var(--color-primary);
		cursor: pointer;
		min-height: var(--touch-target-min);
		text-align: left;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.close {
		border: none;
		background: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		color: var(--color-text-muted);
	}

	.share-menu-wrap {
		position: relative;
	}

	.overflow-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.share-menu-panel {
		position: absolute;
		top: calc(100% + var(--space-xs));
		right: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		min-width: 12rem;
		padding: var(--space-xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		box-shadow: var(--shadow-md);
	}

	.share-menu-item {
		display: block;
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		font: inherit;
		text-align: left;
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.share-menu-item:hover:not(:disabled) {
		background: var(--color-surface-muted);
	}

	.share-menu-item:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
