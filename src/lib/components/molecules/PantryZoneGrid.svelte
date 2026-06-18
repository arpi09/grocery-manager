<script lang="ts">
	import ProductTile from '$lib/components/atoms/ProductTile.svelte';
	import type { PantryZoneShelf } from '$lib/domain/pantry-shelf';
	import { t } from '$lib/i18n';

	interface Props {
		zone: PantryZoneShelf;
	}

	let { zone }: Props = $props();

	const tableHref = $derived(`/inventory/${zone.location}`);
</script>

{#if zone.totalCount === 0}
	<p class="zone-empty">{t('pantry.v2.zone.empty')}</p>
{:else}
	<div class="tile-grid" role="list" aria-labelledby="pantry-zone-{zone.location}">
		{#each zone.tiles as tile (tile.itemId)}
			<div role="listitem">
				<ProductTile tile={tile} href="/item/{tile.itemId}/edit" />
			</div>
		{/each}
		{#if zone.overflowCount > 0}
			<div role="listitem">
				<ProductTile
					tile={{
						itemId: `overflow-${zone.location}`,
						name: t('pantry.v2.tile.moreInZone', { count: zone.overflowCount }),
						warn: false,
						detailKind: 'none',
						expiresInDays: null,
						quantity: '',
						unit: null
					}}
					href={tableHref}
					variant="overflow"
					overflowLabel={t('pantry.v2.tile.moreInZone', { count: zone.overflowCount })}
				/>
			</div>
		{/if}
	</div>
{/if}

<style>
	.zone-empty {
		margin: 0;
		padding: var(--space-md);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.tile-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-sm);
	}
</style>
