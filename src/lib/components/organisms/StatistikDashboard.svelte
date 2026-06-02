<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import MilestonesSection from '$lib/components/molecules/MilestonesSection.svelte';
	import type { StatistikDashboard } from '$lib/application/statistik.service';
	import type { MilestoneState } from '$lib/domain/gamification';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { maxWeeklyCount } from '$lib/domain/statistik';
	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	interface Props {
		dashboard: StatistikDashboard;
		milestones?: MilestoneState[];
	}

	let { dashboard, milestones = [] }: Props = $props();
	const { analytics, addedTrend, addedWeekOverWeek, impact } = $derived(dashboard);
	const isEmpty = $derived(analytics.totalItems === 0);
	const addedMax = $derived(maxWeeklyCount(addedTrend));
	const consumedMax = $derived(maxWeeklyCount(impact.consumedTrend));

	const locationIcons: Record<StorageLocation, FeatureIconId> = {
		fridge: 'fridge',
		freezer: 'freezer',
		cupboard: 'cupboard'
	};

	function formatDelta(delta: number | null | undefined): string {
		if (delta == null) return '—';
		return delta > 0 ? `+${delta}` : String(delta);
	}

	function formatOptional(value: number | null | undefined): string {
		return value == null ? '—' : String(value);
	}

	function weekLabel(label: string): string {
		return label === 'current' ? t('stats.trendCurrentWeek') : label;
	}

	function barWidth(count: number, max: number): number {
		return max === 0 ? 0 : Math.max(8, Math.round((count / max) * 100));
	}
</script>

