<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import {
		PMF_TARGETS,
		type PmfMetricStatus,
		type PmfTrackedMetricKey,
		type PmfWeeklyReview
	} from '$lib/domain/pmf';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		review: PmfWeeklyReview;
	}

	let { review }: Props = $props();

	const metrics = $derived(review.current);

	function metricStatus(key: PmfTrackedMetricKey): PmfMetricStatus {
		return review.metrics.find((metric) => metric.key === key)!;
	}

	function formatPercent(value: number): string {
		return new Intl.NumberFormat(getLocale(), {
			style: 'percent',
			maximumFractionDigits: 1
		}).format(value);
	}

	function formatTarget(value: number): string {
		return formatPercent(value);
	}

	function formatMinutes(value: number | null): string {
		if (value === null) {
			return t('pmf.noData');
		}

		return t('pmf.minutesValue', { count: Math.round(value * 10) / 10 });
	}

	function formatCount(value: number): string {
		return new Intl.NumberFormat(getLocale()).format(value);
	}

	function formatWeekEnd(date: Date): string {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		return new Intl.DateTimeFormat(tag, { dateStyle: 'medium' }).format(date);
	}

	function metricLabel(key: PmfTrackedMetricKey): string {
		const labels: Record<PmfTrackedMetricKey, string> = {
			activationRate: t('pmf.activation.label'),
			medianTimeToFirstScanMinutes: t('pmf.firstScan.label'),
			weeklyScanRate: t('pmf.weeklyScan.label'),
			d7Retention: t('pmf.d7.label'),
			d30Retention: t('pmf.d30.label'),
			multiMemberHouseholdRate: t('pmf.multiMember.label'),
			smartFillWeeklyRate: t('pmf.smartFill.label')
		};
		return labels[key];
	}

	function formatMetricValue(key: PmfTrackedMetricKey, value: number | null): string {
		if (value === null) {
			return t('pmf.noData');
		}

		if (key === 'medianTimeToFirstScanMinutes') {
			return formatMinutes(value);
		}

		return formatPercent(value);
	}

	function formatDelta(status: PmfMetricStatus): string {
		if (status.delta === null) {
			return t('pmf.delta.unknown');
		}

		if (status.deltaDirection === 'flat') {
			return t('pmf.delta.flat');
		}

		if (status.key === 'medianTimeToFirstScanMinutes') {
			const rounded = Math.round(Math.abs(status.delta) * 10) / 10;
			if (status.deltaDirection === 'up') {
				return t('pmf.delta.minutesUp', { count: rounded });
			}
			return t('pmf.delta.minutesDown', { count: rounded });
		}

		const points = Math.abs(status.delta * 100);
		const formatted = new Intl.NumberFormat(getLocale(), {
			maximumFractionDigits: 1,
			minimumFractionDigits: 0
		}).format(points);

		if (status.deltaDirection === 'up') {
			return t('pmf.delta.rateUp', { points: formatted });
		}
		return t('pmf.delta.rateDown', { points: formatted });
	}

	function deltaClass(status: PmfMetricStatus): string {
		if (status.deltaDirection === 'unknown' || status.deltaDirection === 'flat') {
			return 'delta-neutral';
		}
		return status.deltaDirection === 'up' ? 'delta-good' : 'delta-bad';
	}

	function cardClass(status: PmfMetricStatus): string {
		return status.onTarget ? '' : 'below-target';
	}
</script>

