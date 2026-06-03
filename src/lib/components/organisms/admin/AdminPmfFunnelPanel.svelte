<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import {
		buildPmfFunnelConversionRates,
		PMF_FUNNEL_PERIOD_OPTIONS,
		type PmfFunnelPeriodDays,
		type PmfFunnelSnapshot
	} from '$lib/domain/pmf-funnel';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		snapshot: PmfFunnelSnapshot;
		periodDays: PmfFunnelPeriodDays;
		loading: boolean;
		onPeriodChange: (days: PmfFunnelPeriodDays) => void;
	}

	let { snapshot, periodDays, loading, onPeriodChange }: Props = $props();

	const conversions = $derived(buildPmfFunnelConversionRates(snapshot));

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

	function formatRatio(numerator: number, denominator: number, rate: number | null): string {
		if (rate === null) {
			return t('pmf.funnel.ratioUnavailable', {
				numerator: formatCount(numerator),
				denominator: formatCount(denominator)
			});
		}
		return t('pmf.funnel.ratio', {
			numerator: formatCount(numerator),
			denominator: formatCount(denominator),
			percent: formatPercent(rate)
		});
	}

	function formatPeriodRange(): string {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		const formatter = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
		return t('pmf.funnel.periodRange', {
			start: formatter.format(snapshot.periodStart),
			end: formatter.format(snapshot.periodEnd),
			days: snapshot.periodDays
		});
	}

	function visitsDefinition(): string {
		return snapshot.visitsSource === 'landing_view'
			? t('pmf.funnel.visits.definition')
			: t('pmf.funnel.visits.proxyDefinition');
	}
</script>

<section class="pmf-funnel" aria-labelledby="pmf-funnel-heading">
	<div class="funnel-header">
		<div>
			<h2 id="pmf-funnel-heading">{t('pmf.funnel.title')}</h2>
			<p class="lead">{t('pmf.funnel.subtitle')}</p>
			<p class="period-note">{formatPeriodRange()}</p>
		</div>
		<div class="period-toggle" role="group" aria-label={t('pmf.funnel.periodToggle')}>
			{#each PMF_FUNNEL_PERIOD_OPTIONS as days}
				<button
					type="button"
					class="period-btn"
					class:active={periodDays === days}
					disabled={loading}
					aria-pressed={periodDays === days}
					onclick={() => onPeriodChange(days)}
				>
					{t('pmf.funnel.periodOption', { days })}
				</button>
			{/each}
		</div>
	</div>

	<div class="stats-grid">
		<Card>
			<p class="stat-label">{t('pmf.funnel.visits.label')}</p>
			<p class="stat-value">{formatCount(snapshot.visits)}</p>
			<p class="stat-definition">{visitsDefinition()}</p>
			{#if snapshot.visitsSource === 'unique_active_users_proxy'}
				<p class="stat-proxy">{t('pmf.funnel.visits.proxyNote')}</p>
			{/if}
		</Card>

		<Card>
			<p class="stat-label">{t('pmf.funnel.signups.label')}</p>
			<p class="stat-value">{formatCount(snapshot.signups)}</p>
			<p class="stat-context">
				{formatRatio(snapshot.signups, snapshot.visits, conversions.signupFromVisits)}
			</p>
			<p class="stat-definition">{t('pmf.funnel.signups.definition')}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('pmf.funnel.firstScan.label')}</p>
			<p class="stat-value">{formatCount(snapshot.firstScans)}</p>
			<p class="stat-context">
				{formatRatio(snapshot.firstScans, snapshot.signups, conversions.firstScanFromSignups)}
			</p>
			<p class="stat-definition">{t('pmf.funnel.firstScan.definition')}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('pmf.funnel.d1.label')}</p>
			<p class="stat-value">{formatPercent(snapshot.d1Retention)}</p>
			<p class="stat-context">
				{t('pmf.funnel.d1.detail', {
					retained: formatCount(snapshot.d1RetainedUsers),
					eligible: formatCount(snapshot.d1EligibleUsers)
				})}
			</p>
			{#if conversions.d1FromEligible !== null}
				<p class="stat-context">
					{formatRatio(
						snapshot.d1RetainedUsers,
						snapshot.d1EligibleUsers,
						conversions.d1FromEligible
					)}
				</p>
			{/if}
			<p class="stat-definition">{t('pmf.funnel.d1.definition')}</p>
		</Card>
	</div>
</section>

<style>
	.pmf-funnel {
		margin-bottom: var(--space-xl);
	}

	.funnel-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	h2 {
		margin: 0 0 var(--space-xs);
		font-size: 1.25rem;
	}

	.lead,
	.period-note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.period-note {
		margin-top: var(--space-xs);
	}

	.period-toggle {
		display: inline-flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.period-btn {
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.85rem;
		cursor: pointer;
	}

	.period-btn.active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		font-weight: 600;
	}

	.period-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
		gap: var(--space-md);
	}

	.stat-label {
		margin: 0 0 var(--space-xs);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stat-value {
		margin: 0 0 var(--space-sm);
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.stat-context {
		margin: 0 0 var(--space-sm);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.stat-definition,
	.stat-proxy {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.stat-proxy {
		margin-top: var(--space-xs);
		font-style: italic;
	}
</style>
