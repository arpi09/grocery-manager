<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { guideRegisterUrl } from '$lib/marketing/guides';
	import { trackProductEvent } from '$lib/client/product-events';
	import { buildArticleJsonLd } from '$lib/seo/seo';

	let { data } = $props();

	const { marketing: content, guide, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
	const siteOrigin = new URL(canonicalUrl).origin;
	const guideRegister = guideRegisterUrl(guide.slug, registerUrl);
	const jsonLd = buildArticleJsonLd(siteOrigin, {
		slug: guide.slug,
		title: guide.title,
		description: guide.description,
		date: guide.date,
		keywords: guide.keywords
	});

	function formatDate(isoDate: string): string {
		const [year, month, day] = isoDate.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString(
			marketingLocale === 'en' ? 'en-GB' : 'sv-SE',
			{ year: 'numeric', month: 'long', day: 'numeric' }
		);
	}

	function trackRegisterClick() {
		void trackProductEvent('register_click', {
			slug: guide.slug,
			source: 'guide'
		});
	}
</script>

<MarketingSeoHead
	title={`${guide.title} — ${content.siteName}`}
	description={guide.description}
	ogTitle={guide.title}
	ogDescription={guide.description}
	{canonicalUrl}
	locale={marketingLocale}
	{jsonLd}
/>

<article class="article">
	<header class="article-header">
		<p class="back">
			<a href="/guider">
				<ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
				{content.guidesHub.backToList}
			</a>
		</p>
		<h1>{guide.title}</h1>
		<p class="lead">{guide.description}</p>
		<time class="date" datetime={guide.date}>{formatDate(guide.date)}</time>
	</header>

	<MarketingScrollReveal immediate>
		<div class="prose">
			<!-- Guide HTML is authored in-repo markdown, not user-generated -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html guide.html}
		</div>
	</MarketingScrollReveal>
</article>

<MarketingScrollReveal delay={80} variant="scale">
	<MarketingCta
		title={content.guidesHub.ctaTitle}
		lead={content.guidesHub.ctaLead}
		primaryLabel={content.cta.tryFree}
		primaryHref={guideRegister}
		primaryAnalyticsId="marketing.register_guide"
		secondaryLabel={content.cta.login}
		secondaryHref={loginUrl}
		onRegisterClick={trackRegisterClick}
	/>
</MarketingScrollReveal>

<style>
	.article {
		padding: var(--space-lg);
		max-width: 42rem;
		margin: 0 auto;
	}

	.back a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.back a:hover {
		color: var(--color-primary);
	}

	.article-header h1 {
		margin: var(--space-md) 0 0;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		line-height: 1.15;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
		font-size: 1.05rem;
	}

	.date {
		display: block;
		margin-top: var(--space-md);
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.prose {
		margin-top: var(--space-xl);
		color: var(--color-text);
		line-height: 1.65;
	}

	.prose :global(h2) {
		margin: var(--space-xl) 0 var(--space-md);
		font-size: 1.35rem;
		line-height: 1.25;
	}

	.prose :global(h3) {
		margin: var(--space-lg) 0 var(--space-sm);
		font-size: 1.1rem;
	}

	.prose :global(p),
	.prose :global(li) {
		color: var(--color-text-muted);
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin: var(--space-md) 0;
		padding-left: 1.25rem;
	}

	.prose :global(a) {
		color: var(--color-primary);
		font-weight: 600;
	}

	.prose :global(strong) {
		color: var(--color-text);
	}

</style>
