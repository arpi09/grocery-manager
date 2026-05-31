<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingFeatureCard from '$lib/components/marketing/MarketingFeatureCard.svelte';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl } = data;
</script>

<svelte:head>
	<title>{content.features.meta.title} — {content.siteName}</title>
	<meta name="description" content={content.features.meta.description} />
	<meta property="og:title" content={content.features.meta.ogTitle} />
	<meta property="og:description" content={content.features.meta.ogDescription} />
	<meta name="twitter:title" content={content.features.meta.ogTitle} />
	<meta name="twitter:description" content={content.features.meta.ogDescription} />
</svelte:head>

<section class="page-hero">
	<div class="inner">
		<h1>{content.features.title}</h1>
		<p>{content.features.lead}</p>
	</div>
</section>

<section class="section">
	<div class="inner feature-grid">
		{#each content.features.items as feature (feature.title)}
			<MarketingFeatureCard {feature} />
		{/each}
	</div>
</section>

<MarketingCta
	title={content.landing.finalCtaTitle}
	lead={content.landing.finalCtaLead}
	primaryLabel={content.cta.openApp}
	primaryHref={loginUrl}
	secondaryLabel={content.cta.register}
	secondaryHref={registerUrl}
/>

<style>
	.page-hero {
		padding: var(--space-xl) var(--space-lg) var(--space-md);
	}

	.inner {
		max-width: 42rem;
		margin: 0 auto;
	}

	.page-hero h1 {
		margin: 0;
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
	}

	.page-hero p {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

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
</style>
