<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { t } from '$lib/i18n';

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import ShoppingV2Page from '$lib/components/organisms/ShoppingV2Page.svelte';

	let { data } = $props();

	const householdMemberCount = $derived(
		typeof data.householdMemberCount === 'number' ? data.householdMemberCount : 0
	);

	const replenishmentSuggestions = $derived(data.replenishmentSuggestions ?? []);
	const autoFillPending = $derived(data.autoFillPending);
	const RECEIPT_REPLENISHMENT_SESSION_KEY = 'home-pantry-inkop-replenishment-open';

	const fromReceipt = $derived(page.url.searchParams.get('from') === 'receipt');
	let receiptSessionOpen = $state(false);
	let showReceiptImportLead = $state(false);

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
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('nav.shopping')} />

	<PageContainer>
		<div class="shopping-page">
			{#if autoFillPending && data.canEdit}
				<form
					method="POST"
					action="?/acceptAutoFill"
					use:enhance
					class="auto-fill-pending"
					data-testid="auto-fill-pending"
				>
					<p>{t('shopping.autoFillPending', { count: autoFillPending.count })}</p>
					<button type="submit" class="btn btn-secondary">
						{t('shopping.autoFillAccept')}
					</button>
				</form>
			{/if}

			{#if data.householdId}
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
				<p class="readonly">{t('inventory.readonly')}</p>
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

	.readonly {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
