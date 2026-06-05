<script lang="ts">
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

	.feature-grid {
		max-width: 72rem;
		margin: 0 auto;
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
</style>
