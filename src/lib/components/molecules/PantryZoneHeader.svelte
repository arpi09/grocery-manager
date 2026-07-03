<script lang="ts">
	import { LOCATION_COLORS } from '$lib/domain/location';
	import type { StorageLocation } from '$lib/domain/location';
	import { pantryZoneTitleKey } from '$lib/domain/pantry-shelf-presenter';
	import { t } from '$lib/i18n';

	interface Props {
		location: StorageLocation;
		count: number;
		onViewAll?: () => void;
	}

	let { location, count, onViewAll }: Props = $props();

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
		<span class="zone-count">{t('pantry.v2.zone.count', { count })}</span>
	</div>
	{#if count > 0}
		<a
			class="zone-view-all"
			href={tableHref}
			aria-label={t('pantry.v2.zone.viewAllAria', { zone: t(pantryZoneTitleKey(location)) })}
			data-testid="pantry-v2-zone-view-all-{location}"
			onclick={onViewAll}
		>
			{t('pantry.v2.zone.viewAll')}
		</a>
	{/if}
</header>

<style>
	.zone-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid color-mix(in srgb, var(--zone-color) 40%, transparent);
	}

	.zone-title-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		min-width: 0;
	}

	h3 {
		margin: 0;
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 700;
		white-space: nowrap;
	}

	.zone-count {
		font-size: var(--font-size-label, 0.75rem);
		font-weight: 600;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.zone-view-all {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		margin-block: calc((1.25rem - var(--touch-target-min)) / 2);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		white-space: nowrap;
	}

	.zone-view-all:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
