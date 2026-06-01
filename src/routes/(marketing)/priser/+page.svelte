<script lang="ts">
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import ProWaitlistForm from '$lib/components/marketing/ProWaitlistForm.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { getPricingContent } from '$lib/marketing/pricing-content';
	import type { MarketingLocale } from '$lib/marketing/content';

	let { data, form } = $props();

	const pricing = getPricingContent(data.marketingLocale as MarketingLocale);
	const { marketing: content, loginUrl, registerUrl, canonicalUrl, marketingLocale } = data;
</script>

<MarketingSeoHead
	title={pricing.meta.title}
	description={pricing.meta.description}
	ogTitle={pricing.meta.ogTitle}
	ogDescription={pricing.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
/>

<section class="page-hero">
	<div class="inner">
		<h1>{pricing.title}</h1>
		<p>{pricing.lead}</p>
		<p class="note">{pricing.comingSoonNote}</p>
	</div>
</section>

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
		<ul class="pro-list">
			{#each pricing.proBullets as bullet (bullet)}
				<li>{bullet}</li>
			{/each}
		</ul>

		<h2>{pricing.priceHypothesisTitle}</h2>
		<p>{pricing.priceHypothesisBody}</p>

		<h2>{pricing.aiNoteTitle}</h2>
		<p>{pricing.aiNoteBody}</p>

		<h2>{pricing.stripeNoteTitle}</h2>
		<p>{pricing.stripeNoteBody}</p>

		<ProWaitlistForm
			action="?/joinProWaitlist"
			source="priser"
			title={pricing.waitlistTitle}
			description={pricing.waitlistDescription}
			emailLabel={pricing.waitlistEmailLabel}
			submitLabel={pricing.waitlistSubmitLabel}
			successMessage={pricing.waitlistSuccess}
			existsMessage={pricing.waitlistExists}
			{form}
		/>

		<p class="faq-crosslink">
			<a href={pricing.faqHref}>{pricing.faqLinkLabel}</a>
		</p>
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

	.note {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		border: 1px solid var(--color-border);
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
