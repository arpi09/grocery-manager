<script lang="ts">
	import GamificationIllustration from '$lib/components/atoms/GamificationIllustration.svelte';
	import type { WrappedReportData } from '$lib/domain/wrapped';
	import { t } from '$lib/i18n';

	interface Props {
		report: WrappedReportData;
		monthLabel: string;
	}

	let { report, monthLabel }: Props = $props();

	const savingsSek = $derived(
		report.monthlySavings.savedSek > 0 ? report.monthlySavings.savedSek : report.lifetimeSavedSek
	);
	const savingsKg = $derived(report.monthlySavings.savedKg);
	const headline = $derived(
		t('wrapped.shareCardHeadline', { sek: savingsSek, kg: savingsKg })
	);
	const statsLine = $derived(
		report.topProduct
			? t('wrapped.shareCardTopProduct', { product: report.topProduct })
			: report.zeroWasteWeeks
				? t('wrapped.shareCardStreak', { count: report.zeroWasteWeeks ?? 0 })
				: t('wrapped.shareCardConsumed', { count: report.consumedThisMonth })
	);
</script>

<div class="share-card" data-testid="wrapped-share-card">
	<div class="share-glow share-glow-a" aria-hidden="true"></div>
	<div class="share-glow share-glow-b" aria-hidden="true"></div>
	<p class="brand">{t('nav.brandName')}</p>
	<p class="month">{monthLabel}</p>
	<div class="illus-wrap">
		<GamificationIllustration variant="savings" size={120} />
	</div>
	<h2 class="headline">{headline}</h2>
	<p class="stats">{statsLine}</p>
	<p class="footer">{t('wrapped.shareCardFooter')}</p>
</div>

<style>
	.share-card {
		position: relative;
		width: 100%;
		max-width: 22.5rem;
		aspect-ratio: 9 / 16;
		margin: 0 auto;
		padding: clamp(1.25rem, 4vw, 1.75rem) clamp(1rem, 3.5vw, 1.5rem);
		min-width: 0;
		border-radius: 1.5rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		background: linear-gradient(
			155deg,
			color-mix(in srgb, var(--color-success) 10%, var(--color-surface)),
			var(--color-surface),
			color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted))
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
		box-shadow: var(--shadow-md);
	}

	.share-glow {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
	}

	.share-glow-a {
		width: 12rem;
		height: 12rem;
		top: -2rem;
		right: -2rem;
		background: color-mix(in srgb, var(--color-primary) 14%, transparent);
	}

	.share-glow-b {
		width: 14rem;
		height: 14rem;
		bottom: -3rem;
		left: -3rem;
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
	}

	.brand {
		position: relative;
		margin: 0;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: 0.02em;
	}

	.month {
		position: relative;
		margin: 0.35rem 0 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: capitalize;
	}

	.illus-wrap {
		position: relative;
		margin: 1.25rem 0 0.75rem;
	}

	.headline {
		position: relative;
		margin: 0;
		font-size: clamp(1.05rem, 4.5vw, 1.35rem);
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: var(--color-text);
		overflow-wrap: anywhere;
	}

	.stats {
		position: relative;
		margin: 0.85rem 0 0;
		font-size: clamp(0.875rem, 3.5vw, 1rem);
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

	.footer {
		position: relative;
		margin: auto 0 0;
		padding: 1rem 0.5rem 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
		line-height: 1.45;
		border-top: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
		width: 100%;
	}

	@media (max-width: 480px) {
		.illus-wrap :global(.gamification-illus) {
			--illus-size: 88px;
		}

		.footer {
			font-size: 0.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.share-card {
			transition: none;
		}
	}
</style>