<section class="statistik" aria-labelledby="statistik-overview-heading">
	<h2 id="statistik-overview-heading" class="sr-only">{t('stats.overviewHeading')}</h2>

	{#if isEmpty}
		<EmptyState
			iconId="barcode"
			title={t('stats.emptyTitle')}
			description={t('stats.emptyDescription')}
			actionLabel={t('stats.emptyActionScan')}
			actionHref="/scan?mode=barcode&from=/statistik"
			secondaryActionLabel={t('stats.emptyActionPhoto')}
			secondaryActionHref="/inventory/foto?from=/statistik"
		/>
	{:else}
		<div class="hero-grid" role="list" aria-label={t('stats.heroLabel')}>
			<Card class="hero-card hero-primary">
				<p class="hero-value">{analytics.totalItems}</p>
				<p class="hero-label">{t('stats.itemsInPantry')}</p>
			</Card>
			<Card class="hero-card">
				<p class="hero-value" class:alert={analytics.expiringSoonCount > 0}>{analytics.expiringSoonCount}</p>
				<p class="hero-label">{t('stats.expiringThisWeek')}</p>
			</Card>
			<Card class="hero-card">
				<p class="hero-value">{analytics.addedLast7Days}</p>
				<p class="hero-label">{t('stats.addedLastWeek')}</p>
				{#if addedWeekOverWeek}<p class="hero-meta">{t('stats.vsLastWeek', { delta: formatDelta(addedWeekOverWeek.delta) })}</p>{/if}
			</Card>
			<Card class="hero-card">
				<p class="hero-value">{formatOptional(impact.consumedThisWeek)}</p>
				<p class="hero-label">{t('stats.consumedThisWeek')}</p>
				{#if impact.consumedWeekOverWeek}
					<p class="hero-meta">{t('stats.vsLastWeek', { delta: formatDelta(impact.consumedWeekOverWeek.delta) })}</p>
				{:else if !impact.hasConsumptionData}
					<p class="hero-meta">{t('stats.noConsumptionYet')}</p>
				{/if}
			</Card>
		</div>

		<Card>
			<h2 class="section-title">{t('stats.impactTitle')}</h2>
			<p class="section-lead">{t('stats.impactLead')}</p>
			<div class="impact-grid">
				<div><p class="impact-value">{formatOptional(impact.consumedThisWeek)}</p><p class="impact-label">{t('stats.usedBeforeExpiry')}</p></div>
				<div><p class="impact-value">{formatOptional(impact.zeroWasteWeeks)}</p><p class="impact-label">{t('stats.zeroWasteWeeks')}</p></div>
				<div><p class="impact-value">{analytics.distinctProducts}</p><p class="impact-label">{t('stats.uniqueProducts')}</p></div>
			</div>
			{#if !impact.hasConsumptionData}<p class="muted">{t('stats.impactPlaceholder')}</p>{/if}
		</Card>

		{#if milestones.length > 0}
			<MilestonesSection {milestones} />
		{/if}

		<div class="trends">
			<Card>
				<h2 class="section-title label-caps">{t('stats.addedTrendTitle')}</h2>
				<ul class="trend-bars" aria-label={t('stats.addedTrendTitle')}>
					{#each addedTrend as bar (bar.weekStart)}
						<li>
							<div class="trend-row"><span>{weekLabel(bar.label)}</span><span>{bar.count}</span></div>
							<div class="track" aria-hidden="true"><div class="fill added" style="width:{barWidth(bar.count, addedMax)}%"></div></div>
						</li>
					{/each}
				</ul>
			</Card>
			<Card>
				<h2 class="section-title label-caps">{t('stats.consumedTrendTitle')}</h2>
				{#if impact.hasConsumptionData}
					<ul class="trend-bars" aria-label={t('stats.consumedTrendTitle')}>
						{#each impact.consumedTrend as bar (bar.weekStart)}
							<li>
								<div class="trend-row"><span>{weekLabel(bar.label)}</span><span>{bar.count}</span></div>
								<div class="track" aria-hidden="true"><div class="fill consumed" style="width:{barWidth(bar.count, consumedMax)}%"></div></div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted">{t('stats.consumedTrendEmpty')}</p>
				{/if}
			</Card>
		</div>

		<Card>
			<h2 class="section-title label-caps">{t('stats.byLocation')}</h2>
			<ul class="bars">
				{#each analytics.byLocationBars as bar (bar.location)}
					<li>
						<div class="bar-header">
							<span class="bar-label"><FeatureIcon id={locationIcons[bar.location]} size={18} /> {locationLabel(getLocale(), bar.location)}</span>
							<span>{bar.count}</span>
						</div>
						<div class="track" aria-hidden="true"><div class="fill" style="width:{bar.percent}%; background:{LOCATION_COLORS[bar.location]}"></div></div>
					</li>
				{/each}
			</ul>
		</Card>

		<div class="actions">
			<Card href="{APP_HOME_PATH}#eat-first" interactive class="action-card"><FeatureIcon id="home" size={22} /><div><h2>{t('stats.eatFirstCta')}</h2><p>{t('stats.eatFirstLead')}</p></div></Card>
			<Card href="/scan?mode=barcode&from=/statistik" interactive class="action-card"><FeatureIcon id="barcode" size={22} /><div><h2>{t('stats.scanCta')}</h2><p>{t('stats.scanLead')}</p></div></Card>
		</div>

		<Card class="pro-teaser">
			<p class="pro-badge label-caps">{t('stats.proBadge')}</p>
			<h2>{t('stats.proTitle')}</h2>
			<p class="muted">{t('stats.proLead')}</p>
			<a href="/priser">{t('settings.plan.learnMore')}</a>
		</Card>
	{/if}
</section>

<style>
	.statistik { display: flex; flex-direction: column; gap: var(--page-section-gap); }
	.hero-grid { display: grid; gap: var(--space-md); grid-template-columns: repeat(2, minmax(0, 1fr)); }
	@media (min-width: 768px) { .hero-grid { grid-template-columns: repeat(4, 1fr); } .trends { grid-template-columns: 1fr 1fr; } .actions { grid-template-columns: 1fr 1fr; } }
	@media (max-width: 479px) { .impact-grid { grid-template-columns: 1fr; gap: var(--space-sm); } }
	:global(.hero-card) { text-align: center; padding: var(--space-md); }
	:global(.hero-primary) { background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)); }
	.hero-value { margin: 0; font-size: 2rem; font-weight: 800; color: var(--color-primary); font-variant-numeric: tabular-nums; }
	.hero-value.alert { color: var(--color-warning, #c27803); }
	.hero-label, .impact-label, .section-lead, .muted { color: var(--color-text-muted); font-size: 0.85rem; }
	.hero-meta { margin: var(--space-xs) 0 0; font-size: 0.75rem; color: var(--color-text-muted); }
	.section-title { margin: 0 0 var(--space-sm); font-size: 0.95rem; font-weight: 700; }
	.impact-grid, .trends, .actions { display: grid; gap: var(--space-md); }
	.impact-grid { grid-template-columns: repeat(3, 1fr); text-align: center; }
	.impact-value { margin: 0; font-size: 1.5rem; font-weight: 700; }
	.trend-bars, .bars { list-style: none; margin: var(--space-md) 0 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-sm); }
	.trend-row, .bar-header { display: flex; justify-content: space-between; font-size: 0.85rem; }
	.track { height: 0.45rem; background: var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
	.fill { height: 100%; border-radius: var(--radius-sm); }
	.fill.added { background: var(--color-primary); }
	.fill.consumed { background: var(--color-success, #2d7a4f); }
	:global(.action-card) { display: flex; gap: var(--space-md); align-items: flex-start; }
	:global(.action-card) h2 { margin: 0; font-size: 1rem; }
	:global(.action-card) p { margin: var(--space-xs) 0 0; color: var(--color-text-muted); font-size: 0.85rem; }
	:global(.pro-teaser) { border-style: dashed; }
	.pro-badge { margin: 0 0 var(--space-sm); color: var(--color-primary); font-size: 0.7rem; font-weight: 700; }
</style>
