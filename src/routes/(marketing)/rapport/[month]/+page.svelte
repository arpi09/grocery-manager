<script lang="ts">
	import { onMount } from 'svelte';
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import type { ProductCategoryId } from '$lib/domain/savings-estimate';
	import { t } from '$lib/i18n';

	let { data } = $props();

	const { report, month, marketingLocale, loginUrl, registerUrl, canonicalUrl } = data;

	const weekdayLabels: Record<number, string> = {
		1: t('rapport.weekdays.1'),
		2: t('rapport.weekdays.2'),
		3: t('rapport.weekdays.3'),
		4: t('rapport.weekdays.4'),
		5: t('rapport.weekdays.5'),
		6: t('rapport.weekdays.6'),
		7: t('rapport.weekdays.7')
	};

	function categoryLabel(categoryId: ProductCategoryId): string {
		return t(`rapport.categories.${categoryId}`);
	}

	function weekdayLabel(weekday: number): string {
		return weekdayLabels[weekday] ?? String(weekday);
	}

	const maxWeekdayCount = $derived(
		Math.max(1, ...report.weekdayChart.map((bar) => bar.count))
	);

	onMount(() => {
		void fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventType: 'public_report_viewed',
				metadata: { month, meetsKAnonymity: report.meetsKAnonymity }
			})
		});
	});
</script>

<MarketingSeoHead
	title={t('rapport.metaTitle', { month })}
	description={t('rapport.metaDescription', { month })}
	ogTitle={t('rapport.metaTitle', { month })}
	ogDescription={t('rapport.metaDescription', { month })}
	{canonicalUrl}
	locale={marketingLocale}
/>

<MarketingPageHero>
	<p class="eyebrow">{t('rapport.eyebrow')}</p>
	<h1>{t('rapport.title', { month })}</h1>
	<p>{t('rapport.lead')}</p>
</MarketingPageHero>

<MarketingScrollReveal>
	<section class="section">
		<div class="inner">
			{#if report.isBetaCohort || !report.meetsKAnonymity}
				<p class="disclaimer" role="note">{t('rapport.betaDisclaimer')}</p>
			{/if}

			{#if !report.meetsKAnonymity}
				<p class="muted">{t('rapport.insufficientCohort')}</p>
			{:else}
				<ul class="insights" aria-label={t('rapport.insightsLabel')}>
					{#if report.topWastedCategory}
						<li>
							<strong>{t('rapport.insightCategoryTitle')}</strong>
							<span>{categoryLabel(report.topWastedCategory)}</span>
						</li>
					{/if}
					{#if report.peakWasteWeekday}
						<li>
							<strong>{t('rapport.insightWeekdayTitle')}</strong>
							<span>{weekdayLabel(report.peakWasteWeekday)}</span>
						</li>
					{/if}
					{#if report.avgWastePerHousehold != null}
						<li>
							<strong>{t('rapport.insightAverageTitle')}</strong>
							<span>{t('rapport.insightAverageValue', { count: report.avgWastePerHousehold })}</span>
						</li>
					{/if}
				</ul>

				<div class="chart-card">
					<h2>{t('rapport.chartTitle')}</h2>
					<p class="chart-lead">{t('rapport.chartLead')}</p>
					<ul class="weekday-chart" aria-label={t('rapport.chartTitle')}>
						{#each report.weekdayChart as bar (bar.weekday)}
							<li class="weekday-bar">
								<span class="weekday-label">{weekdayLabel(bar.weekday)}</span>
								<span
									class="weekday-fill"
									style:height="{Math.max(8, (bar.count / maxWeekdayCount) * 100)}%"
									aria-label={t('rapport.chartBarAria', {
										weekday: weekdayLabel(bar.weekday),
										count: bar.count
									})}
								></span>
								<span class="weekday-count">{bar.count}</span>
							</li>
						{/each}
					</ul>
				</div>

				<p class="meta">
					{t('rapport.metaStats', {
						households: report.householdCount,
						events: report.eventCount
					})}
				</p>
			{/if}
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={60}>
	<MarketingCta
		title={t('rapport.ctaTitle')}
		lead={t('rapport.ctaLead')}
		primaryLabel={data.marketing.cta.openApp}
		primaryHref={loginUrl}
		secondaryLabel={data.marketing.cta.register}
		secondaryHref={registerUrl}
	/>
</MarketingScrollReveal>

<style>
	.section {
		padding: 0 var(--space-lg) var(--space-xl);
	}

	.inner {
		max-width: 42rem;
		margin: 0 auto;
		display: grid;
		gap: var(--space-lg);
	}

	.eyebrow {
		margin: 0 0 var(--space-sm);
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-primary);
	}

	.disclaimer {
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-warning) 35%, transparent);
	}

	.muted {
		margin: 0;
		color: var(--color-text-muted);
	}

	.insights {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-md);
	}

	.insights li {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		display: grid;
		gap: var(--space-xs);
	}

	.insights strong {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.chart-card {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.chart-card h2 {
		margin: 0 0 var(--space-xs);
		font-size: var(--text-lg);
	}

	.chart-lead {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.weekday-chart {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: var(--space-sm);
		align-items: end;
		min-height: 12rem;
	}

	.weekday-bar {
		display: grid;
		gap: var(--space-xs);
		justify-items: center;
		height: 100%;
		grid-template-rows: auto 1fr auto;
	}

	.weekday-label,
	.weekday-count {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-align: center;
	}

	.weekday-fill {
		width: 100%;
		max-width: 2.5rem;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--color-primary) 85%, white),
			var(--color-primary)
		);
		align-self: end;
		min-height: 0.5rem;
	}

	.meta {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
