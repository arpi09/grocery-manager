<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData } from '$lib/client/admin-data';
	import {
		ANALYTICS_BEHAVIOR_PERIOD_DAYS,
		type AdminBehaviorFunnel,
		type AdminBehaviorHeatmap,
		type AdminBehaviorRetention,
		type AdminEventExplorer,
		type AnalyticsBehaviorPeriodDays
	} from '$lib/domain/analytics-behavior';
	import type { AdminCohortRetention } from '$lib/domain/cohort-retention';
	import {
		ADMIN_INSIGHT_CHART_KEYS,
		buildFunnelConversions,
		buildTopEvents,
		buildWeeklyEventTotals,
		DECISIONS_HEATMAP_ROUTES,
		formatRate
	} from '$lib/domain/decisions-analytics';
	import { t } from '$lib/i18n';

	interface BehaviorFunnelPayload {
		funnel: AdminBehaviorFunnel;
	}

	interface BehaviorRetentionPayload {
		retention: AdminBehaviorRetention;
	}

	interface EventExplorerPayload {
		explorer: AdminEventExplorer;
	}

	interface BehaviorHeatmapPayload {
		heatmap: AdminBehaviorHeatmap;
	}

	interface CohortRetentionPayload {
		cohortRetention: AdminCohortRetention;
	}

	interface AiInsightsPayload {
		insights: {
			summaryParagraphs: string[];
			anomalyFlags: string[];
			chartCaptions: Record<string, string>;
			generatedAt: string;
			cached: boolean;
		};
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let insightsLoading = $state(false);
	let error = $state<string | null>(null);
	let insightsError = $state<string | null>(null);
	let periodDays = $state<AnalyticsBehaviorPeriodDays>(7);
	let loadedPeriod: AnalyticsBehaviorPeriodDays | null = $state(null);
	let funnel = $state<AdminBehaviorFunnel | null>(null);
	let retention = $state<AdminBehaviorRetention | null>(null);
	let explorer = $state<AdminEventExplorer | null>(null);
	let cohortRetention = $state<AdminCohortRetention | null>(null);
	let heatmaps = $state<Record<string, AdminBehaviorHeatmap>>({});
	let insights = $state<AiInsightsPayload['insights'] | null>(null);
	let insightsRequested = $state(false);

	const funnelStepLabels: Record<string, string> = {
		landing: t('admin.decisions.funnel.landing'),
		signup: t('admin.decisions.funnel.signup'),
		home: t('admin.decisions.funnel.home'),
		first_scan: t('admin.decisions.funnel.first_scan')
	};

	const funnelRows = $derived(buildFunnelConversions(funnel?.steps ?? []));
	const topEvents = $derived(buildTopEvents(explorer?.events ?? []));
	const weeklyEvents = $derived(buildWeeklyEventTotals(explorer?.events ?? []).slice(0, 24));
	const maxFunnelCount = $derived(Math.max(1, ...(funnel?.steps.map((step) => step.count) ?? [1])));

	const caption = (key: string) => insights?.chartCaptions[key]?.trim() || null;

	$effect(() => {
		if (!active) {
			return;
		}
		if (loadedPeriod === periodDays || loading) {
			return;
		}
		void loadDecisions(periodDays);
	});

	async function loadDecisions(days: AnalyticsBehaviorPeriodDays) {
		loading = true;
		error = null;
		try {
			const [funnelPayload, retentionPayload, explorerPayload, cohortPayload, ...heatmapPayloads] =
				await Promise.all([
					fetchAdminData<BehaviorFunnelPayload>('behavior-funnel', { periodDays: days }),
					fetchAdminData<BehaviorRetentionPayload>('behavior-retention', { periodDays: days }),
					fetchAdminData<EventExplorerPayload>('event-explorer', { periodDays: days }),
					fetchAdminData<CohortRetentionPayload>('cohort-retention'),
					...DECISIONS_HEATMAP_ROUTES.map((route) =>
						fetchAdminData<BehaviorHeatmapPayload>('behavior-heatmap', {
							route,
							periodDays: days
						})
					)
				]);

			funnel = funnelPayload.funnel;
			retention = retentionPayload.retention;
			explorer = explorerPayload.explorer;
			cohortRetention = cohortPayload.cohortRetention;

			const nextHeatmaps: Record<string, AdminBehaviorHeatmap> = {};
			for (const [index, route] of DECISIONS_HEATMAP_ROUTES.entries()) {
				nextHeatmaps[route] = heatmapPayloads[index]?.heatmap ?? {
					route,
					periodDays: days,
					elements: []
				};
			}
			heatmaps = nextHeatmaps;
			loadedPeriod = days;

			if (!insightsRequested) {
				insightsRequested = true;
				void generateInsights(false);
			}
		} catch {
			error = t('admin.loadError');
			funnel = null;
			retention = null;
			explorer = null;
			cohortRetention = null;
			heatmaps = {};
			loadedPeriod = null;
		} finally {
			loading = false;
		}
	}

	async function generateInsights(refresh = false) {
		insightsLoading = true;
		insightsError = null;
		try {
			const payload = await fetchAdminData<AiInsightsPayload>(
				'ai-insights',
				refresh ? { refresh: 1 } : {}
			);
			insights = payload.insights;
		} catch {
			insightsError = t('admin.decisions.insightsError');
		} finally {
			insightsLoading = false;
		}
	}

	function selectPeriod(days: AnalyticsBehaviorPeriodDays) {
		if (days === periodDays) {
			return;
		}
		periodDays = days;
	}

	function maxHeatmapClicks(heatmap: AdminBehaviorHeatmap | undefined): number {
		return Math.max(1, ...(heatmap?.elements.map((row) => row.clickCount) ?? [1]));
	}
</script>

{#if loading && !funnel}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else if funnel && retention && explorer && cohortRetention}
	<section class="decisions-toolbar">
		<div>
			<h1 class="decisions-title">{t('admin.decisions.title')}</h1>
			<p class="muted">{t('admin.decisions.subtitle')}</p>
		</div>
		<div class="toolbar-actions">
			<div class="period-toggle" role="group" aria-label={t('admin.decisions.periodToggle')}>
				{#each ANALYTICS_BEHAVIOR_PERIOD_DAYS as days (days)}
					<button
						type="button"
						class="period-btn"
						class:active={periodDays === days}
						onclick={() => selectPeriod(days)}
					>
						{t('admin.decisions.periodOption', { days })}
					</button>
				{/each}
			</div>
			<Button
				type="button"
				variant="secondary"
				loading={insightsLoading}
				onclick={() => generateInsights(false)}
			>
				{t('admin.decisions.generateInsights')}
			</Button>
		</div>
	</section>

	{#if insights || insightsError}
		<Card>
			<h2>{t('admin.decisions.insightsTitle')}</h2>
			{#if insightsError}
				<p class="panel-error" role="alert">{insightsError}</p>
			{:else if insights}
				{#if insights.cached}
					<p class="muted">{t('admin.decisions.insightsCached')}</p>
				{/if}
				{#each insights.summaryParagraphs as paragraph, i (i)}
					<p>{paragraph}</p>
				{/each}
				{#if insights.anomalyFlags.length > 0}
					<ul class="anomaly-list">
						{#each insights.anomalyFlags as flag, i (i)}
							<li>{flag}</li>
						{/each}
					</ul>
				{/if}
				<Button
					type="button"
					variant="ghost"
					loading={insightsLoading}
					onclick={() => generateInsights(true)}
				>
					{t('admin.decisions.refreshInsights')}
				</Button>
			{/if}
		</Card>
	{/if}

	<section class="decisions-section">
		<h2>{t('admin.decisions.dropoffTitle')}</h2>
		<p class="muted">{t('admin.decisions.dropoffNote')}</p>

		<div class="decisions-grid">
			<Card>
				<h3>{t('admin.decisions.funnelTitle')}</h3>
				<ul class="funnel-bars" aria-label={t('admin.decisions.funnelTitle')}>
					{#each funnelRows as row (row.step)}
						<li>
							<div class="metric-head">
								<span>{funnelStepLabels[row.step] ?? row.step}</span>
								<strong>{row.count}</strong>
							</div>
							<div class="bar-track">
								<div
									class="bar-fill"
									style={`width: ${Math.round((row.count / maxFunnelCount) * 100)}%`}
								></div>
							</div>
							{#if row.conversionFromPrevious !== null}
								<span class="muted small">
									{t('admin.decisions.stepConversion', {
										rate: formatRate(row.conversionFromPrevious)
									})}
								</span>
							{/if}
						</li>
					{/each}
				</ul>
				{#if caption(ADMIN_INSIGHT_CHART_KEYS.funnel)}
					<p class="ai-caption">{caption(ADMIN_INSIGHT_CHART_KEYS.funnel)}</p>
				{/if}
			</Card>

			<Card>
				<h3>{t('admin.decisions.retentionTitle')}</h3>
				<ul class="retention-bars">
					{#each retention.points as point (point.dayOffset)}
						<li>
							<div class="metric-head">
								<span>D{point.dayOffset}</span>
								<strong>{Math.round(point.rate * 100)}%</strong>
							</div>
							<div class="bar-track">
								<div class="bar-fill" style={`width: ${Math.round(point.rate * 100)}%`}></div>
							</div>
							<span class="muted small">
								{t('admin.decisions.retentionDetail', {
									retained: point.retained,
									eligible: point.eligible
								})}
							</span>
						</li>
					{/each}
				</ul>
				{#if caption(ADMIN_INSIGHT_CHART_KEYS.retention)}
					<p class="ai-caption">{caption(ADMIN_INSIGHT_CHART_KEYS.retention)}</p>
				{/if}
			</Card>
		</div>

		<Card>
			<h3>{t('admin.decisions.cohortTitle')}</h3>
			<p class="muted">{t('admin.decisions.cohortNote')}</p>
			{#if cohortRetention.gated}
				<p class="cohort-gated" role="status">
					{t('admin.decisions.cohortGated', {
						eligible: cohortRetention.d30EligibleTotal,
						min: cohortRetention.minEligible
					})}
				</p>
			{:else if cohortRetention.weeks.length === 0}
				<p class="muted">{t('admin.decisions.empty')}</p>
			{:else}
				<table class="data-table cohort-table">
					<thead>
						<tr>
							<th>{t('admin.decisions.cohortWeekCol')}</th>
							<th>{t('admin.decisions.signupsCol')}</th>
							<th>D1</th>
							<th>D7</th>
							<th>D30</th>
						</tr>
					</thead>
					<tbody>
						{#each cohortRetention.weeks as week (week.weekStart)}
							<tr>
								<td>{week.weekStart}</td>
								<td>{week.signups}</td>
								<td>{formatRate(week.d1.eligible > 0 ? week.d1.rate : null)}</td>
								<td>{formatRate(week.d7.eligible > 0 ? week.d7.rate : null)}</td>
								<td>{formatRate(week.d30.eligible > 0 ? week.d30.rate : null)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="cohort-legend" aria-hidden="true">
					<span class="legend-d1"></span> D1
					<span class="legend-d7"></span> D7
					<span class="legend-d30"></span> D30
				</div>
				{#if caption(ADMIN_INSIGHT_CHART_KEYS.cohort)}
					<p class="ai-caption">{caption(ADMIN_INSIGHT_CHART_KEYS.cohort)}</p>
				{/if}
			{/if}
		</Card>
	</section>

	<section class="decisions-section">
		<h2>{t('admin.decisions.usageTitle')}</h2>
		<p class="muted">{t('admin.decisions.usageNote')}</p>

		<div class="decisions-grid">
			<Card>
				<h3>{t('admin.decisions.topEventsTitle')}</h3>
				{#if topEvents.length === 0}
					<p class="muted">{t('admin.decisions.empty')}</p>
				{:else}
					<ol class="top-events">
						{#each topEvents as row, index (row.eventType)}
							<li>
								<span class="rank">#{index + 1}</span>
								<code>{row.eventType}</code>
								<strong>{row.count}</strong>
							</li>
						{/each}
					</ol>
				{/if}
			</Card>

			<Card>
				<h3>{t('admin.decisions.weeklyEventsTitle')}</h3>
				{#if weeklyEvents.length === 0}
					<p class="muted">{t('admin.decisions.empty')}</p>
				{:else}
					<table class="data-table compact">
						<thead>
							<tr>
								<th>{t('admin.decisions.weekCol')}</th>
								<th>{t('admin.decisions.eventCol')}</th>
								<th>{t('admin.decisions.countCol')}</th>
							</tr>
						</thead>
						<tbody>
							{#each weeklyEvents as row (`${row.weekStart}-${row.eventType}`)}
								<tr>
									<td>{row.weekStart}</td>
									<td><code>{row.eventType}</code></td>
									<td>{row.count}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
				{#if caption(ADMIN_INSIGHT_CHART_KEYS.events)}
					<p class="ai-caption">{caption(ADMIN_INSIGHT_CHART_KEYS.events)}</p>
				{/if}
			</Card>
		</div>
	</section>

	<section class="decisions-section">
		<h2>{t('admin.decisions.stuckTitle')}</h2>
		<p class="muted">{t('admin.decisions.stuckNote')}</p>

		<div class="heatmap-grid">
			{#each DECISIONS_HEATMAP_ROUTES as route (route)}
				{@const heatmap = heatmaps[route]}
				<Card>
					<h3><code>{route}</code></h3>
					{#if !heatmap || heatmap.elements.length === 0}
						<p class="muted">{t('admin.decisions.heatmapEmpty')}</p>
					{:else}
						<ul class="heatmap-bars" aria-label={route}>
							{#each heatmap.elements.slice(0, 8) as row (row.elementKey)}
								<li>
									<span class="bar-label"><code>{row.elementKey}</code></span>
									<div class="bar-track">
										<div
											class="bar-fill"
											style={`width: ${Math.round((row.clickCount / maxHeatmapClicks(heatmap)) * 100)}%`}
										></div>
									</div>
									<span class="bar-count">{row.clickCount}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</Card>
			{/each}
		</div>
		{#if caption(ADMIN_INSIGHT_CHART_KEYS.heatmap)}
			<p class="ai-caption section-caption">{caption(ADMIN_INSIGHT_CHART_KEYS.heatmap)}</p>
		{/if}
	</section>
{/if}

<style>
	.panel-status {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.panel-error {
		color: #8a1f1f;
	}

	.decisions-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
	}

	.decisions-title {
		margin: 0 0 var(--space-xs);
		font-size: 1.25rem;
	}

	.toolbar-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: center;
	}

	.period-toggle {
		display: inline-flex;
		gap: var(--space-xs);
	}

	.period-btn {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.period-btn.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.decisions-section {
		margin-bottom: var(--space-xl);
	}

	.decisions-section > h2 {
		margin: 0 0 var(--space-xs);
		font-size: 1.1rem;
	}

	.decisions-grid,
	.heatmap-grid {
		display: grid;
		gap: var(--space-md);
	}

	.decisions-grid {
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		margin-bottom: var(--space-md);
	}

	.heatmap-grid {
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	}

	h2,
	h3 {
		margin: 0 0 var(--space-sm);
		font-size: 1.05rem;
	}

	.muted {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.muted.small {
		margin: 0;
		font-size: 0.82rem;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.data-table th,
	.data-table td {
		padding: 0.55rem 0.4rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	.funnel-bars,
	.retention-bars,
	.heatmap-bars,
	.top-events,
	.anomaly-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.funnel-bars li,
	.retention-bars li {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.metric-head {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.bar-track {
		height: 0.65rem;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		border-radius: 999px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 999px;
	}

	.heatmap-bars li {
		display: grid;
		grid-template-columns: minmax(6rem, 34%) 1fr auto;
		gap: var(--space-sm);
		align-items: center;
	}

	.bar-count {
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}

	.top-events li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: var(--space-sm);
		align-items: center;
	}

	.rank {
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.ai-caption {
		margin: var(--space-md) 0 0;
		padding: var(--space-sm) var(--space-md);
		border-left: 3px solid var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.section-caption {
		margin-top: var(--space-md);
	}

	.cohort-gated {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface));
		color: var(--color-text);
		font-size: 0.9rem;
	}

	.cohort-legend {
		display: flex;
		gap: var(--space-md);
		margin-top: var(--space-sm);
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.cohort-legend span {
		display: inline-block;
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 2px;
		margin-right: 0.2rem;
		vertical-align: middle;
	}

	.legend-d1 {
		background: #4f8cff;
	}

	.legend-d7 {
		background: #2fbf71;
	}

	.legend-d30 {
		background: #f0a500;
	}
</style>
