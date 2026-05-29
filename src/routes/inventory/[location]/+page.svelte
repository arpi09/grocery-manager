<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import LocationTab from '$lib/components/molecules/LocationTab.svelte';
	import InventoryList from '$lib/components/organisms/InventoryList.svelte';
	import { LOCATION_LABELS } from '$lib/domain/location';

	let { data, form } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={LOCATION_LABELS[data.location]} subtitle="Ditt skafferi" />
	<PageContainer>
		<LocationTab active={data.location} />
		<div class="toolbar">
			{#if data.canWrite}
				<a
					class="add-btn"
					href="/item/new?location={data.location}&from=/inventory/{data.location}"
				>
					+ Lägg till
				</a>
			{/if}
		</div>
		<InventoryList
			items={data.items}
			location={data.location}
		/>
	</PageContainer>
</AppLayout>

<style>
	.toolbar {
		display: flex;
		justify-content: flex-end;
		margin: var(--space-md) 0;
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

	.add-btn:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}
</style>
