<script lang="ts">
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { getPrivacyContent } from '$lib/marketing/privacy-content';
	import type { MarketingLocale } from '$lib/marketing/content';
	import { buildMarketingWebPageJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const privacy = getPrivacyContent(data.marketingLocale as MarketingLocale);
	const siteOrigin = new URL(data.canonicalUrl).origin;
	const jsonLd = buildMarketingWebPageJsonLd(
		siteOrigin,
		'/privacy',
		privacy.meta.ogTitle,
		privacy.meta.description
	);
</script>

<MarketingSeoHead
	title={privacy.meta.title}
	description={privacy.meta.description}
	ogTitle={privacy.meta.ogTitle}
	ogDescription={privacy.meta.ogDescription}
	canonicalUrl={data.canonicalUrl}
	locale={data.marketingLocale}
	{jsonLd}
/>

<MarketingPageHero>
	<h1>{privacy.title}</h1>
	<p>{privacy.lead}</p>
	<p class="meta">
		{privacy.updatedLabel}: {privacy.updatedDate} ·
		<a href={privacy.faqHref}>{privacy.faqLinkLabel}</a>
	</p>
</MarketingPageHero>

<MarketingScrollReveal>
	<section class="section">
		<div class="inner policy">
			{#each privacy.sections as section, i (section.id)}
				<article id={section.id} class="policy-section section-reveal" style:--section-i={i}>
					<h2>{section.title}</h2>
					{#each section.paragraphs as paragraph (paragraph)}
						<p>{paragraph}</p>
					{/each}
					{#if section.bullets}
						<ul>
							{#each section.bullets as item (item)}
								<li>{item}</li>
							{/each}
						</ul>
					{/if}
				</article>
			{/each}
		</div>
	</section>
</MarketingScrollReveal>

<style>
	.meta {
		font-size: var(--font-size-body-sm);
	}

	.meta a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.meta a:hover {
		text-decoration: underline;
	}

	.section {
		padding: 0 var(--space-lg) var(--space-xl);
	}

	.inner {
		max-width: 42rem;
		margin: 0 auto;
	}

	.policy {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	:global(.is-visible) .section-reveal {
		animation: section-in 0.5s ease forwards;
		animation-delay: calc(0.06s * var(--section-i, 0));
	}

	.section-reveal {
		opacity: 0;
	}

	@keyframes section-in {
		from {
			opacity: 0;
			transform: translateY(0.65rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.section-reveal {
			opacity: 1;
			animation: none;
		}
	}

	.policy-section h2 {
		margin: 0 0 var(--space-sm);
		font-size: 1.25rem;
		font-weight: var(--font-weight-display);
	}

	.policy-section p {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
		font-size: var(--font-size-body-sm);
	}

	.policy-section p:last-of-type {
		margin-bottom: 0;
	}

	.policy-section ul {
		margin: var(--space-sm) 0 0;
		padding-left: 1.25rem;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
	}

	.policy-section li + li {
		margin-top: var(--space-xs);
	}
</style>
