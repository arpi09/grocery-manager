<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import AnimatedNumber from '$lib/components/atoms/AnimatedNumber.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { ReceiptSpendReport } from '$lib/domain/receipt-spend';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		spend: ReceiptSpendReport;
	}

	let { spend }: Props = $props();

	const locale = $derived(getLocale());

	function formatSek(sek: number): string {
		return new Intl.NumberFormat(locale === 'en' ? 'en-SE' : 'sv-SE', {
			maximumFractionDigits: 0
		}).format(sek);
	}

	function deltaText(delta: number | null): string | null {
		if (delta == null) return null;
		if (delta === 0) return t('stats.spendHeroDeltaSame');
		const amount = formatSek(Math.abs(delta));
		return delta > 0
			? t('stats.spendHeroDeltaMore', { delta: amount })
			: t('stats.spendHeroDeltaLess', { delta: amount });
	}

	const deltaLabel = $derived(deltaText(spend.monthDeltaSek));
</script>

<section class="spend-hero motion-fade-in" aria-labelledby="statistik-spend-heading">
	{#if !spend.hasData}
		<Card class="spend-card spend-empty">
			<div class="card-header">
				<span class="card-icon" aria-hidden="true">
					<FeatureIcon id="sparkle" size={20} />
				</span>
				<h2 id="statistik-spend-heading">{t('stats.spendEmptyTitle')}</h2>
			</div>
			<p class="empty-body">{t('stats.spendEmptyBody')}</p>
			<a class="empty-cta" href="/scan?mode=receipt&from=/statistik">{t('stats.spendEmptyCta')}</a>
		</Card>
	{:else}
		<Card class="spend-card">
			<div class="card-header">
				<span class="card-icon" aria-hidden="true">
					<FeatureIcon id="sparkle" size={20} />
				</span>
				<h2 id="statistik-spend-heading">{t('stats.spendHeroTitle')}</h2>
			</div>
			<p class="amount-line" aria-live="polite">
				<span class="amount-prefix">{t('stats.spendHeroPrefix')}</span>
				<span class="amount-value">
					<AnimatedNumber value={spend.thisMonthSek} />
				</span>
				<span class="amount-unit">kr</span>
			</p>
			{#if deltaLabel}
				<p class="delta-line">{deltaLabel}</p>
			{/if}
			{#if spend.tripCountThisMonth > 0}
				<p class="trip-line">{t('stats.tripCount', { count: spend.tripCountThisMonth })}</p>
			{/if}
			<p class="footnote">{t('stats.spendFootnote')}</p>
		</Card>
	{/if}
</section>

<style>
	.spend-hero :global(.spend-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)),
			var(--color-surface)
		);
		border-color: color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.card-header h2 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.card-icon {
		display: flex;
		color: var(--color-primary);
	}

	.amount-line {
		margin: 0;
		font-size: clamp(2rem, 8vw, 2.75rem);
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: var(--color-text);
	}

	.amount-value {
		font-variant-numeric: tabular-nums;
		color: var(--color-primary);
	}

	.amount-prefix {
		font-weight: 700;
		color: var(--color-text-muted);
		margin-right: 0.15em;
	}

	.amount-unit {
		font-size: 0.55em;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.delta-line,
	.trip-line,
	.footnote,
	.empty-body {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.footnote {
		font-size: 0.8125rem;
	}

	.empty-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0 var(--space-md);
		margin-top: var(--space-xs);
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 600;
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.empty-cta:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.spend-hero {
			animation: none;
		}
	}
</style>
