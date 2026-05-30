<script lang="ts">
	import ItemRow from '$lib/components/molecules/ItemRow.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { LOCATION_LABELS, type StorageLocation } from '$lib/domain/location';

	interface Props {
		items: InventoryItem[];
		location: StorageLocation;
		canWrite?: boolean;
	}

	let { items, location, canWrite = false }: Props = $props();

	const inventoryPath = $derived(`/inventory/${location}`);
	const scanHref = $derived(
		`/scan?location=${location}&from=${encodeURIComponent(inventoryPath)}`
	);
	const manualAddHref = $derived(
		`/item/new?location=${location}&from=${encodeURIComponent(inventoryPath)}`
	);

	let query = $state('');

	const filtered = $derived(
		items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
	);
</script>

<div class="list">
	<SearchInput bind:value={query} />

	{#if filtered.length === 0}
		<EmptyState
			title={query ? 'Inga träffar' : `Tomt i ${LOCATION_LABELS[location].toLowerCase()}`}
			description={query
				? 'Prova ett annat sökord.'
				: canWrite
					? `Skanna en vara eller lägg till manuellt i ${LOCATION_LABELS[location].toLowerCase()}.`
					: `Det finns inga varor i ${LOCATION_LABELS[location].toLowerCase()} ännu.`}
			actionLabel={canWrite ? 'Skanna' : 'Tillbaka till hem'}
			actionHref={canWrite ? scanHref : '/'}
			secondaryActionLabel={canWrite ? 'Lägg till manuellt' : undefined}
			secondaryActionHref={canWrite ? manualAddHref : undefined}
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
