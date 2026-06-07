<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData } from '$lib/client/admin-data';
	import {
		ANALYTICS_BEHAVIOR_PERIOD_DAYS,
		type AdminBehaviorOverview,
		type AdminBehaviorHeatmap,
		type AdminBehaviorFunnel,
		type AdminBehaviorRetention,
		type AdminEventExplorer,
		type AnalyticsBehaviorPeriodDays
	} from '$lib/domain/analytics-behavior';
	import { t } from '$lib/i18n';

	interface BehaviorOverviewPayload {
		overview: AdminBehaviorOverview & {
			periodStart: string;
			periodEnd: string;
		};
	}

	interface BehaviorHeatmapPayload {
		heatmap: AdminBehaviorHeatmap;
	}

	interface BehaviorFunnelPayload {
		funnel: AdminBehaviorFunnel;
	}

	interface BehaviorRetentionPayload {
		retention: AdminBehaviorRetention;
	}

	interface EventExplorerPayload {
		explorer: AdminEventExplorer;
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
	let overview = $state<BehaviorOverviewPayload['overview'] | null>(null);
	let heatmapRoute = $state('/hem');
	let heatmap = $state<AdminBehaviorHeatmap | null>(null);
	let funnel = $state<AdminBehaviorFunnel | null>(null);
	let retention = $state<AdminBehaviorRetention | null>(null);
	let explorer = $state<AdminEventExplorer | null>(null);
	let insights = $state<AiInsightsPayload['insights'] | null>(null);

	const funnelStepLabels: Record<string, string> = {
		landing: t('admin.behavior.funnel.landing'),
		signup: t('admin.behavior.funnel.signup'),
		home: t('admin.behavior.funnel.home'),
		first_scan: t('admin.behavior.funnel.first_scan')
	};

	const maxHeatmapClicks = $derived(
		Math.max(1, ...(heatmap?.elements.map((row) => row.clickCount) ?? [1]))
	);

	$effect(() => {
		if (!active) {
			return;
		}
		if (loadedPeriod === periodDays || loading) {
			return;
		}
		void loadBehavior(periodDays);
	});

	async function loadBehavior(days: AnalyticsBehaviorPeriodDays) {
		loading = true;
		error = null;
		try {
			const [overviewPayload, heatmapPayload, funnelPayload, retentionPayload, explorerPayload] =
				await Promise.all([
					fetchAdminData<BehaviorOverviewPayload>('behavior-overview', { periodDays: days }),
					fetchAdminData<BehaviorHeatmapPayload>('behavior-heatmap', {
						route: heatmapRoute,
						periodDays: days
					}),
					fetchAdminData<BehaviorFunnelPayload>('behavior-funnel', { periodDays: days }),
					fetchAdminData<BehaviorRetentionPayload>('behavior-retention', { periodDays: days }),
					fetchAdminData<EventExplorerPayload>('event-explorer', { periodDays: days })
				]);
			overview = overviewPayload.overview;
			heatmap = heatmapPayload.heatmap;
			funnel = funnelPayload.funnel;
			retention = retentionPayload.retention;
			explorer = explorerPayload.explorer;
			loadedPeriod = days;
		} catch {
			error = t('admin.loadError');
			overview = null;
			heatmap = null;
			funnel = null;
			retention = null;
			explorer = null;
			loadedPeriod = null;
		} finally {
			loading = false;
		}
	}

	async function reloadHeatmap() {
		if (!active) {
			return;
		}
		try {
			const payload = await fetchAdminData<BehaviorHeatmapPayload>('behavior-heatmap', {
				route: heatmapRoute,
				periodDays
			});
			heatmap = payload.heatmap;
		} catch {
			// keep previous heatmap
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
			insightsError = t('admin.behavior.insightsError');
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
</script>

{#if loading && !overview}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else if overview}
	<section class="behavior-toolbar">
		<div class="period-toggle" role="group" aria-label={t('admin.behavior.periodToggle')}>
			{#each ANALYTICS_BEHAVIOR_PERIOD_DAYS as days (days)}
				<button
					type="button"
					class="period-btn"
					class:active={periodDays === days}
					onclick={() => selectPeriod(days)}
				>
					{t('admin.behavior.periodOption', { days })}
				</button>
			{/each}
		</div>
		<Button type="button" variant="secondary" loading={insightsLoading} onclick={() => generateInsights(false)}>
			{t('admin.behavior.generateInsights')}
		</Button>
	</section>

	{#if insights || insightsError}
		<Card>
			<h2>{t('admin.behavior.insightsTitle')}</h2>
			{#if insightsError}
				<p class="panel-error" role="alert">{insightsError}</p>
			{:else if insights}
				{#if insights.cached}
					<p class="muted">{t('admin.behavior.insightsCached')}</p>
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
				<Button type="button" variant="ghost" loading={insightsLoading} onclick={() => generateInsights(true)}>
					{t('admin.behavior.refreshInsights')}
				</Button>
			{/if}
		</Card>
	{/if}

	<Card>
		<h2>{t('admin.behavior.routesTitle')}</h2>
		<p class="muted">{t('admin.behavior.routesNote')}</p>
		{#if overview.routes.length === 0}
			<p class="muted">{t('admin.behavior.empty')}</p>
		{:else}
			<table class="data-table">
				<thead>
					<tr>
						<th>{t('admin.behavior.routeCol')}</th>
						<th>{t('admin.behavior.viewsCol')}</th>
						<th>{t('admin.behavior.sessionsCol')}</th>
						<th>{t('admin.behavior.durationCol')}</th>
					</tr>
				</thead>
				<tbody>
					{#each overview.routes as row (row.route)}
						<tr>
							<td><code>{row.route}</code></td>
							<td>{row.viewCount}</td>
							<td>{row.uniqueSessions}</td>
							<td>{t('admin.behavior.durationValue', { ms: row.avgDurationMs })}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</Card>

	<Card>
		<h2>{t('admin.behavior.heatmapTitle')}</h2>
		<p class="muted">{t('admin.behavior.heatmapNote')}</p>
		<label class="route-picker">
			{t('admin.behavior.routeCol')}
			<input
				type="text"
				bind:value={heatmapRoute}
				onchange={() => reloadHeatmap()}
				list="behavior-routes"
			/>
			<datalist id="behavior-routes">
				{#each overview.routes as row (row.route)}
					<option value={row.route}></option>
				{/each}
			</datalist>
		</label>
		{#if !heatmap || heatmap.elements.length === 0}
			<p class="muted">{t('admin.behavior.heatmapEmpty')}</p>
		{:else}
			<ul class="heatmap-bars" aria-label={t('admin.behavior.heatmapTitle')}>
				{#each heatmap.elements as row (row.elementKey)}
					<li>
						<span class="bar-label"><code>{row.elementKey}</code></span>
						<div class="bar-track">
							<div
								class="bar-fill"
								style={`width: ${Math.round((row.clickCount / maxHeatmapClicks) * 100)}%`}
							></div>
						</div>
						<span class="bar-count">{row.clickCount}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>

	<Card>
		<h2>{t('admin.behavior.funnelTitle')}</h2>
		{#if funnel}
			<ul class="funnel-steps">
				{#each funnel.steps as step (step.step)}
					<li>
						<span>{funnelStepLabels[step.step] ?? step.step}</span>
						<strong>{step.count}</strong>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>

	<Card>
		<h2>{t('admin.behavior.retentionTitle')}</h2>
		{#if retention}
			<ul class="retention-list">
				{#each retention.points as point (point.dayOffset)}
					<li>
						D{point.dayOffset}: {Math.round(point.rate * 100)}%
						<span class="muted">({point.retained}/{point.eligible})</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>

	<Card>
		<h2>{t('admin.behavior.eventsTitle')}</h2>
		<p class="muted">{t('admin.behavior.eventsNote')}</p>
		{#if explorer && explorer.events.length > 0}
			<table class="data-table compact">
				<thead>
					<tr>
						<th>{t('admin.behavior.dayCol')}</th>
						<th>{t('admin.behavior.eventCol')}</th>
						<th>{t('admin.behavior.countCol')}</th>
					</tr>
				</thead>
				<tbody>
					{#each explorer.events.slice(0, 40) as row (`${row.day}-${row.eventType}`)}
						<tr>
							<td>{row.day}</td>
							<td><code>{row.eventType}</code></td>
							<td>{row.count}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="muted">{t('admin.behavior.empty')}</p>
		{/if}
	</Card>
{/if}

<style>
	.panel-status {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.panel-error {
		color: #8a1f1f;
	}

	.behavior-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
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

	h2 {
		margin: 0 0 var(--space-sm);
		font-size: 1.05rem;
	}

	.muted {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
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

	.route-picker {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: var(--space-md);
		font-size: 0.9rem;
	}

	.route-picker input {
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.heatmap-bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.heatmap-bars li {
		display: grid;
		grid-template-columns: minmax(8rem, 30%) 1fr auto;
		gap: var(--space-sm);
		align-items: center;
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

	.bar-count {
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}

	.funnel-steps,
	.retention-list,
	.anomaly-list {
		margin: 0;
		padding-left: 1.1rem;
		line-height: 1.7;
	}

	.funnel-steps li,
	.retention-list li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
	}
</style>
