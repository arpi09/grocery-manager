<script lang="ts">

	import { browser } from '$app/environment';

	import { t } from '$lib/i18n';

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import SmartShoppingFill from '$lib/components/organisms/SmartShoppingFill.svelte';

	import ReceiptAutopilotSection from '$lib/components/organisms/ReceiptAutopilotSection.svelte';

	import ShoppingListPanel from '$lib/components/organisms/ShoppingListPanel.svelte';



	let { data, form } = $props();



	const listHasItems = $derived(data.items.length > 0);

	const receiptSuggestions = $derived(data.receiptAutopilotSuggestions ?? []);

	const showReceiptSection = $derived(

		data.canEdit && (!listHasItems || receiptSuggestions.length > 0)

	);



	function scrollToShoppingList() {

		if (!browser) return;

		const panel = document.getElementById('shopping-list-panel');

		panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });

		panel?.focus({ preventScroll: true });

	}

</script>



<AppLayout user={data.user}>

	<AppHeader title={t('shopping.title')} subtitle={t('shopping.subtitle')} />



	<PageContainer>

		<SmartShoppingFill

			canEdit={data.canEdit}

			{form}

			onFillComplete={({ added }) => {

				if (added > 0) scrollToShoppingList();

			}}

		/>



		{#if showReceiptSection}

			{#if listHasItems && receiptSuggestions.length > 0}

				<details class="receipt-fold" data-testid="receipt-autopilot-fold">

					<summary>{t('receiptAutopilot.title')}</summary>

					<ReceiptAutopilotSection

						suggestions={receiptSuggestions}

						canEdit={data.canEdit}

						compact

					/>

				</details>

			{:else}

				<ReceiptAutopilotSection

					suggestions={receiptSuggestions}

					canEdit={data.canEdit}

					compact

				/>

			{/if}

		{/if}



		<ShoppingListPanel

			id="shopping-list-panel"

			tabindex={-1}

			items={data.items}

			checkedCount={data.checkedCount}

			canEdit={data.canEdit}

		/>

	</PageContainer>

</AppLayout>



<style>

	.receipt-fold {

		border: 1px solid var(--color-border);

		border-radius: var(--radius-md);

		background: var(--color-surface-muted);

	}



	.receipt-fold summary {

		cursor: pointer;

		padding: 0.65rem 0.85rem;

		font-weight: 600;

		font-size: 0.875rem;

		color: var(--color-text-muted);

		list-style: none;

	}



	.receipt-fold summary::-webkit-details-marker {

		display: none;

	}



	.receipt-fold :global(.autopilot) {

		padding: 0 0.85rem 0.85rem;

	}

</style>

