<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import LocationTab from '$lib/components/molecules/LocationTab.svelte';
	import InventoryList from '$lib/components/organisms/InventoryList.svelte';
	import { LOCATION_LABELS } from '$lib/domain/location';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={LOCATION_LABELS[data.location]} subtitle="Ditt skafferi" />
	<PageContainer>
		<LocationTab active={data.location} />
		<div class="toolbar">
			{#if data.canWrite}
				{@const inventoryPath = `/inventory/${data.location}`}
				{@const from = encodeURIComponent(inventoryPath)}
				{@const addItemHref = `/item/new?location=${data.location}&from=${from}`}
				{@const scanHref = `/scan?location=${data.location}&from=${from}`}
				<a class="scan-btn" href={scanHref}>📷 Skanna</a>
				<a class="add-btn add-btn--desktop" href={addItemHref}>+ Lägg till</a>
				<a class="add-btn add-btn--mobile" href={addItemHref} data-sveltekit-reload>
					+ Lägg till
				</a>
			{/if}
		</div>
		<InventoryList items={data.items} location={data.location} canWrite={data.canWrite} />
	</PageContainer>
</AppLayout>

<style>
	.toolbar {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin: var(--space-md) 0;
	}

	.scan-btn {
		display: inline-flex;
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-primary);
		color: var(--color-primary);
		background: var(--color-surface);
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}

	.scan-btn:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
	}

	.add-btn {
		display: inline-flex;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}

	.add-btn--mobile {
		display: none;
	}

	.add-btn:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	@media (max-width: 768px) {
		.add-btn--desktop {
			display: none;
		}

		.add-btn--mobile {
			display: inline-flex;
		}
	}
</style>
