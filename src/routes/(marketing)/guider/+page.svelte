<script lang="ts">
	import { ArrowRight, BookOpen } from '@lucide/svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { buildMarketingWebPageJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const { marketing: content, guides, canonicalUrl, marketingLocale } = data;
	const page = content.guidesHub;
	const siteOrigin = new URL(canonicalUrl).origin;
	const jsonLd = buildMarketingWebPageJsonLd(
		siteOrigin,
		'/guider',
		page.meta.ogTitle,
		page.meta.description
	);

	function formatDate(isoDate: string): string {
		const [year, month, day] = isoDate.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString(
			marketingLocale === 'en' ? 'en-GB' : 'sv-SE',
			{ year: 'numeric', month: 'long', day: 'numeric' }
		);
	}
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
	<span class="eyebrow label-caps">
		<BookOpen size={14} strokeWidth={2} aria-hidden="true" />
		{page.kicker}
	</span>
	<h1>{page.title}</h1>
	<p>{page.lead}</p>
</MarketingPageHero>

<MarketingScrollReveal>
	<section class="section">
		<div class="inner">
			{#if guides.length === 0}
				<p class="empty">{page.empty}</p>
			{:else}
				<ul class="guide-list">
					{#each guides as guide (guide.slug)}
						<li>
							<article class="guide-card">
								<time class="date" datetime={guide.date}>{formatDate(guide.date)}</time>
								<h2>
									<a href="/guider/{guide.slug}">{guide.title}</a>
								</h2>
								<p>{guide.description}</p>
								<a class="read-more" href="/guider/{guide.slug}">
									{page.readMore}
									<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
								</a>
							</article>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</MarketingScrollReveal>

<style>
	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: var(--space-sm);
		color: var(--color-primary);
	}

	.section {
		padding: 0 var(--space-lg) var(--space-xl);
	}

	.inner {
		max-width: 48rem;
		margin: 0 auto;
	}

	.empty {
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.guide-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.guide-card {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.date {
		display: block;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.guide-card h2 {
		margin: var(--space-sm) 0 0;
		font-size: 1.25rem;
		line-height: 1.25;
	}

	.guide-card h2 a {
		color: inherit;
		text-decoration: none;
	}

	.guide-card h2 a:hover {
		color: var(--color-primary);
	}

	.guide-card p {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.read-more {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: var(--space-md);
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.read-more:hover {
		text-decoration: underline;
	}
</style>