<section class="pmf-dashboard" aria-labelledby="pmf-dashboard-heading">
	<div class="dashboard-header">
		<h2 id="pmf-dashboard-heading">{t('pmf.title')}</h2>
		<p class="lead">{t('pmf.subtitle')}</p>
	</div>

	<Card class="weekly-summary">
		<h3 class="summary-title">{t('pmf.summary.title')}</h3>
		<p class="summary-period">
			{t('pmf.summary.period', {
				current: formatWeekEnd(review.currentWeekEnd),
				previous: formatWeekEnd(review.previousWeekEnd)
			})}
		</p>
		<p class="summary-score">
			{t('pmf.summary.onTarget', {
				onTarget: formatCount(review.onTargetCount),
				total: formatCount(review.totalTracked)
			})}
		</p>

		{#if review.belowTarget.length === 0}
			<p class="summary-all-clear">{t('pmf.summary.allOnTarget')}</p>
		{:else}
			<div class="summary-attention">
				<p class="summary-attention-label">{t('pmf.summary.belowTargetTitle')}</p>
				<ul class="summary-list">
					{#each review.belowTarget as item}
						<li>
							<span class="summary-metric">{metricLabel(item.key)}</span>
							<span class="summary-values">
								<strong>{formatMetricValue(item.key, item.current)}</strong>
								<span class="summary-target">
									{t('pmf.summary.targetValue', {
										value:
											item.key === 'medianTimeToFirstScanMinutes'
												? t('pmf.minutesValue', { count: item.target })
												: formatTarget(item.target)
									})}
								</span>
								<span class="summary-delta {deltaClass(item)}">{formatDelta(item)}</span>
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</Card>

	<div class="stats-grid">
		<Card class={cardClass(metricStatus('activationRate'))}>
			<p class="stat-label">{t('pmf.activation.label')}</p>
			<p class="stat-value">{formatPercent(metrics.activationRate)}</p>
			<p class="stat-delta {deltaClass(metricStatus('activationRate'))}">
				{formatDelta(metricStatus('activationRate'))}
			</p>
			{#if !metricStatus('activationRate').onTarget}
				<p class="stat-alert">{t('pmf.belowTarget')}</p>
			{/if}
			<p class="stat-note">
				{t('pmf.activation.detail', {
					activated: formatCount(metrics.activatedUsers),
					total: formatCount(metrics.eligibleUsers)
				})}
			</p>
			<p class="stat-definition">{t('pmf.activation.definition')}</p>
			<p class="stat-target">{t('pmf.target', { value: formatTarget(PMF_TARGETS.activationRate) })}</p>
		</Card>

		<Card class={cardClass(metricStatus('medianTimeToFirstScanMinutes'))}>
			<p class="stat-label">{t('pmf.firstScan.label')}</p>
			<p class="stat-value">{formatMinutes(metrics.medianTimeToFirstScanMinutes)}</p>
			<p class="stat-delta {deltaClass(metricStatus('medianTimeToFirstScanMinutes'))}">
				{formatDelta(metricStatus('medianTimeToFirstScanMinutes'))}
			</p>
			{#if !metricStatus('medianTimeToFirstScanMinutes').onTarget}
				<p class="stat-alert">{t('pmf.belowTarget')}</p>
			{/if}
			<p class="stat-definition">{t('pmf.firstScan.definition')}</p>
			<p class="stat-target">
				{t('pmf.firstScan.target', { minutes: PMF_TARGETS.medianTimeToFirstScanMinutes })}
			</p>
		</Card>

		<Card class={cardClass(metricStatus('weeklyScanRate'))}>
			<p class="stat-label">{t('pmf.weeklyScan.label')}</p>
			<p class="stat-value">{formatPercent(metrics.weeklyScanRate)}</p>
			<p class="stat-delta {deltaClass(metricStatus('weeklyScanRate'))}">
				{formatDelta(metricStatus('weeklyScanRate'))}
			</p>
			{#if !metricStatus('weeklyScanRate').onTarget}
				<p class="stat-alert">{t('pmf.belowTarget')}</p>
			{/if}
			<p class="stat-note">
				{t('pmf.weeklyScan.detail', {
					scanners: formatCount(metrics.weeklyScanners),
					wau: formatCount(metrics.wauCount)
				})}
			</p>
			<p class="stat-definition">{t('pmf.weeklyScan.definition')}</p>
			<p class="stat-target">{t('pmf.target', { value: formatTarget(PMF_TARGETS.weeklyScanRate) })}</p>
		</Card>

		<Card class={cardClass(metricStatus('d7Retention'))}>
			<p class="stat-label">{t('pmf.d7.label')}</p>
			<p class="stat-value">{formatPercent(metrics.d7Retention)}</p>
			<p class="stat-delta {deltaClass(metricStatus('d7Retention'))}">
				{formatDelta(metricStatus('d7Retention'))}
			</p>
			{#if !metricStatus('d7Retention').onTarget}
				<p class="stat-alert">{t('pmf.belowTarget')}</p>
			{/if}
			<p class="stat-note">
				{t('pmf.retentionEligible', { count: formatCount(metrics.d7EligibleUsers) })}
			</p>
			<p class="stat-definition">{t('pmf.d7.definition')}</p>
			<p class="stat-target">{t('pmf.target', { value: formatTarget(PMF_TARGETS.d7Retention) })}</p>
		</Card>

		<Card class={cardClass(metricStatus('d30Retention'))}>
			<p class="stat-label">{t('pmf.d30.label')}</p>
			<p class="stat-value">{formatPercent(metrics.d30Retention)}</p>
			<p class="stat-delta {deltaClass(metricStatus('d30Retention'))}">
				{formatDelta(metricStatus('d30Retention'))}
			</p>
			{#if !metricStatus('d30Retention').onTarget}
				<p class="stat-alert">{t('pmf.belowTarget')}</p>
			{/if}
			<p class="stat-note">
				{t('pmf.retentionEligible', { count: formatCount(metrics.d30EligibleUsers) })}
			</p>
			<p class="stat-definition">{t('pmf.d30.definition')}</p>
			<p class="stat-target">
				{t('pmf.d30.target', {
					early: formatTarget(PMF_TARGETS.d30RetentionEarly),
					mature: formatTarget(PMF_TARGETS.d30RetentionMature)
				})}
			</p>
		</Card>

		<Card class={cardClass(metricStatus('multiMemberHouseholdRate'))}>
			<p class="stat-label">{t('pmf.multiMember.label')}</p>
			<p class="stat-value">{formatPercent(metrics.multiMemberHouseholdRate)}</p>
			<p class="stat-delta {deltaClass(metricStatus('multiMemberHouseholdRate'))}">
				{formatDelta(metricStatus('multiMemberHouseholdRate'))}
			</p>
			{#if !metricStatus('multiMemberHouseholdRate').onTarget}
				<p class="stat-alert">{t('pmf.belowTarget')}</p>
			{/if}
			<p class="stat-note">
				{t('pmf.multiMember.detail', {
					multi: formatCount(metrics.multiMemberActiveHouseholds),
					total: formatCount(metrics.activeHouseholds)
				})}
			</p>
			<p class="stat-definition">{t('pmf.multiMember.definition')}</p>
			<p class="stat-target">
				{t('pmf.target', { value: formatTarget(PMF_TARGETS.multiMemberHouseholdRate) })}
			</p>
		</Card>

		<Card class={cardClass(metricStatus('smartFillWeeklyRate'))}>
			<p class="stat-label">{t('pmf.smartFill.label')}</p>
			<p class="stat-value">{formatPercent(metrics.smartFillWeeklyRate)}</p>
			<p class="stat-delta {deltaClass(metricStatus('smartFillWeeklyRate'))}">
				{formatDelta(metricStatus('smartFillWeeklyRate'))}
			</p>
			{#if !metricStatus('smartFillWeeklyRate').onTarget}
				<p class="stat-alert">{t('pmf.belowTarget')}</p>
			{/if}
			<p class="stat-note">
				{t('pmf.smartFill.detail', { count: formatCount(metrics.weeklyFillUsers) })}
			</p>
			<p class="stat-definition">{t('pmf.smartFill.definition')}</p>
			<p class="stat-target">
				{t('pmf.target', { value: formatTarget(PMF_TARGETS.smartFillWeeklyRate) })}
			</p>
		</Card>
	</div>

	<Card>
		<h3 class="events-title">{t('pmf.eventsTitle')}</h3>
		<p class="events-note">{t('pmf.eventsNote')}</p>
		<ul class="events-list">
			<li>
				<span>{t('pmf.events.scanCompleted')}</span>
				<strong>{formatCount(metrics.eventCounts.scan_completed)}</strong>
			</li>
			<li>
				<span>{t('pmf.events.receiptParsed')}</span>
				<strong>{formatCount(metrics.eventCounts.receipt_parsed)}</strong>
			</li>
			<li>
				<span>{t('pmf.events.fillSuggestionsAdded')}</span>
				<strong>{formatCount(metrics.eventCounts.fill_suggestions_added)}</strong>
			</li>
		</ul>
	</Card>
</section>

<style>
	.pmf-dashboard {
		margin-bottom: var(--space-lg);
	}

	.dashboard-header {
		margin-bottom: var(--space-md);
	}

	.dashboard-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.lead {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.weekly-summary {
		margin-bottom: var(--space-md);
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
	}

	.summary-title {
		margin: 0 0 var(--space-xs);
		font-size: 1rem;
	}

	.summary-period,
	.summary-score {
		margin: var(--space-xs) 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.summary-score {
		font-weight: 600;
		color: var(--color-text);
	}

	.summary-all-clear {
		margin: var(--space-sm) 0 0;
		font-size: 0.9rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.summary-attention {
		margin-top: var(--space-sm);
	}

	.summary-attention-label {
		margin: 0 0 var(--space-xs);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-danger);
	}

	.summary-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.summary-list li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-md);
		font-size: 0.85rem;
	}

	.summary-metric {
		font-weight: 600;
	}

	.summary-values {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: flex-end;
		gap: var(--space-xs);
		text-align: right;
	}

	.summary-target {
		color: var(--color-text-muted);
		font-size: 0.78rem;
	}

	.summary-delta {
		font-size: 0.78rem;
		font-weight: 600;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.stats-grid :global(.below-target) {
		border-color: color-mix(in srgb, var(--color-danger) 55%, var(--color-border));
		background: color-mix(in srgb, var(--color-danger) 6%, var(--color-surface));
	}

	.stat-label {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.stat-value {
		margin: var(--space-xs) 0 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.stat-delta {
		margin: var(--space-xs) 0 0;
		font-size: 0.78rem;
		font-weight: 600;
	}

	.delta-good {
		color: var(--color-primary);
	}

	.delta-bad {
		color: var(--color-danger);
	}

	.delta-neutral {
		color: var(--color-text-muted);
	}

	.stat-alert {
		margin: var(--space-xs) 0 0;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-danger);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stat-note,
	.stat-definition,
	.stat-target {
		margin: var(--space-xs) 0 0;
		font-size: 0.78rem;
		line-height: 1.35;
	}

	.stat-note {
		color: var(--color-text-muted);
	}

	.stat-definition {
		color: var(--color-text-muted);
	}

	.stat-target {
		color: var(--color-primary);
		font-weight: 600;
	}

	.events-title {
		margin: 0 0 var(--space-xs);
		font-size: 1rem;
	}

	.events-note {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.events-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.events-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
		font-size: 0.9rem;
	}
</style>
