<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { buildMarketingWebPageJsonLd, buildSoftwareApplicationJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
	const page = content.pantryApp;
	const siteOrigin = new URL(canonicalUrl).origin;
	const jsonLd = [
		buildMarketingWebPageJsonLd(siteOrigin, '/skafferi-app', page.meta.ogTitle, page.meta.description),
		buildSoftwareApplicationJsonLd(siteOrigin, '/skafferi-app', page.meta.description)
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
			{#if page.relatedHref && page.relatedLabel}
				<p class="related">
					<a href={page.relatedHref}>{page.relatedLabel}</a>
				</p>
			{/if}
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

	.inner {
		max-width: 42rem;
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

	.related {
		margin: var(--space-lg) 0 0;
		font-size: var(--font-size-body-sm);
	}

	.related a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.related a:hover {
		text-decoration: underline;
	}
</style>
