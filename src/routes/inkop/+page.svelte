<script lang="ts">

	import { browser } from '$app/environment';

	import { t } from '$lib/i18n';

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import SmartShoppingFill from '$lib/components/organisms/SmartShoppingFill.svelte';

	import Badge from '$lib/components/atoms/Badge.svelte';

	import ReplenishmentSection from '$lib/components/organisms/ReplenishmentSection.svelte';

	import ShoppingListPanel from '$lib/components/organisms/ShoppingListPanel.svelte';
	import InkopHouseholdInviteBanner from '$lib/components/organisms/InkopHouseholdInviteBanner.svelte';

	import { trackProductEvent } from '$lib/client/product-events';



	let { data, form } = $props();



	const listHasItems = $derived(data.items.length > 0 || data.checkedCount > 0);
	const householdMemberCount = $derived(
		typeof data.householdMemberCount === 'number' ? data.householdMemberCount : 0
	);

	const replenishmentSuggestions = $derived(data.replenishmentSuggestions ?? []);
	const dedupeByKey = $derived(data.dedupeByKey ?? {});

	const hasSuggestions = $derived(replenishmentSuggestions.length > 0);

	const suggestionsOpen = $derived(hasSuggestions || !listHasItems);

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

	<AppHeader title={t('shopping.title')} subtitle={t('shopping.subtitle')} />



	<PageContainer>
		<div class="shopping-page">

		<ShoppingListPanel

			id="shopping-list-panel"

			tabindex={-1}

			items={data.items}

			checkedCount={data.checkedCount}

			canEdit={data.canEdit}

			shareLinkEnabled={data.shareLinkEnabled}

			shoppingToPantryMode={data.shoppingToPantryMode}

			memberCount={householdMemberCount}

		/>

		<InkopHouseholdInviteBanner
			memberCount={householdMemberCount}
			uncheckedCount={data.items.length}
			checkedCount={data.checkedCount}
			{listHasItems}
		/>



		{#if data.canEdit && (hasSuggestions || !listHasItems)}

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

</style>
