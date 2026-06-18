<script lang="ts">
	import { LOCATION_COLORS } from '$lib/domain/location';
	import type { StorageLocation } from '$lib/domain/location';
	import { pantryZoneTitleKey } from '$lib/domain/pantry-shelf-presenter';
	import { t } from '$lib/i18n';

	interface Props {
		location: StorageLocation;
		count: number;
	}

	let { location, count }: Props = $props();

	const zoneColor = $derived(LOCATION_COLORS[location]);
	const tableHref = $derived(`/inventory/${location}`);
</script>

<header
	class="zone-header"
	style={`--zone-color: ${zoneColor}`}
	data-testid="pantry-v2-zone-header-{location}"
>
	<div class="zone-title-row">
		<h3 id="pantry-zone-{location}">{t(pantryZoneTitleKey(location))}</h3>
		{#if count > 0}
			<a class="zone-count" href={tableHref} aria-label={t(pantryZoneTitleKey(location))}>
				{t('pantry.v2.zone.count', { count })}
			</a>
		{:else}
			<span class="zone-count">{t('pantry.v2.zone.count', { count })}</span>
		{/if}
	</div>
</header>

<style>
	.zone-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-bottom: var(--space-sm);
		padding-bottom: var(--space-xs);
		border-bottom: 3px solid var(--zone-color);
	}

	.zone-title-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	h3 {
		margin: 0;
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 700;
	}

	.zone-count {
		margin-left: auto;
		font-size: var(--font-size-label, 0.75rem);
		font-weight: 600;
		color: var(--color-text-muted);
		text-decoration: none;
		min-height: var(--touch-target-min);
		display: inline-flex;
		align-items: center;
	}

	a.zone-count:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
