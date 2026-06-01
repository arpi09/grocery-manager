<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingStepCard from '$lib/components/marketing/MarketingStepCard.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
</script>

<MarketingSeoHead
	title={content.howItWorks.meta.title}
	description={content.howItWorks.meta.description}
	ogTitle={content.howItWorks.meta.ogTitle}
	ogDescription={content.howItWorks.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
/>

<section class="page-hero">
	<div class="inner">
		<h1>{content.howItWorks.title}</h1>
		<p>{content.howItWorks.lead}</p>
	</div>
</section>

<section class="section">
	<div class="inner steps-grid">
		{#each content.howItWorks.steps as step (step.step)}
			<MarketingStepCard {step} />
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
</style>
