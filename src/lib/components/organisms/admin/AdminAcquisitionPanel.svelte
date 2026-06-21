<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { AcquisitionMetricsSnapshot } from '$lib/domain/acquisition-metrics';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		snapshot: AcquisitionMetricsSnapshot;
	}

	let { snapshot }: Props = $props();

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

	function formatPeriodRange(): string {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		const formatter = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
		return t('admin.acquisition.periodRange', {
			start: formatter.format(snapshot.periodStart),
			end: formatter.format(snapshot.periodEnd),
			days: snapshot.periodDays
		});
	}
</script>

<section class="acquisition-panel" aria-labelledby="acquisition-panel-heading">
	<div class="panel-header">
		<div>
			<h2 id="acquisition-panel-heading">{t('admin.acquisition.title')}</h2>
			<p class="lead">{t('admin.acquisition.subtitle')}</p>
			<p class="period-note">{formatPeriodRange()}</p>
		</div>
	</div>

	<div class="stats-grid">
		<Card>
			<p class="stat-label">{t('admin.acquisition.sharedListOpened')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.shared_list_opened)}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.acquisition.sharedListSignupCompleted')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.shared_list_signup_completed)}</p>
			<p class="stat-context">
				{t('admin.acquisition.signupConversion', {
					rate: formatPercent(snapshot.sharedListSignupConversion)
				})}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.acquisition.sharedListSignupClicked')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.shared_list_signup_clicked)}</p>
			<p class="stat-context">
				{t('admin.acquisition.signupCtr', {
					rate: formatPercent(snapshot.sharedListSignupCtr),
					target: '8%'
				})}
			</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.acquisition.publicSurfaceViewed')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.public_surface_viewed)}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.acquisition.publicSurfaceSignupClicked')}</p>
			<p class="stat-value">{formatCount(snapshot.counts.public_surface_signup_clicked)}</p>
			<p class="stat-context">
				{t('admin.acquisition.publicSurfaceCtr', {
					rate: formatPercent(snapshot.publicSurfaceSignupCtr)
				})}
			</p>
		</Card>
	</div>

	<p class="footnote">{t('admin.acquisition.footnote')}</p>
</section>

<style>
	.acquisition-panel {
		margin-bottom: var(--space-xl);
	}

	.panel-header {
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
		margin-top: var(--space-md);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
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
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
</style>
