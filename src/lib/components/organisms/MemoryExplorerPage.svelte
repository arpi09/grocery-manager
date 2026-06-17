<script lang="ts">
	import MemoryDetailSheet from '$lib/components/molecules/MemoryDetailSheet.svelte';
	import MemoryEmptyState from '$lib/components/molecules/MemoryEmptyState.svelte';
	import MemoryFacetCard from '$lib/components/molecules/MemoryFacetCard.svelte';
	import type {
		HouseholdMemorySnapshot,
		MemoryFacetView
	} from '$lib/application/household-suggestions.service';
	import { t } from '$lib/i18n';

	interface Props {
		memorySnapshot: HouseholdMemorySnapshot;
		canEdit: boolean;
	}

	let { memorySnapshot, canEdit }: Props = $props();

	let selectedFacet = $state<MemoryFacetView | null>(null);
	let sheetOpen = $state(false);

	const buyAgainFacets = $derived(
		memorySnapshot.memoryFacets.filter((facet) => facet.type === 'buy_again')
	);
	const shelfLifeFacets = $derived(
		memorySnapshot.memoryFacets.filter((facet) => facet.type === 'shelf_life')
	);
	const locationFacets = $derived(
		memorySnapshot.memoryFacets.filter((facet) => facet.type === 'location')
	);

	function openFacet(facet: MemoryFacetView) {
		selectedFacet = facet;
		sheetOpen = true;
	}

	function closeSheet() {
		sheetOpen = false;
		selectedFacet = null;
	}
</script>

<div class="memory-explorer" data-testid="memory-explorer">
	{#if memorySnapshot.hasRules}
		<p class="count-banner" role="status">
			{t('memory.countBanner', { count: memorySnapshot.memoryFacets.length })}
		</p>

		{#if buyAgainFacets.length > 0}
			<section aria-labelledby="memory-buy-again-heading">
				<h2 id="memory-buy-again-heading" class="section-heading">
					{t('memory.sections.buyAgain', { count: buyAgainFacets.length })}
				</h2>
				<div class="facet-list">
					{#each buyAgainFacets as facet (facet.facetKey)}
						<MemoryFacetCard {facet} onSelect={openFacet} />
					{/each}
				</div>
			</section>
		{/if}

		{#if shelfLifeFacets.length > 0}
			<section aria-labelledby="memory-shelf-life-heading">
				<h2 id="memory-shelf-life-heading" class="section-heading">
					{t('memory.sections.shelfLife', { count: shelfLifeFacets.length })}
				</h2>
				<div class="facet-list">
					{#each shelfLifeFacets as facet (facet.facetKey)}
						<MemoryFacetCard {facet} onSelect={openFacet} />
					{/each}
				</div>
			</section>
		{/if}

		{#if locationFacets.length > 0}
			<section aria-labelledby="memory-location-heading">
				<h2 id="memory-location-heading" class="section-heading">
					{t('memory.sections.location', { count: locationFacets.length })}
				</h2>
				<div class="facet-list">
					{#each locationFacets as facet (facet.facetKey)}
						<MemoryFacetCard {facet} onSelect={openFacet} />
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<MemoryEmptyState hasReceiptData={memorySnapshot.receiptLineCount > 0} />
	{/if}
</div>

<MemoryDetailSheet open={sheetOpen} facet={selectedFacet} {canEdit} onClose={closeSheet} />

<style>
	.memory-explorer {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.count-banner {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
		line-height: 1.45;
	}

	.section-heading {
		margin: 0;
		padding: var(--space-sm) var(--space-lg) var(--space-xs);
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.facet-list {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-surface);
	}

	.facet-list :global(.facet-card:last-child) {
		border-bottom: none;
	}
</style>
