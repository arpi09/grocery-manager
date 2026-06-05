<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { getPrivacyContent } from '$lib/marketing/privacy-content';
	import type { MarketingLocale } from '$lib/marketing/content';
	import { buildFaqPageJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
	const privacyLinkLabel = getPrivacyContent(data.marketingLocale as MarketingLocale).title;
	const jsonLd = buildFaqPageJsonLd(canonicalUrl, content.faq.items);
</script>

<MarketingSeoHead
	title={content.faq.meta.title}
	description={content.faq.meta.description}
	ogTitle={content.faq.meta.ogTitle}
	ogDescription={content.faq.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
	{jsonLd}
/>

<MarketingPageHero>
	<h1>{content.faq.title}</h1>
	<p>{content.faq.lead}</p>
</MarketingPageHero>

<MarketingScrollReveal>
	<section class="section">
		<div class="inner faq-list">
			{#each content.faq.items as item, i (item.question)}
				<details class="faq-item" style:--faq-i={i}>
					<summary>{item.question}</summary>
					<p>{item.answer}</p>
				</details>
			{/each}
			<p class="privacy-crosslink">
				<a href="/priser">{content.faq.pricingLinkLabel}</a>
				·
				<a href="/privacy">{privacyLinkLabel}</a>
			</p>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={60}>
	<section class="contact">
		<div class="inner">
			<h2>{content.faq.contactLabel}</h2>
			<p>{content.faq.contactLead}</p>
			<a href="mailto:{content.faq.contactEmail}">{content.faq.contactEmail}</a>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={80}>
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
		padding: 0 var(--space-lg) var(--space-lg);
	}

	.inner {
		max-width: 42rem;
		margin: 0 auto;
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	:global(.is-visible) .faq-item {
		animation: faq-in 0.45s ease forwards;
		animation-delay: calc(0.05s * var(--faq-i, 0));
	}

	.faq-item {
		opacity: 0;
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.faq-item[open] {
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		box-shadow: var(--shadow-sm);
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
		line-height: var(--line-height-body);
		font-size: var(--font-size-body-sm);
	}

	@keyframes faq-in {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.faq-item {
			opacity: 1;
			animation: none;
		}
	}

	.privacy-crosslink {
		margin: var(--space-lg) 0 0;
		font-size: var(--font-size-body-sm);
	}

	.privacy-crosslink a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.privacy-crosslink a:hover {
		text-decoration: underline;
	}

	.contact {
		padding: 0 var(--space-lg) var(--space-xl);
		text-align: center;
	}

	.contact h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.contact p {
		margin: var(--space-sm) 0 var(--space-md);
		color: var(--color-text-muted);
	}

	.contact a {
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
