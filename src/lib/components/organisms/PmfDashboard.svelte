<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { PMF_TARGETS, type PmfMetricSnapshot } from '$lib/domain/pmf';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		metrics: PmfMetricSnapshot;
	}

	let { metrics }: Props = $props();

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
</script>

<section class="pmf-dashboard" aria-labelledby="pmf-dashboard-heading">
	<div class="dashboard-header">
		<h2 id="pmf-dashboard-heading">{t('pmf.title')}</h2>
		<p class="lead">{t('pmf.subtitle')}</p>
	</div>

	<div class="stats-grid">
		<Card>
			<p class="stat-label">{t('pmf.activation.label')}</p>
			<p class="stat-value">{formatPercent(metrics.activationRate)}</p>
			<p class="stat-note">
				{t('pmf.activation.detail', {
					activated: formatCount(metrics.activatedUsers),
					total: formatCount(metrics.eligibleUsers)
				})}
			</p>
			<p class="stat-definition">{t('pmf.activation.definition')}</p>
			<p class="stat-target">{t('pmf.target', { value: formatTarget(PMF_TARGETS.activationRate) })}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('pmf.firstScan.label')}</p>
			<p class="stat-value">{formatMinutes(metrics.medianTimeToFirstScanMinutes)}</p>
			<p class="stat-definition">{t('pmf.firstScan.definition')}</p>
			<p class="stat-target">
				{t('pmf.firstScan.target', { minutes: PMF_TARGETS.medianTimeToFirstScanMinutes })}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('pmf.weeklyScan.label')}</p>
			<p class="stat-value">{formatPercent(metrics.weeklyScanRate)}</p>
			<p class="stat-note">
				{t('pmf.weeklyScan.detail', {
					scanners: formatCount(metrics.weeklyScanners),
					wau: formatCount(metrics.wauCount)
				})}
			</p>
			<p class="stat-definition">{t('pmf.weeklyScan.definition')}</p>
			<p class="stat-target">{t('pmf.target', { value: formatTarget(PMF_TARGETS.weeklyScanRate) })}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('pmf.d7.label')}</p>
			<p class="stat-value">{formatPercent(metrics.d7Retention)}</p>
			<p class="stat-note">
				{t('pmf.retentionEligible', { count: formatCount(metrics.d7EligibleUsers) })}
			</p>
			<p class="stat-definition">{t('pmf.d7.definition')}</p>
			<p class="stat-target">{t('pmf.target', { value: formatTarget(PMF_TARGETS.d7Retention) })}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('pmf.d30.label')}</p>
			<p class="stat-value">{formatPercent(metrics.d30Retention)}</p>
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

		<Card>
			<p class="stat-label">{t('pmf.multiMember.label')}</p>
			<p class="stat-value">{formatPercent(metrics.multiMemberHouseholdRate)}</p>
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

		<Card>
			<p class="stat-label">{t('pmf.smartFill.label')}</p>
			<p class="stat-value">{formatPercent(metrics.smartFillWeeklyRate)}</p>
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

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-md);
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
