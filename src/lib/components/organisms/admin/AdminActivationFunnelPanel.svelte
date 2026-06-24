<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import {
		ACTIVATION_FUNNEL_PERIOD_OPTIONS,
		ACTIVATION_FUNNEL_TARGETS,
		type ActivationFunnelPeriodDays,
		type ActivationFunnelSnapshot
	} from '$lib/domain/activation-funnel';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		snapshot: ActivationFunnelSnapshot;
		periodDays: ActivationFunnelPeriodDays;
		loading: boolean;
		onPeriodChange: (days: ActivationFunnelPeriodDays) => void;
	}

	let { snapshot, periodDays, loading, onPeriodChange }: Props = $props();

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

	function formatTarget(value: number): string {
		return new Intl.NumberFormat(getLocale(), {
			style: 'percent',
			maximumFractionDigits: 0
		}).format(value);
	}

	function formatPeriodRange(): string {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		const formatter = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
		return t('admin.activationFunnel.periodRange', {
			start: formatter.format(snapshot.periodStart),
			end: formatter.format(snapshot.periodEnd),
			days: snapshot.periodDays
		});
	}

	function stepContext(numerator: number, denominator: number, rate: number | null): string {
		if (rate === null) {
			return t('admin.activationFunnel.ratioUnavailable', {
				numerator: formatCount(numerator),
				denominator: formatCount(denominator)
			});
		}
		return t('admin.activationFunnel.ratio', {
			numerator: formatCount(numerator),
			denominator: formatCount(denominator),
			percent: formatPercent(rate)
		});
	}
</script>

<section
	class="activation-funnel"
	aria-labelledby="activation-funnel-heading"
	data-testid="admin-activation-funnel"
>
	<div class="funnel-header">
		<div>
			<h2 id="activation-funnel-heading">{t('admin.activationFunnel.title')}</h2>
			<p class="lead">{t('admin.activationFunnel.subtitle')}</p>
			<p class="period-note">{formatPeriodRange()}</p>
			<p class="footnote">{t('admin.activationFunnel.footnote')}</p>
		</div>
		<div class="period-toggle" role="group" aria-label={t('admin.activationFunnel.periodToggle')}>
			{#each ACTIVATION_FUNNEL_PERIOD_OPTIONS as days}
				<button
					type="button"
					class="period-btn"
					class:active={periodDays === days}
					disabled={loading}
					aria-pressed={periodDays === days}
					onclick={() => onPeriodChange(days)}
				>
					{t('admin.activationFunnel.periodOption', { days })}
				</button>
			{/each}
		</div>
	</div>

	<div class="stats-grid">
		<Card>
			<p class="stat-label">{t('admin.activationFunnel.steps.registrations')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.registrations)}</p>
			<p class="stat-definition">{t('admin.activationFunnel.steps.registrationsDefinition')}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.activationFunnel.steps.onboardingStarted')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.onboardingStarted)}</p>
			<p class="stat-context">
				{stepContext(
					snapshot.counts.onboardingStarted,
					snapshot.counts.registrations,
					snapshot.rates.onboardingFromSignup
				)}
			</p>
			<p class="stat-target">
				{t('admin.activationFunnel.target', {
					value: formatTarget(ACTIVATION_FUNNEL_TARGETS.onboardingFromSignup)
				})}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.activationFunnel.steps.receiptParsed24h')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.receiptParsed24h)}</p>
			<p class="stat-context">
				{stepContext(
					snapshot.counts.receiptParsed24h,
					snapshot.counts.registrations,
					snapshot.rates.receiptParsedFromSignup
				)}
			</p>
			<p class="stat-target">
				{t('admin.activationFunnel.target', {
					value: formatTarget(ACTIVATION_FUNNEL_TARGETS.receiptParsed24hFromSignup)
				})}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.activationFunnel.steps.inventoryFive')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.inventoryFivePlus24h)}</p>
			<p class="stat-context">
				{stepContext(
					snapshot.counts.inventoryFivePlus24h,
					snapshot.counts.registrations,
					snapshot.rates.inventoryFiveFromSignup
				)}
			</p>
			<p class="stat-target">
				{t('admin.activationFunnel.target', {
					value: formatTarget(ACTIVATION_FUNNEL_TARGETS.inventoryFiveFromSignup)
				})}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.activationFunnel.steps.recipesShown')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.activationRecipesShown)}</p>
			<p class="stat-context">
				{stepContext(
					snapshot.counts.activationRecipesShown,
					snapshot.counts.receiptParsed24h,
					snapshot.rates.recipesFromReceiptUsers
				)}
			</p>
			<p class="stat-target">
				{t('admin.activationFunnel.target', {
					value: formatTarget(ACTIVATION_FUNNEL_TARGETS.recipesFromReceiptUsers)
				})}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.activationFunnel.steps.d7')}</p>
			<p class="stat-value">{formatPercent(snapshot.rates.d7Retention)}</p>
			<p class="stat-context">
				{t('admin.activationFunnel.steps.d7Detail', {
					retained: formatCount(snapshot.counts.d7Retained),
					eligible: formatCount(snapshot.counts.d7Eligible)
				})}
			</p>
			<p class="stat-target">
				{t('admin.activationFunnel.target', {
					value: formatTarget(ACTIVATION_FUNNEL_TARGETS.d7Retention)
				})}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.activationFunnel.steps.sharedList')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.sharedListOpened)}</p>
			<p class="stat-definition">{t('admin.activationFunnel.steps.sharedListDefinition')}</p>
		</Card>
	</div>
</section>

<style>
	.activation-funnel {
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
	.period-note,
	.footnote {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.period-note {
		margin-top: var(--space-xs);
	}

	.footnote {
		margin-top: var(--space-xs);
		font-size: 0.85rem;
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
	.stat-target {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.stat-target {
		margin-top: var(--space-xs);
	}
</style>
