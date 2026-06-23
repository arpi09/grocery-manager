<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import {
		BRAIN_METRICS_PERIOD_OPTIONS,
		type BrainMetricsPeriodDays,
		type BrainMetricsSnapshot
	} from '$lib/domain/brain-metrics-admin';
	import { getLocale, t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n/messages';

	interface BrainMetricsPayload {
		brainMetrics: BrainMetricsSnapshot & {
			periodStart: string;
			periodEnd: string;
		};
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let metrics = $state<BrainMetricsSnapshot | null>(null);
	let periodDays = $state<BrainMetricsPeriodDays>(7);
	let loadedPeriod: BrainMetricsPeriodDays | null = $state(null);

	$effect(() => {
		if (!active) {
			return;
		}
		if (loadedPeriod === periodDays || loading) {
			return;
		}
		void load(periodDays);
	});

	function parseSnapshot(raw: BrainMetricsPayload['brainMetrics']): BrainMetricsSnapshot {
		return {
			...raw,
			periodStart: parseIsoDate(raw.periodStart),
			periodEnd: parseIsoDate(raw.periodEnd)
		};
	}

	async function load(days: BrainMetricsPeriodDays) {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<BrainMetricsPayload>('brain-metrics', {
				periodDays: days
			});
			metrics = parseSnapshot(payload.brainMetrics);
			loadedPeriod = days;
		} catch {
			error = t('admin.loadError');
			metrics = null;
			loadedPeriod = null;
		} finally {
			loading = false;
		}
	}

	function selectPeriod(days: BrainMetricsPeriodDays) {
		if (days === periodDays) {
			return;
		}
		periodDays = days;
	}

	function formatCount(value: number): string {
		return new Intl.NumberFormat(getLocale()).format(value);
	}

	function formatPercent(value: number | null): string {
		if (value === null) {
			return t('pmf.noData');
		}
		return new Intl.NumberFormat(getLocale(), {
			style: 'percent',
			maximumFractionDigits: 1
		}).format(value);
	}

	function formatPeriodRange(snapshot: BrainMetricsSnapshot): string {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		const formatter = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
		return t('admin.brainMetrics.periodRange', {
			start: formatter.format(snapshot.periodStart),
			end: formatter.format(snapshot.periodEnd),
			days: snapshot.periodDays
		});
	}

	function sourceLabel(source: string): string {
		const key = `admin.brainMetrics.source.${source}` as MessageKey;
		const translated = t(key);
		return translated === key ? source : translated;
	}

	function productLabel(product: { subjectKey: string; productName: string | null }): string {
		return product.productName?.trim() || product.subjectKey;
	}
</script>

<section class="brain-metrics" aria-labelledby="brain-metrics-heading" data-testid="admin-brain-metrics">
	<div class="panel-header">
		<div>
			<h2 id="brain-metrics-heading">{t('admin.brainMetrics.title')}</h2>
			<p class="lead">{t('admin.brainMetrics.subtitle')}</p>
			{#if metrics}
				<p class="period-note">{formatPeriodRange(metrics)}</p>
			{/if}
		</div>
		<div class="period-toggle" role="group" aria-label={t('admin.brainMetrics.periodToggle')}>
			{#each BRAIN_METRICS_PERIOD_OPTIONS as days}
				<button
					type="button"
					class="period-btn"
					class:active={periodDays === days}
					disabled={loading}
					aria-pressed={periodDays === days}
					onclick={() => selectPeriod(days)}
				>
					{t('admin.brainMetrics.periodOption', { days })}
				</button>
			{/each}
		</div>
	</div>

	{#if loading && !metrics}
		<p class="panel-status">{t('admin.loading')}</p>
	{:else if error}
		<p class="panel-status panel-error" role="alert">{error}</p>
	{:else if metrics}
		<div class="metrics-grid">
			<Card>
				<p>{t('admin.brainMetrics.receiptParses')}</p>
				<strong>{formatCount(metrics.receiptParseCount)}</strong>
			</Card>
			<Card>
				<p>{t('admin.brainMetrics.avgBbfCoverage')}</p>
				<strong>{metrics.avgBbfCoveragePercent}%</strong>
			</Card>
			<Card>
				<p>{t('admin.brainMetrics.aiBatchUsed')}</p>
				<strong>{formatCount(metrics.aiBatchUsedCount)}</strong>
			</Card>
			<Card>
				<p>{t('admin.brainMetrics.quickConfirmRate')}</p>
				<strong>{formatPercent(metrics.quickConfirmRate)}</strong>
			</Card>
		</div>

		<section class="sub-section" aria-labelledby="brain-funnel-heading">
			<h3 id="brain-funnel-heading">{t('admin.brainMetrics.funnelTitle')}</h3>
			<div class="metrics-grid funnel-grid">
				<Card>
					<p>{t('admin.brainMetrics.funnel.importStarted')}</p>
					<strong>{formatCount(metrics.funnel.counts.receipt_import_started)}</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.funnel.uploaded')}</p>
					<strong>{formatCount(metrics.funnel.counts.receipt_uploaded)}</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.funnel.parsed')}</p>
					<strong>{formatCount(metrics.funnel.counts.receipt_parsed)}</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.funnel.reviewCompleted')}</p>
					<strong>{formatCount(metrics.funnel.counts.receipt_review_completed)}</strong>
				</Card>
			</div>
			<ul class="conversion-list">
				<li>{t('admin.brainMetrics.funnel.uploadToParse', { rate: formatPercent(metrics.funnel.uploadToParseRate) })}</li>
				<li>{t('admin.brainMetrics.funnel.parseToReview', { rate: formatPercent(metrics.funnel.parseToReviewRate) })}</li>
				<li>{t('admin.brainMetrics.funnel.importToReview', { rate: formatPercent(metrics.funnel.importToReviewRate) })}</li>
				<li>{t('admin.brainMetrics.medianTimeToReview', { minutes: metrics.medianTimeToReviewMinutes ?? t('pmf.noData') })}</li>
			</ul>
		</section>

		<section class="sub-section" aria-labelledby="brain-parse-heading">
			<h3 id="brain-parse-heading">{t('admin.brainMetrics.parseAggregatesTitle')}</h3>
			<div class="metrics-grid">
				<Card>
					<p>{t('admin.brainMetrics.totalParsedLines')}</p>
					<strong>{formatCount(metrics.receiptParsedAggregates.totalParsedLines)}</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.avgHighConfidence')}</p>
					<strong>{metrics.receiptParsedAggregates.avgHighConfidencePercent}%</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.avgAiFallback')}</p>
					<strong>{metrics.receiptParsedAggregates.avgAiFallbackPercent}%</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.lowLineConfidence')}</p>
					<strong>{formatCount(metrics.receiptParsedAggregates.totalLowLineConfidenceCount)}</strong>
				</Card>
			</div>
		</section>

		<section class="sub-section" aria-labelledby="brain-correction-heading">
			<h3 id="brain-correction-heading">{t('admin.brainMetrics.correctionTitle')}</h3>
			{#if metrics.correctionRatesBySource.length === 0}
				<p class="empty-note">{t('admin.brainMetrics.noCorrections')}</p>
			{:else}
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">{t('admin.brainMetrics.correctionSource')}</th>
								<th scope="col">{t('admin.brainMetrics.correctionCorrected')}</th>
								<th scope="col">{t('admin.brainMetrics.correctionAccepted')}</th>
								<th scope="col">{t('admin.brainMetrics.correctionRate')}</th>
							</tr>
						</thead>
						<tbody>
							{#each metrics.correctionRatesBySource as row (row.source)}
								<tr>
									<td>{sourceLabel(row.source)}</td>
									<td>{formatCount(row.corrected)}</td>
									<td>{formatCount(row.accepted)}</td>
									<td>{formatPercent(row.correctionRate)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<section class="sub-section" aria-labelledby="brain-top-products-heading">
			<h3 id="brain-top-products-heading">{t('admin.brainMetrics.topCorrectedTitle')}</h3>
			{#if metrics.topCorrectedProducts.length === 0}
				<p class="empty-note">{t('admin.brainMetrics.noTopCorrected')}</p>
			{:else}
				<ol class="top-products">
					{#each metrics.topCorrectedProducts as product (product.subjectKey)}
						<li>
							<span class="product-name">{productLabel(product)}</span>
							<span class="product-count">{formatCount(product.correctionCount)}</span>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section class="sub-section" aria-labelledby="brain-engagement-heading">
			<h3 id="brain-engagement-heading">{t('admin.brainMetrics.engagementTitle')}</h3>
			<div class="metrics-grid">
				<Card>
					<p>{t('admin.brainMetrics.explanationViewed')}</p>
					<strong>{formatCount(metrics.brainExplanationViewed)}</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.eatFirstWeekViewed')}</p>
					<strong>{formatCount(metrics.eatFirst.eatFirstWeekViewed)}</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.eatFirstPlanApplied')}</p>
					<strong>{formatCount(metrics.eatFirst.eatFirstPlanApplied)}</strong>
				</Card>
				<Card>
					<p>{t('admin.brainMetrics.pantryUseSoonTapped')}</p>
					<strong>{formatCount(metrics.eatFirst.pantryUseSoonTapped)}</strong>
				</Card>
			</div>
		</section>
	{/if}
</section>

<style>
	.brain-metrics {
		margin-bottom: var(--space-lg);
	}

	.panel-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	h2 {
		margin: 0 0 var(--space-xs);
		font-size: 1.1rem;
	}

	h3 {
		margin: 0 0 var(--space-sm);
		font-size: 0.95rem;
	}

	.lead,
	.period-note,
	.empty-note,
	.panel-status {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.period-note {
		margin-top: var(--space-xs);
	}

	.panel-error {
		color: #8a1f1f;
	}

	.period-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		align-items: flex-start;
	}

	.period-btn {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.period-btn.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.period-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.funnel-grid {
		margin-bottom: var(--space-sm);
	}

	.sub-section {
		margin-bottom: var(--space-lg);
	}

	.conversion-list {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: 0.5rem 0.65rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
	}

	th {
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.top-products {
		margin: 0;
		padding-left: 1.2rem;
		font-size: 0.875rem;
	}

	.top-products li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: 0.35rem;
	}

	.product-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.product-count {
		flex-shrink: 0;
		font-weight: 600;
	}
</style>
