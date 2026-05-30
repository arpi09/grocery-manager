<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl } = data;
</script>

<svelte:head>
	<title>{content.faq.title} — {content.siteName}</title>
	<meta name="description" content={content.faq.lead} />
</svelte:head>

<section class="page-hero">
	<div class="inner">
		<h1>{content.faq.title}</h1>
		<p>{content.faq.lead}</p>
	</div>
</section>

<section class="section">
	<div class="inner faq-list">
		{#each content.faq.items as item (item.question)}
			<details class="faq-item">
				<summary>{item.question}</summary>
				<p>{item.answer}</p>
			</details>
		{/each}
	</div>
</section>

<section class="contact">
	<div class="inner">
		<h2>{content.faq.contactLabel}</h2>
		<p>{content.faq.contactLead}</p>
		<a href="mailto:{content.faq.contactEmail}">{content.faq.contactEmail}</a>
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
		padding: 0 var(--space-lg) var(--space-lg);
	}

	.faq-list {
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
		line-height: var(--line-height-body);
		font-size: var(--font-size-body-sm);
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
