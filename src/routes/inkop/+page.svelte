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

	const hasSuggestions = $derived(receiptSuggestions.length > 0);

	const suggestionsOpen = $derived(hasSuggestions);



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
		<div class="shopping-page">

		<ShoppingListPanel

			id="shopping-list-panel"

			tabindex={-1}

			items={data.items}

			checkedCount={data.checkedCount}

			canEdit={data.canEdit}

			shoppingToPantryMode={data.shoppingToPantryMode}

		/>



		{#if data.canEdit && (hasSuggestions || !listHasItems)}

			<details class="suggestions-fold" open={suggestionsOpen} data-testid="shopping-suggestions-fold">

				<summary>{t('shopping.suggestionsTitle')}</summary>

				<div class="suggestions-body">

					<SmartShoppingFill

						canEdit={data.canEdit}

						{form}

						onFillComplete={({ added }) => {

							if (added > 0) scrollToShoppingList();

						}}

					/>



					{#if hasSuggestions}

						<ReceiptAutopilotSection

							suggestions={receiptSuggestions}

							canEdit={data.canEdit}

							compact

						/>

					{/if}

				</div>

			</details>

		{/if}
		</div>
	</PageContainer>

</AppLayout>



<style>

	.shopping-page {

		display: flex;

		flex-direction: column;

		gap: var(--space-md);

		padding-bottom: calc(var(--content-bottom-safe) + var(--space-md));

	}



	.suggestions-fold {

		border: 1px solid var(--color-border);

		border-radius: var(--radius-md);

		background: var(--color-surface-muted);

	}



	.suggestions-fold summary {

		display: flex;

		align-items: center;

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



	.suggestions-body {

		display: flex;

		flex-direction: column;

		gap: var(--space-md);

		padding: 0 0.85rem 0.85rem;

	}

</style>
