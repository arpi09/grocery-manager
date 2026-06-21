<script lang="ts">
	import PantryZoneGrid from '$lib/components/molecules/PantryZoneGrid.svelte';
	import PantryZoneHeader from '$lib/components/molecules/PantryZoneHeader.svelte';
	import UseSoonBand from '$lib/components/molecules/UseSoonBand.svelte';
	import {
		trackPantryUseSoonTapped,
		trackPantryZoneOpened
	} from '$lib/client/pantry-v2-telemetry';
	import type { PantryShelfViewModel } from '$lib/domain/pantry-shelf';

	interface Props {
		shelf: PantryShelfViewModel;
	}

	let { shelf }: Props = $props();

	const useSoonHref = '/inventory/all?filter=expiring';

	function handleUseSoonTap() {
		trackPantryUseSoonTapped(shelf.useSoon.length);
	}

	function handleZoneOpen(location: PantryShelfViewModel['zones'][number]['location'], itemCount: number) {
		trackPantryZoneOpened(location, itemCount);
	}
</script>

<div class="pantry-shelf-view" data-testid="pantry-v2-shelf">
	<UseSoonBand count={shelf.useSoon.length} names={shelf.useSoonNames} href={useSoonHref} onTap={handleUseSoonTap} />

	{#each shelf.zones as zone (zone.location)}
		<section class="zone" aria-labelledby="pantry-zone-{zone.location}">
			<PantryZoneHeader
				location={zone.location}
				count={zone.totalCount}
				onViewAll={() => handleZoneOpen(zone.location, zone.totalCount)}
			/>
			<PantryZoneGrid {zone} onZoneOpen={() => handleZoneOpen(zone.location, zone.totalCount)} />
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
