<script lang="ts">
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import MetricBar from '$lib/components/atoms/MetricBar.svelte';
	import ProgressRing from '$lib/components/atoms/ProgressRing.svelte';
	import HomeDashboardCard, {
		type HomeDashboardCardSize
	} from '$lib/components/molecules/HomeDashboardCard.svelte';
	import type { PantryStatusSummary } from '$lib/application/inventory.service';
	import type { LocationCount } from '$lib/domain/inventory-item';
	import { LOCATIONS, LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	interface Props {
		totalItems: number;
		counts: LocationCount[];
		pantryStatus: PantryStatusSummary;
		cold?: boolean;
		size?: HomeDashboardCardSize;
	}

	let { totalItems, counts, pantryStatus, cold = false, size = 'default' }: Props = $props();

	const locale = $derived(getLocale());
	const countByLocation = $derived(
		Object.fromEntries(counts.map((entry) => [entry.location, entry.count])) as Record<
			StorageLocation,
			number
		>
	);

	const showViz = $derived(!cold && totalItems > 0);

	const metricSegments = $derived(
		LOCATIONS.map((location) => ({
			key: location,
			value: countByLocation[location] ?? 0,
			color: LOCATION_COLORS[location],
			label: locationLabel(locale, location)
		}))
	);

	const metricAriaLabel = $derived(
		LOCATIONS.map(
			(location) => `${locationLabel(locale, location)} ${countByLocation[location] ?? 0}`
		).join(', ')
	);

	const statusBadge = $derived.by(() => {
		if (cold) return null;
		if (pantryStatus.staleCount > 0) {
			return t('home.pantryStatusStale', { count: pantryStatus.staleCount });
		}
		if (pantryStatus.withoutExpiryCount > 0) {
			return t('home.pantryStatusWithoutExpiry', { count: pantryStatus.withoutExpiryCount });
		}
		if (pantryStatus.autoExpiredCount > 0) {
			return t('home.pantryStatusAutoExpired', { count: pantryStatus.autoExpiredCount });
		}
		return null;
	});
</script>

<HomeDashboardCard
	title={t('home.dashboard.pantryTitle')}
	href="/inventory/fridge"
	testId="home-card-pantry"
	footerLabel={t('home.dashboard.pantryFooter')}
	{size}
>
	{#snippet icon()}
		<FeatureIcon id="fridge" size={18} />
	{/snippet}
	{#snippet meta()}
		{#if cold}
			<p class="meta-line">{t('home.dashboard.pantryColdMeta')}</p>
		{:else if showViz}
			<p class="meta-line">{t('home.dashboard.pantryCount', { count: totalItems })}</p>
			{#if statusBadge}
				<p class="status-badge">{statusBadge}</p>
			{:else}
				<p class="status-badge status-badge--good">{t('home.pantryStatusAllGood')}</p>
			{/if}
		{:else}
			<p class="meta-line">{t('home.dashboard.pantryCount', { count: totalItems })}</p>
			<p class="meta-line muted">{t('home.dashboard.pantryEmpty')}</p>
		{/if}
	{/snippet}
	{#snippet viz()}
		{#if showViz}
			<ProgressRing
				ratio={1}
				size={size === 'compact' ? 48 : 56}
				label={String(totalItems)}
				ariaLabel={t('home.dashboard.pantryCount', { count: totalItems })}
			/>
			<MetricBar segments={metricSegments} ariaLabel={metricAriaLabel} testId="home-pantry-metric-bar" />
		{/if}
	{/snippet}
</HomeDashboardCard>

<style>
	.meta-line {
		margin: 0;
	}

	.meta-line.muted {
		color: var(--color-text-muted);
	}

	.status-badge {
		margin: var(--space-xs) 0 0;
		font-size: var(--font-size-label);
		color: var(--color-warning);
	}

	.status-badge--good {
		color: var(--color-text-muted);
	}
</style>
