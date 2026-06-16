<script lang="ts">
	import { Shield, Store } from '@lucide/svelte';
	import ComparisonTable from '$lib/components/marketing/ComparisonTable.svelte';
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingFeatureCard from '$lib/components/marketing/MarketingFeatureCard.svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { buildMarketingWebPageJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
	const siteOrigin = new URL(canonicalUrl).origin;
	const jsonLd = buildMarketingWebPageJsonLd(
		siteOrigin,
		'/funktioner',
		content.features.meta.ogTitle,
		content.features.meta.description
	);
</script>

<MarketingSeoHead
	title={`${content.features.meta.title} — ${content.siteName}`}
	description={content.features.meta.description}
	ogTitle={content.features.meta.ogTitle}
	ogDescription={content.features.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
	{jsonLd}
/>

<MarketingPageHero>
	<h1>{content.features.title}</h1>
	<p>{content.features.lead}</p>
</MarketingPageHero>

<MarketingScrollReveal>
	<section class="section">
		<div class="inner feature-grid">
			{#each content.features.items as feature, i (feature.title)}
				<div class="feature-reveal" style:--card-i={i}>
					<MarketingFeatureCard {feature} />
				</div>
			{/each}
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={60}>
	<section id="jamforelse" class="section comparison-section">
		<div class="inner">
			<header class="section-header center">
				<span class="section-kicker label-caps">
					<Store size={14} strokeWidth={2} aria-hidden="true" />
					{content.landing.comparisonKicker}
				</span>
				<h2>{content.comparison.title}</h2>
				<p>{content.comparison.lead}</p>
			</header>
			<ComparisonTable comparison={content.comparison} />
			<p class="comparison-disclaimer">
				<Shield size={14} strokeWidth={2} aria-hidden="true" />
				{content.comparison.disclaimer}
			</p>
			<div class="comparison-cta">
				<MarketingButtonLink href={registerUrl}>{content.cta.tryFree}</MarketingButtonLink>
				<MarketingButtonLink href={loginUrl} variant="secondary">{content.cta.login}</MarketingButtonLink>
			</div>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={80} variant="fade">
	<MarketingCta
		title={content.landing.finalCtaTitle}
		lead={content.landing.finalCtaLead}
		primaryLabel={content.cta.openApp}
		primaryHref={loginUrl}
		secondaryLabel={content.cta.register}
		secondaryHref={registerUrl}
	/>
</MarketingScrollReveal>

<style>
	.section {
		padding: 0 var(--space-lg) var(--space-xl);
	}

	.inner {
		max-width: 72rem;
		margin: 0 auto;
	}

	.feature-grid {
		display: grid;
		gap: var(--space-md);
	}

	@media (min-width: 768px) {
		.feature-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.feature-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	:global(.is-visible) .feature-reveal {
		animation: card-stagger 0.55s ease forwards;
		animation-delay: calc(0.07s * var(--card-i, 0));
	}

	.feature-reveal {
		opacity: 0;
	}

	@keyframes card-stagger {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.feature-reveal {
			opacity: 1;
			animation: none;
		}
	}

	.comparison-section {
		padding-top: var(--space-xl);
	}

	.section-header h2 {
		margin: 0;
		font-size: clamp(1.5rem, 3.5vw, 2rem);
		font-weight: var(--font-weight-display);
		line-height: 1.15;
		letter-spacing: -0.02em;
	}

	.section-header p {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		max-width: 50ch;
		line-height: 1.55;
	}

	.section-header.center {
		text-align: center;
	}

	.section-header.center p {
		margin-inline: auto;
	}

	.section-kicker {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: var(--space-sm);
		color: var(--color-primary);
	}

	.comparison-disclaimer {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		margin: var(--space-lg) 0 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		max-width: 58ch;
		line-height: var(--line-height-body);
	}

	.comparison-cta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}
</style>
