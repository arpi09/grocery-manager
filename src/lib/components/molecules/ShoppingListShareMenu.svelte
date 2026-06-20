<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { fetchCheckedShoppingItems } from '$lib/client/shopping-data';
	import { trackProductEvent } from '$lib/client/product-events';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';
	import { buildAcquisitionRegisterUrl } from '$lib/marketing/acquisition-attribution';
	import {
		dismissValueMomentInvite,
		recordShoppingListExport,
		shouldShowValueMomentInvite
	} from '$lib/utils/household-invite-prompt';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		appendShoppingListExportFooter,
		formatShoppingListExportByFormat,
		type ShoppingListExportFormat
	} from '$lib/utils/shopping-list-export';

	interface Props {
		uncheckedItems: ShoppingListItem[];
		checkedCount: number;
		canEdit: boolean;
		shareLinkEnabled?: boolean;
		memberCount?: number;
	}

	let {
		uncheckedItems,
		checkedCount,
		canEdit,
		shareLinkEnabled = false,
		memberCount = 0
	}: Props = $props();

	let exportCopiedFormat = $state<ShoppingListExportFormat | null>(null);
	let shareLinkCopied = $state(false);
	let shareLinkSubmitting = $state(false);
	let shareMenuOpen = $state(false);

	const hasShareableItems = $derived(uncheckedItems.length > 0 || checkedCount > 0);

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
			return uncheckedItems;
		}
		const checkedPage = await fetchCheckedShoppingItems();
		return [
			...uncheckedItems,
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
			itemCount: uncheckedItems.length + checkedCount,
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

			if (
				memberCount === 1 &&
				page.data.user?.id &&
				shouldShowValueMomentInvite({
					context: 'list_shared',
					userId: page.data.user.id,
					memberCount
				})
			) {
				showClientToast(t('householdInvite.listSharedToast'), { variant: 'info' });
				dismissValueMomentInvite('list_shared', page.data.user.id);
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
			closeShareMenu();
		}
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

{#if canEdit && hasShareableItems}
	<div class="share-menu-row">
		<div class="share-menu-wrap">
			<button
				type="button"
				class="overflow-trigger"
				aria-expanded={shareMenuOpen}
				aria-haspopup="menu"
				aria-label={t('shopping.duoActionBar.aria')}
				data-testid="shopping-share-menu-trigger"
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
						{exportCopiedFormat === 'anylist' ? t('common.copied') : t('shopping.exportAnyList')}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.share-menu-row {
		display: flex;
		justify-content: flex-end;
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
		top: calc(100% + 0.25rem);
		right: 0;
		z-index: 20;
		min-width: 12rem;
		padding: var(--space-xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-md);
	}

	.share-menu-item {
		display: block;
		width: 100%;
		padding: 0.55rem 0.75rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		font: inherit;
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
		color: var(--color-text);
	}

	.share-menu-item:hover:not(:disabled) {
		background: var(--color-surface-muted);
		color: var(--color-primary);
	}

	.share-menu-item:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
