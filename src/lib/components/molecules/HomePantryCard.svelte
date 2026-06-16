<script lang="ts">
	import HomeDashboardCard from '$lib/components/molecules/HomeDashboardCard.svelte';
	import type { PantryStatusSummary } from '$lib/application/inventory.service';
	import type { LocationCount } from '$lib/domain/inventory-item';
	import { LOCATIONS } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	interface Props {
		totalItems: number;
		counts: LocationCount[];
		pantryStatus: PantryStatusSummary;
		cold?: boolean;
	}

	let { totalItems, counts, pantryStatus, cold = false }: Props = $props();

	const locale = $derived(getLocale());
	const countByLocation = $derived(
		Object.fromEntries(counts.map((entry) => [entry.location, entry.count])) as Record<
			(typeof LOCATIONS)[number],
			number
		>
	);

	const statusLine = $derived.by(() => {
		if (cold) {
			return t('home.dashboard.pantryEmpty');
		}
		if (pantryStatus.staleCount > 0) {
			return t('home.pantryStatusStale', { count: pantryStatus.staleCount });
		}
		if (pantryStatus.withoutExpiryCount > 0) {
			return t('home.pantryStatusWithoutExpiry', { count: pantryStatus.withoutExpiryCount });
		}
		if (pantryStatus.autoExpiredCount > 0) {
			return t('home.pantryStatusAutoExpired', { count: pantryStatus.autoExpiredCount });
		}
		return t('home.pantryStatusAllGood');
	});
</script>

<HomeDashboardCard
	title={t('home.dashboard.pantryTitle')}
	href="/inventory/fridge"
	testId="home-card-pantry"
	footerLabel={t('home.dashboard.pantryFooter')}
>
	{#snippet meta()}
		{#if cold}
			<p class="meta-line">{t('home.dashboard.pantryColdMeta')}</p>
		{:else}
			<p class="meta-line">{t('home.dashboard.pantryCount', { count: totalItems })}</p>
			<p class="chips" aria-label={t('home.locationsTitle')}>
				{#each LOCATIONS as location (location)}
					<span class="chip">{locationLabel(locale, location)} · {countByLocation[location] ?? 0}</span>
				{/each}
			</p>
		{/if}
	{/snippet}
	{#snippet body()}
		<p class="status-line">{statusLine}</p>
	{/snippet}
</HomeDashboardCard>

<style>
	.meta-line {
		margin: 0;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin: var(--space-xs) 0 0;
	}

	.chip {
		font-size: var(--font-size-label);
		color: var(--color-text-muted);
	}

	.status-line {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}
</style>
