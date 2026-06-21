<script lang="ts">
	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';
	import { getLocale } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	interface Props {
		location: StorageLocation;
		itemId?: string;
	}

	let { location, itemId }: Props = $props();

	const label = $derived(locationLabel(getLocale(), location));
	const testId = $derived(itemId ? `location-color-dot-${itemId}` : `location-color-dot-${location}`);
</script>

<span
	class="location-dot"
	style={`--location-color: ${LOCATION_COLORS[location]}`}
	title={label}
	aria-label={label}
	data-testid={testId}
></span>

<style>
	.location-dot {
		display: inline-block;
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background: var(--location-color);
		flex-shrink: 0;
	}
</style>
