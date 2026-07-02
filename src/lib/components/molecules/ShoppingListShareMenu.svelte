<script lang="ts">

	import { browser } from '$app/environment';

	import { tick } from 'svelte';

	import { page } from '$app/state';

	import { portal } from '$lib/actions/portal';

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

		/** Prominent share CTA instead of overflow-only menu */

		shareFirst?: boolean;

	}



	let {

		uncheckedItems,

		checkedCount,

		canEdit,

		shareLinkEnabled = false,

		memberCount = 0,

		shareFirst = false

	}: Props = $props();



	let exportCopiedFormat = $state<ShoppingListExportFormat | null>(null);

	let shareLinkCopied = $state(false);

	let shareLinkSubmitting = $state(false);

	let shareMenuOpen = $state(false);

	let triggerEl = $state<HTMLButtonElement | null>(null);

	let panelStyle = $state('');



	const hasShareableItems = $derived(uncheckedItems.length > 0 || checkedCount > 0);

	const showShareFirst = $derived(shareFirst && shareLinkEnabled);

	const overflowAriaLabel = $derived(

		showShareFirst

			? t('shopping.exportListAria')

			: shareLinkEnabled

				? t('shopping.duoActionBar.aria')

				: t('shopping.exportListAria')

	);



	function closeShareMenu() {

		shareMenuOpen = false;

	}



	async function positionPanel() {

		await tick();

		if (!triggerEl) {

			return;

		}



		const rect = triggerEl.getBoundingClientRect();

		const panelWidth = 12 * 16;

		const margin = 8;

		let left = rect.right - panelWidth;

		if (left < margin) {

			left = margin;

		}

		if (left + panelWidth > window.innerWidth - margin) {

			left = window.innerWidth - panelWidth - margin;

		}



		const top = Math.max(margin, rect.bottom + margin);

		panelStyle = `top: ${top}px; left: ${left}px;`;

	}



	function toggleShareMenu() {

		const willOpen = !shareMenuOpen;

		shareMenuOpen = willOpen;

		if (willOpen) {

			void positionPanel();

		}

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



	function showListSharedToast() {

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

			showListSharedToast();



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

		void positionPanel();

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

			if (target.closest('[data-shopping-share-menu-root]')) {

				return;

			}

			closeShareMenu();

		}



		function handleKeyDown(event: KeyboardEvent) {

			if (event.key === 'Escape') {

				closeShareMenu();

			}

		}



		const id = window.setTimeout(() => {

			window.addEventListener('pointerdown', handlePointerDown);

			window.addEventListener('keydown', handleKeyDown);

		}, 0);



		return () => {

			window.clearTimeout(id);

			window.removeEventListener('pointerdown', handlePointerDown);

			window.removeEventListener('keydown', handleKeyDown);

		};

	});

</script>



{#if canEdit && hasShareableItems}

	<div

		class="share-menu-row"

		class:share-menu-row--first={showShareFirst}

		data-shopping-share-menu-root

	>

		{#if showShareFirst}

			<button

				type="button"

				class="share-primary-btn"

				disabled={shareLinkSubmitting}

				aria-label={t('shoppingListShare.shareLinkAria')}

				data-testid="shopping-share-link-primary"

				onclick={shareListLink}

			>

				{shareLinkSubmitting

					? t('common.loading')

					: shareLinkCopied

						? t('common.copied')

						: t('shoppingListShare.shareLinkPrimary')}

			</button>

		{/if}



		<div class="share-menu-wrap" data-shopping-share-menu-root>

			<button

				type="button"

				class="overflow-trigger"

				class:overflow-trigger--text={showShareFirst}

				bind:this={triggerEl}

				aria-expanded={shareMenuOpen}

				aria-haspopup="menu"

				aria-label={overflowAriaLabel}

				data-testid="shopping-share-menu-trigger"

				onclick={toggleShareMenu}

			>

				{#if showShareFirst}

					{t('shoppingListShare.exportMenuTrigger')}

				{:else}

					<span aria-hidden="true">⋮</span>

				{/if}

			</button>

			{#if shareMenuOpen}

				<div

					class="share-menu-panel"

					role="menu"

					style={panelStyle}

					data-shopping-share-menu-root

					use:portal={'body'}

				>

					{#if shareLinkEnabled && !showShareFirst}

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



	.share-menu-row--first {

		justify-content: stretch;

		align-items: center;

		gap: var(--space-sm);

	}



	.share-primary-btn {

		flex: 1;

		display: flex;

		align-items: center;

		justify-content: center;

		min-height: var(--touch-target-min);

		padding: 0.65rem 1rem;

		border: 1px solid var(--color-primary);

		border-radius: var(--radius-sm);

		background: var(--color-primary);

		color: var(--color-on-primary);

		font: inherit;

		font-size: 0.9375rem;

		font-weight: 650;

		cursor: pointer;

		text-align: center;

	}



	.share-primary-btn:disabled {

		opacity: 0.7;

		cursor: not-allowed;

	}



	.share-primary-btn:active:not(:disabled) {

		background: color-mix(in srgb, var(--color-primary) 88%, var(--color-text));

	}



	.share-menu-wrap {

		position: relative;

		flex-shrink: 0;

	}



	.overflow-trigger {

		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-width: var(--touch-target-min);

		min-height: var(--touch-target-min);

		padding: calc((var(--touch-target-min) - 1.75rem) / 2);

		border: none;

		border-radius: var(--radius-sm);

		background: transparent;

		font: inherit;

		font-size: 0.875rem;

		line-height: 1;

		cursor: pointer;

		color: var(--color-text-muted);

	}



	.overflow-trigger:hover,

	.overflow-trigger[aria-expanded='true'] {

		background: var(--color-surface-muted);

		color: var(--color-text);

	}



	.overflow-trigger:focus-visible {

		outline: 2px solid var(--color-primary);

		outline-offset: 1px;

	}



	.overflow-trigger--text {

		min-width: auto;

		padding: 0 0.35rem;

		font-size: 0.8125rem;

		font-weight: 600;

		color: var(--color-primary);

		text-decoration: underline;

		text-underline-offset: 0.15em;

	}



	.overflow-trigger--text:hover,

	.overflow-trigger--text[aria-expanded='true'] {

		background: transparent;

		color: color-mix(in srgb, var(--color-primary) 82%, var(--color-text));

	}



	.share-menu-panel {

		position: fixed;

		z-index: calc(var(--z-nav-bottom) + 12);

		min-width: 12rem;

		padding: var(--space-xs);

		padding-bottom: calc(var(--space-xs) + env(safe-area-inset-bottom, 0));

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


