<script lang="ts">
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		expiringCount?: number;
		staleCount?: number;
	}

	let { expiringCount = 0, staleCount = 0 }: Props = $props();

	const hasStale = $derived(staleCount > 0);
	const hasExpiring = $derived(expiringCount > 0);
	const dualCta = $derived(hasStale && hasExpiring);

	const primaryHref = $derived(hasStale ? '/inventory/synk' : '/planer/vecka');
	const secondaryHref = $derived('/planer/vecka');

	const subtitle = $derived.by(() => {
		if (hasExpiring && hasStale) {
			return t('weeklyRitual.heroSubtitleDual', {
				stale: staleCount,
				expiring: expiringCount
			});
		}
		if (hasExpiring) {
			return t('weeklyRitual.heroSubtitleExpiring', { count: expiringCount });
		}
		if (hasStale) {
			return t('weeklyRitual.heroSubtitleStale', { count: staleCount });
		}
		return t('weeklyRitual.heroSubtitleSyncDefault');
	});

	const title = $derived(
		hasStale && !hasExpiring ? t('weeklyRitual.heroTitleSync') : t('weeklyRitual.heroTitle')
	);

	const badge = $derived(
		hasStale && !hasExpiring ? t('weeklyRitual.heroBadgeSync') : t('weeklyRitual.heroBadge')
	);

	const primaryCta = $derived(
		hasStale ? t('weeklyRitual.heroCtaSync') : t('weeklyRitual.heroCta')
	);
</script>

{#if dualCta}
	<section class="weekly-ritual-hero weekly-ritual-hero--dual motion-fade-in" aria-labelledby="weekly-ritual-hero-heading">
		<div class="hero-copy">
			<span class="hero-badge">{t('weeklyRitual.heroBadgeDual')}</span>
			<h2 id="weekly-ritual-hero-heading">{t('weeklyRitual.heroTitleDual')}</h2>
			<p class="hero-sub">{subtitle}</p>
			<div class="hero-ctas">
				<a class="hero-cta hero-cta--primary" href="/inventory/synk" data-analytics-id="weekly_ritual.hero_sync">
					{t('weeklyRitual.heroCtaSync')}
				</a>
				<a class="hero-cta hero-cta--secondary" href={secondaryHref} data-analytics-id="weekly_ritual.hero_plan">
					{t('weeklyRitual.heroCtaPlan')}
				</a>
			</div>
		</div>
		<span class="hero-icon" aria-hidden="true">
			<FeatureIcon id="sparkle" size={28} />
		</span>
	</section>
{:else}
	<a class="weekly-ritual-hero motion-fade-in" href={primaryHref} data-analytics-id="weekly_ritual.hero" aria-labelledby="weekly-ritual-hero-heading">
		<div class="hero-copy">
			<span class="hero-badge">{badge}</span>
			<h2 id="weekly-ritual-hero-heading">{title}</h2>
			<p class="hero-sub">{subtitle}</p>
			<span class="hero-cta">{primaryCta}</span>
		</div>
		<span class="hero-icon" aria-hidden="true">
			<FeatureIcon id="sparkle" size={28} />
		</span>
	</a>
{/if}

<style>
	.weekly-ritual-hero {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 16%, var(--color-surface)),
			color-mix(in srgb, var(--color-warning) 12%, var(--color-surface))
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
		box-shadow: var(--shadow-md);
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
	}

	a.weekly-ritual-hero:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(31, 42, 36, 0.12);
		text-decoration: none;
	}

	.hero-badge {
		display: inline-block;
		margin-bottom: var(--space-xs);
		padding: 0.15rem 0.55rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		border-radius: 999px;
	}

	.hero-copy h2 {
		margin: 0;
		font-size: 1.25rem;
		letter-spacing: -0.02em;
	}

	.hero-sub {
		margin: var(--space-xs) 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
		max-width: 42ch;
	}

	.hero-cta {
		display: inline-flex;
		align-items: center;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.hero-ctas {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.hero-cta--primary {
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		background: var(--color-primary);
		color: #fff;
		text-decoration: none;
	}

	.hero-cta--secondary {
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		text-decoration: none;
	}

	.hero-icon {
		flex-shrink: 0;
		display: flex;
		color: var(--color-primary);
		opacity: 0.85;
	}
</style>
