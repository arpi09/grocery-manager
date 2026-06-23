<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { t } from '$lib/i18n';

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import SmartShoppingFill from '$lib/components/organisms/SmartShoppingFill.svelte';

	import Badge from '$lib/components/atoms/Badge.svelte';

	import ReplenishmentSection from '$lib/components/organisms/ReplenishmentSection.svelte';

	import ShoppingChecklistDataGrid from '$lib/components/organisms/ShoppingChecklistDataGrid.svelte';
	import ShoppingListAddForm from '$lib/components/molecules/ShoppingListAddForm.svelte';
	import ShoppingListShareMenu from '$lib/components/molecules/ShoppingListShareMenu.svelte';
	import ShoppingV2Page from '$lib/components/organisms/ShoppingV2Page.svelte';
	import InkopHouseholdInviteBanner from '$lib/components/organisms/InkopHouseholdInviteBanner.svelte';

	import { receiptOneTapHref } from '$lib/utils/scan-nav';

	import { trackProductEvent } from '$lib/client/product-events';

	let { data, form } = $props();

	const shoppingUxV2Enabled = $derived(Boolean(data.shoppingUxV2Enabled));
	const listHasItems = $derived(data.items.length > 0 || data.checkedCount > 0);
	const householdMemberCount = $derived(
		typeof data.householdMemberCount === 'number' ? data.householdMemberCount : 0
	);

	const replenishmentSuggestions = $derived(data.replenishmentSuggestions ?? []);
	const dedupeByKey = $derived(data.dedupeByKey ?? {});

	const hasSuggestions = $derived(replenishmentSuggestions.length > 0);
	const autoFillPending = $derived(data.autoFillPending);
	const RECEIPT_REPLENISHMENT_SESSION_KEY = 'home-pantry-inkop-replenishment-open';

	const fromReceipt = $derived(page.url.searchParams.get('from') === 'receipt');
	let receiptSessionOpen = $state(false);
	let showReceiptImportLead = $state(false);

	const suggestionsOpen = $derived(
		fromReceipt || receiptSessionOpen || hasSuggestions || !listHasItems
	);

	$effect(() => {
		if (!browser) {
			return;
		}
		receiptSessionOpen = sessionStorage.getItem(RECEIPT_REPLENISHMENT_SESSION_KEY) === '1';
		if (receiptSessionOpen) {
			showReceiptImportLead = true;
		}
	});

	$effect(() => {
		if (!browser || !fromReceipt) {
			return;
		}

		sessionStorage.setItem(RECEIPT_REPLENISHMENT_SESSION_KEY, '1');
		receiptSessionOpen = true;
		showReceiptImportLead = true;

		const url = new URL(page.url);
		url.searchParams.delete('from');
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	});

	function handleSuggestionsSummaryClick(event: MouseEvent) {
		const summary = event.currentTarget as HTMLElement;
		const details = summary.closest('details');
		if (details?.open) return;

		void trackProductEvent('replenishment_fold_opened', {
			hadListItems: listHasItems,
			suggestionCount: replenishmentSuggestions.length
		});
	}

	function scrollToShoppingList() {
		if (!browser) return;

		const panel = document.getElementById('shopping-list-panel');

		panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });

		panel?.focus({ preventScroll: true });
	}
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={shoppingUxV2Enabled ? t('nav.shopping') : t('shopping.title')}
		subtitle={shoppingUxV2Enabled ? undefined : t('shopping.subtitle')}
	/>

	<PageContainer>
		<div class="shopping-page">
			{#if autoFillPending && data.canEdit}
				<form
					method="POST"
					action="?/acceptAutoFill"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							scrollToShoppingList();
						};
					}}
					class="auto-fill-pending"
					data-testid="auto-fill-pending"
				>
					<p>{t('shopping.autoFillPending', { count: autoFillPending.count })}</p>
					<button type="submit" class="btn btn-secondary">
						{t('shopping.autoFillAccept')}
					</button>
				</form>
			{/if}

			{#if shoppingUxV2Enabled && data.householdId}
				<ShoppingV2Page
					items={data.items}
					checkedCount={data.checkedCount}
					canEdit={data.canEdit}
					householdId={data.householdId}
					replenishmentSuggestions={replenishmentSuggestions}
					shoppingToPantryMode={data.shoppingToPantryMode}
					shareLinkEnabled={data.shareLinkEnabled}
					memberCount={householdMemberCount}
					showReceiptImportLead={showReceiptImportLead}
					storeDedupeByKey={data.storeDedupeByKey ?? {}}
					/>
			{:else}
				<section
					id="shopping-list-panel"
					class="shopping-list-panel"
					tabindex={-1}
					aria-label={t('shopping.listAria')}
				>
					<ShoppingListShareMenu
						uncheckedItems={data.items}
						checkedCount={data.checkedCount}
						canEdit={data.canEdit}
						shareLinkEnabled={data.shareLinkEnabled}
						memberCount={householdMemberCount}
						shareFirst={data.shareLinkEnabled}
					/>


					<ShoppingChecklistDataGrid
						uncheckedItems={data.items}
						checkedCount={data.checkedCount}
						canEdit={data.canEdit}
						shoppingToPantryMode={data.shoppingToPantryMode}
					/>

					{#if data.canEdit}
						<ShoppingListAddForm variant={listHasItems ? 'default' : 'empty'} />
					{:else}
						<p class="readonly">{t('inventory.readonly')}</p>
					{/if}
				</section>

				<InkopHouseholdInviteBanner
					memberCount={householdMemberCount}
					uncheckedCount={data.items.length}
					checkedCount={data.checkedCount}
					{listHasItems}
				/>

				{#if data.canEdit}
					<div class="receipt-one-tap" data-testid="inkop-receipt-one-tap-legacy">
						<a class="btn btn-secondary btn-full" href={receiptOneTapHref('/inkop')}>
							{t('receiptAutomation.oneTapCta')}
						</a>
					</div>
				{/if}

				{#if data.canEdit && (hasSuggestions || !listHasItems)}
					{#if showReceiptImportLead}
						<p class="receipt-import-lead" role="status">{t('shopping.receiptImportLead')}</p>
					{/if}

					{#if data.showMemoryExplorer && showReceiptImportLead}
						<p class="memory-footnote">
							<a href="/settings/memory" data-analytics-id="inkop.memory_footnote">
								{t('home.v3.memoryFootnote')}
							</a>
						</p>
					{/if}

					<details
						id="shopping-suggestions"
						class="suggestions-fold"
						open={suggestionsOpen}
						data-testid="shopping-suggestions-fold"
					>
						<summary onclick={handleSuggestionsSummaryClick}>
							<span class="summary-label">{t('shopping.suggestionsTitle')}</span>
							{#if hasSuggestions}
								<Badge tone="warning">{replenishmentSuggestions.length}</Badge>
							{/if}
						</summary>

						<div class="suggestions-body">
							<SmartShoppingFill
								canEdit={data.canEdit}
								{form}
								onFillComplete={({ added }) => {
									if (added > 0) scrollToShoppingList();
								}}
							/>

							{#if hasSuggestions}
								<ReplenishmentSection
									suggestions={replenishmentSuggestions}
									{dedupeByKey}
									canEdit={data.canEdit}
									householdId={data.householdId}
									compact
									surface="inkop"
									brainFeedbackV1={Boolean(data.brainFeedbackV1Enabled)}
								/>
							{/if}
						</div>
					</details>
				{/if}
			{/if}
		</div>
	</PageContainer>
</AppLayout>

<style>
	.shopping-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-width: 0;
		padding-bottom: calc(var(--content-bottom-safe) + var(--space-md));
	}

	.auto-fill-pending {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.auto-fill-pending p {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.shopping-list-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		min-width: 0;
	}

	.memory-footnote {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.memory-footnote a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.memory-footnote a:hover {
		text-decoration: underline;
	}

	.receipt-import-lead {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		white-space: pre-line;
	}

	.receipt-one-tap {
		margin-bottom: var(--space-md);
	}

	.suggestions-fold {
		border: 1px solid var(--color-border);

		border-radius: var(--radius-md);

		background: var(--color-surface-muted);
	}

	.suggestions-fold summary {
		display: flex;

		align-items: center;

		gap: var(--space-sm);

		min-height: var(--touch-target-min);

		cursor: pointer;

		padding: 0.65rem 0.85rem;

		font-weight: 600;

		font-size: 0.875rem;

		color: var(--color-text-muted);

		list-style: none;
	}

	.suggestions-fold summary::-webkit-details-marker {
		display: none;
	}

	.summary-label {
		flex: 1;
	}

	.suggestions-body {
		display: flex;

		flex-direction: column;

		gap: var(--space-md);

		padding: 0 0.85rem 0.85rem;
	}

	.readonly {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}


	.compare-stores-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
