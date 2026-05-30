<script lang="ts">
	import { getPrivacyContent } from '$lib/marketing/privacy-content';
	import type { MarketingLocale } from '$lib/marketing/content';

	let { data } = $props();

	const privacy = getPrivacyContent(data.marketingLocale as MarketingLocale);
</script>

<svelte:head>
	<title>{privacy.title} — {data.marketing.siteName}</title>
	<meta name="description" content={privacy.lead} />
</svelte:head>

<section class="page-hero">
	<div class="inner">
		<h1>{privacy.title}</h1>
		<p>{privacy.lead}</p>
		<p class="meta">
			{privacy.updatedLabel}: {privacy.updatedDate} ·
			<a href={privacy.faqHref}>{privacy.faqLinkLabel}</a>
		</p>
	</div>
</section>

<section class="section">
	<div class="inner policy">
		{#each privacy.sections as section (section.id)}
			<article id={section.id} class="policy-section">
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

	.policy {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
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
