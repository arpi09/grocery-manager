<script lang="ts">
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		expiringCount?: number;
	}

	let { expiringCount = 0 }: Props = $props();

	const subtitle = $derived(
		expiringCount > 0
			? t('weeklyRitual.heroSubtitleExpiring', { count: expiringCount })
			: t('weeklyRitual.heroSubtitleDefault')
	);
</script>

<a class="weekly-ritual-hero motion-fade-in" href="/planer/vecka" data-analytics-id="weekly_ritual.hero" aria-labelledby="weekly-ritual-hero-heading">
	<div class="hero-copy">
		<span class="hero-badge">{t('weeklyRitual.heroBadge')}</span>
		<h2 id="weekly-ritual-hero-heading">{t('weeklyRitual.heroTitle')}</h2>
		<p class="hero-sub">{subtitle}</p>
		<span class="hero-cta">{t('weeklyRitual.heroCta')}</span>
	</div>
	<span class="hero-icon" aria-hidden="true">
		<FeatureIcon id="sparkle" size={28} />
	</span>
</a>

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

	.weekly-ritual-hero:hover {
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

	.hero-icon {
		flex-shrink: 0;
		display: flex;
		color: var(--color-primary);
		opacity: 0.85;
	}
</style>
