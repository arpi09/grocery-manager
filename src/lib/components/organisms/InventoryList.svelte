<script lang="ts">
	import ItemRow from '$lib/components/molecules/ItemRow.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { LOCATION_LABELS, type StorageLocation } from '$lib/domain/location';

	interface Props {
		items: InventoryItem[];
		location: StorageLocation;
	}

	let { items, location }: Props = $props();

	let query = $state('');

	const filtered = $derived(
		items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
	);
</script>

<div class="list">
	<SearchInput bind:value={query} />

	{#if filtered.length === 0}
		<EmptyState
			title={query ? 'No matches' : `Nothing in the ${LOCATION_LABELS[location].toLowerCase()}`}
			description={query
				? 'Try a different search term.'
				: `Add your first item to the ${LOCATION_LABELS[location].toLowerCase()}.`}
			actionLabel={`Add to ${LOCATION_LABELS[location].toLowerCase()}`}
			actionHref={`/item/new?location=${location}&from=${encodeURIComponent(`/inventory/${location}`)}`}
		/>
	{:else}
		<ul>
			{#each filtered as item (item.id)}
				<li><ItemRow {item} /></li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
