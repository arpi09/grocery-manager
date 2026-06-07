<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingStepCard from '$lib/components/marketing/MarketingStepCard.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { buildFaqPageJsonLd, buildMarketingWebPageJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
	const page = content.receiptGuide;
	const siteOrigin = new URL(canonicalUrl).origin;
	const faqItems = page.faq ?? [];
	const jsonLd = [
		buildMarketingWebPageJsonLd(siteOrigin, '/kvitto-pdf-kivra', page.meta.ogTitle, page.meta.description),
		...(faqItems.length > 0 ? [buildFaqPageJsonLd(canonicalUrl, faqItems)] : [])
	];
</script>

<MarketingSeoHead
	title={`${page.meta.title} — ${content.siteName}`}
	description={page.meta.description}
	ogTitle={page.meta.ogTitle}
	ogDescription={page.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
	{jsonLd}
/>

<MarketingPageHero>
	<h1>{page.title}</h1>
	<p>{page.lead}</p>
</MarketingPageHero>

<MarketingScrollReveal>
	<section class="section">
		<div class="inner">
			<ul class="points">
				{#each page.points as point (point)}
					<li>{point}</li>
				{/each}
			</ul>
		</div>
	</section>
</MarketingScrollReveal>

{#if page.steps && page.steps.length > 0}
	<MarketingScrollReveal delay={40}>
		<section class="section">
			<div class="inner steps-grid">
				{#each page.steps as step, i (step.step)}
					<div class="step-reveal" style:--card-i={i}>
						<MarketingStepCard {step} />
					</div>
				{/each}
			</div>
		</section>
	</MarketingScrollReveal>
{/if}

{#if faqItems.length > 0}
	<MarketingScrollReveal delay={60}>
		<section class="section">
			<div class="inner faq-list">
				{#each faqItems as item (item.question)}
					<details class="faq-item">
						<summary>{item.question}</summary>
						<p>{item.answer}</p>
					</details>
				{/each}
			</div>
		</section>
	</MarketingScrollReveal>
{/if}

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

{#if page.relatedHref && page.relatedLabel}
	<p class="related-wrap">
		<a href={page.relatedHref}>{page.relatedLabel}</a>
	</p>
{/if}

<style>
	.section {
		padding: 0 var(--space-lg) var(--space-lg);
	}

	.inner {
		max-width: 56rem;
		margin: 0 auto;
	}

	.points {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.steps-grid {
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

	.faq-list {
		max-width: 42rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.faq-item {
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.faq-item summary {
		cursor: pointer;
		font-weight: 600;
		list-style: none;
	}

	.faq-item summary::-webkit-details-marker {
		display: none;
	}

	.faq-item p {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
	}

	.related-wrap {
		text-align: center;
		padding: 0 var(--space-lg) var(--space-xl);
		font-size: var(--font-size-body-sm);
	}

	.related-wrap a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.related-wrap a:hover {
		text-decoration: underline;
	}

	@media (prefers-reduced-motion: reduce) {
		.step-reveal {
			opacity: 1;
			animation: none;
		}
	}
</style>
