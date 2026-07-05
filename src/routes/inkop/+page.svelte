<script lang="ts">
	import { browser } from '$app/environment';
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

	const sundayProposal = $derived(data.sundayProposal ?? []);
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
			{#if data.householdId}
				<ShoppingV2Page
					items={data.items}
					checkedCount={data.checkedCount}
					canEdit={data.canEdit}
					householdId={data.householdId}
					sundayProposal={sundayProposal}
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

	.readonly {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
