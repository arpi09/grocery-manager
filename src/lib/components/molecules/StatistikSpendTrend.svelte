<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { ReceiptSpendReport } from '$lib/domain/receipt-spend';
	import { maxWeeklyCount } from '$lib/domain/statistik';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		spend: ReceiptSpendReport;
	}

	let { spend }: Props = $props();

	const locale = $derived(getLocale());
	const maxWeekSek = $derived(maxWeeklyCount(spend.weeklySpend));

	function formatSek(sek: number): string {
		return new Intl.NumberFormat(locale === 'en' ? 'en-SE' : 'sv-SE', {
			maximumFractionDigits: 0
		}).format(sek);
	}

	function weekLabel(label: string): string {
		return label === 'current' ? t('stats.trendCurrentWeek') : label;
	}

	function weekBarPercent(sek: number): number {
		if (maxWeekSek <= 0) return 0;
		return Math.round((sek / maxWeekSek) * 100);
	}
</script>

<div class="spend-trend">
	<Card>
		<h2 class="section-title label-caps">{t('stats.spendWeeklyTitle')}</h2>
		<p class="section-lead">{t('stats.spendWeeklyLead')}</p>
		{#if spend.hasData}
			<ul class="trend-stats" aria-label={t('stats.spendWeeklyTitle')}>
				{#each spend.weeklySpend as bar (bar.weekStart)}
					<li class="trend-stat" class:trend-stat-current={bar.label === 'current'}>
						<span class="trend-week">{weekLabel(bar.label)}</span>
						<div class="trend-value-wrap">
							<div class="trend-bar" aria-hidden="true">
								<div class="trend-bar-fill" style="width: {weekBarPercent(bar.count)}%"></div>
							</div>
							<span
								class="trend-value"
								aria-label={t('stats.trendSekAria', { sek: formatSek(bar.count) })}
							>
								{formatSek(bar.count)} kr
							</span>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">{t('stats.spendEmptyBody')}</p>
		{/if}
	</Card>

	{#if spend.topStores.length > 0}
		<Card>
			<h2 class="section-title label-caps">{t('stats.topStoresTitle')}</h2>
			<ul class="store-list" aria-label={t('stats.topStoresTitle')}>
				{#each spend.topStores as store (store.storeLabel)}
					<li class="store-row">
						<span class="store-label">{store.storeLabel}</span>
						<span class="store-value" aria-label={t('stats.trendSekAria', { sek: formatSek(store.sek) })}>
							{formatSek(store.sek)} kr
						</span>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}

	<a class="price-history-link" href="/settings/price-memory">{t('stats.priceHistoryLink')}</a>
</div>

<style>
	.spend-trend {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.section-title {
		margin: 0 0 var(--space-sm);
		font-size: 0.95rem;
		font-weight: 700;
	}

	.section-lead,
	.muted {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.trend-stats,
	.store-list {
		list-style: none;
		margin: var(--space-sm) 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.trend-stat,
	.store-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.875rem;
		padding: 0.45rem 0.55rem;
		border-radius: var(--radius-sm);
		min-height: 2.75rem;
	}

	.trend-stat-current {
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));
	}

	.trend-week,
	.store-label {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.trend-stat-current .trend-week {
		color: var(--color-text);
		font-weight: 600;
	}

	.trend-value-wrap {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
		min-width: 0;
		justify-content: flex-end;
	}

	.trend-bar {
		flex: 1;
		max-width: 5rem;
		height: 0.45rem;
		background: var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.trend-bar-fill {
		height: 100%;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
	}

	.trend-value,
	.store-value {
		min-width: 4.5rem;
		text-align: right;
		font-weight: 800;
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary);
	}

	.price-history-link {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
	}

	.price-history-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
