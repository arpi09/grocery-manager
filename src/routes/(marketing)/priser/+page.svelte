<script lang="ts">
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingPageHero from '$lib/components/marketing/MarketingPageHero.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { getPricingContent } from '$lib/marketing/pricing-content';
	import type { MarketingLocale } from '$lib/marketing/content';

	let { data } = $props();

	const pricing = getPricingContent(data.marketingLocale as MarketingLocale);
	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
	const upgradeUrl = '/settings#plan-upgrade';
</script>

<MarketingSeoHead
	title={pricing.meta.title}
	description={pricing.meta.description}
	ogTitle={pricing.meta.ogTitle}
	ogDescription={pricing.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
/>

<MarketingPageHero>
	<h1>{pricing.title}</h1>
	<p>{pricing.lead}</p>
	<p class="note pro-live">{pricing.proLiveNote}</p>
</MarketingPageHero>

<MarketingScrollReveal>
<section class="section">
	<div class="inner">
		<table class="compare">
			<thead>
				<tr>
					<th scope="col"></th>
					<th scope="col">{pricing.freeTitle}</th>
					<th scope="col">{pricing.proTitle}</th>
				</tr>
			</thead>
			<tbody>
				{#each pricing.comparisonRows as row (row.label)}
					<tr>
						<th scope="row">{row.label}</th>
						<td>{row.free}</td>
						<td>{row.pro}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<h2>{pricing.proTitle}</h2>
		<p class="pro-price">{pricing.proPriceLabel}</p>
		<ul class="pro-list">
			{#each pricing.proBullets as bullet (bullet)}
				<li>{bullet}</li>
			{/each}
		</ul>

		<section class="pro-cta" aria-labelledby="pro-cta-title">
			<h2 id="pro-cta-title">{pricing.proCtaTitle}</h2>
			<p>{pricing.proCtaLead}</p>
			<div class="pro-cta-actions">
				<MarketingButtonLink href={upgradeUrl}>{pricing.proCtaUpgradeLabel}</MarketingButtonLink>
				<MarketingButtonLink href={registerUrl} variant="secondary">
					{pricing.proCtaRegisterLabel}
				</MarketingButtonLink>
			</div>
		</section>

		<h2>{pricing.priceHypothesisTitle}</h2>
		<p>{pricing.priceHypothesisBody}</p>

		<h2>{pricing.aiNoteTitle}</h2>
		<p>{pricing.aiNoteBody}</p>

		<h2>{pricing.stripeNoteTitle}</h2>
		<p>{pricing.stripeNoteBody}</p>

		<p class="faq-crosslink">
			<a href={pricing.faqHref}>{pricing.faqLinkLabel}</a>
		</p>
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
	.note {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		border: 1px solid var(--color-border);
	}

	.note.pro-live {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		color: var(--color-text);
	}

	.section {
		padding: 0 var(--space-lg) var(--space-xl);
	}

	.section h2 {
		margin: var(--space-xl) 0 var(--space-sm);
		font-size: 1.15rem;
	}

	.section p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.pro-price {
		margin: 0 0 var(--space-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.compare {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-body-sm);
	}

	.compare th,
	.compare td {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		text-align: left;
	}

	.compare thead th {
		background: var(--color-surface);
		font-weight: 600;
	}

	.compare tbody th {
		font-weight: 500;
		background: var(--color-surface-muted);
	}

	.pro-list {
		margin: 0;
		padding-left: 1.25rem;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.pro-list li + li {
		margin-top: var(--space-xs);
	}

	.pro-cta {
		margin-top: var(--space-xl);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--color-primary) 14%, var(--color-surface)),
			var(--color-surface)
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
	}

	.pro-cta h2 {
		margin: 0 0 var(--space-sm);
	}

	.pro-cta-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	.faq-crosslink {
		margin-top: var(--space-xl);
		font-size: var(--font-size-body-sm);
	}

	.faq-crosslink a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.faq-crosslink a:hover {
		text-decoration: underline;
	}
</style>
