<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingStepCard from '$lib/components/marketing/MarketingStepCard.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { buildMarketingWebPageJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
	const siteOrigin = new URL(canonicalUrl).origin;
	const jsonLd = buildMarketingWebPageJsonLd(
		siteOrigin,
		'/sa-fungerar-det',
		content.howItWorks.meta.ogTitle,
		content.howItWorks.meta.description
	);
</script>

<MarketingSeoHead
	title={content.howItWorks.meta.title}
	description={content.howItWorks.meta.description}
	ogTitle={content.howItWorks.meta.ogTitle}
	ogDescription={content.howItWorks.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
	{jsonLd}
/>

<MarketingPageHero>
	<h1>{content.howItWorks.title}</h1>
	<p>{content.howItWorks.lead}</p>
</MarketingPageHero>

<MarketingScrollReveal>
	<section class="section">
		<div class="inner steps-grid">
			{#each content.howItWorks.steps as step, i (step.step)}
				<div class="step-reveal" style:--card-i={i}>
					<MarketingStepCard {step} />
				</div>
			{/each}
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={80} variant="scale">
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

	.steps-grid {
		max-width: 56rem;
		margin: 0 auto;
		display: grid;
		gap: var(--space-md);
	}

	@media (min-width: 768px) {
		.steps-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	:global(.is-visible) .step-reveal {
		animation: card-stagger 0.55s ease forwards;
		animation-delay: calc(0.08s * var(--card-i, 0));
	}

	.step-reveal {
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
		.step-reveal {
			opacity: 1;
			animation: none;
		}
	}
</style>
