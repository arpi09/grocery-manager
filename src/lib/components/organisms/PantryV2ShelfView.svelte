<script lang="ts">
	import SceneIllustration from '$lib/components/atoms/SceneIllustration.svelte';
	import PantryZoneGrid from '$lib/components/molecules/PantryZoneGrid.svelte';
	import PantryZoneHeader from '$lib/components/molecules/PantryZoneHeader.svelte';
	import UseSoonBand from '$lib/components/molecules/UseSoonBand.svelte';
	import type { PantryShelfViewModel } from '$lib/domain/pantry-shelf';
	import { t } from '$lib/i18n';

	interface Props {
		shelf: PantryShelfViewModel;
	}

	let { shelf }: Props = $props();

	const useSoonHref = $derived.by(() => {
		const primaryZone =
			shelf.zones.find((zone) => zone.tiles.some((tile) => tile.warn))?.location ?? 'fridge';
		return `/inventory/${primaryZone}?filter=expiring`;
	});
</script>

<div class="pantry-shelf-view" data-testid="pantry-v2-shelf">
	<SceneIllustration
		src="/illustrations/v2/pantry-shelf.svg"
		ariaLabel={t('pantry.v2.heroAria')}
	/>

	<UseSoonBand count={shelf.useSoon.length} names={shelf.useSoonNames} href={useSoonHref} />

	{#each shelf.zones as zone (zone.location)}
		<section class="zone" aria-labelledby="pantry-zone-{zone.location}">
			<PantryZoneHeader location={zone.location} count={zone.totalCount} />
			<PantryZoneGrid {zone} />
		</section>
	{/each}
</div>

<style>
	.pantry-shelf-view {
		display: flex;
		flex-direction: column;
		gap: var(--page-section-gap, var(--space-lg));
		min-width: 0;
	}

	.zone {
		display: flex;
		flex-direction: column;
	}
</style>
