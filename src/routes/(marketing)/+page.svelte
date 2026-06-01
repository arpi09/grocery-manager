<script lang="ts">
	import { Barcode, Camera, Refrigerator } from '@lucide/svelte';
	import ComparisonTable from '$lib/components/marketing/ComparisonTable.svelte';
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingFeatureCard from '$lib/components/marketing/MarketingFeatureCard.svelte';
	import MarketingStepCard from '$lib/components/marketing/MarketingStepCard.svelte';
	import { trackProductEvent } from '$lib/client/product-events';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, hero } = data;
	const previewFeatures = content.features.items.slice(0, 3);

	function trackRegisterClick() {
		void trackProductEvent('register_click', { variant: data.landingVariant });
	}
</script>

<svelte:head>
	<title>{content.meta.title}</title>
	<meta name="description" content={content.meta.description} />
	<meta property="og:title" content={content.meta.ogTitle} />
	<meta property="og:description" content={content.meta.ogDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="sv_SE" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={content.meta.ogTitle} />
	<meta name="twitter:description" content={content.meta.ogDescription} />
</svelte:head>

<section class="hero">
	<div class="hero-inner">
		<p class="eyebrow label-caps">{content.siteName}</p>
		<h1 class="hero-title">{hero.heroTitle}</h1>
		<p class="hero-lead">{hero.heroLead}</p>
		<p class="hero-secondary">{hero.heroSecondary}</p>

		<div class="hero-actions">
			<MarketingButtonLink href={loginUrl}>{content.cta.openApp}</MarketingButtonLink>
			<MarketingButtonLink href={loginUrl} variant="secondary">{content.cta.login}</MarketingButtonLink>
			<a href={registerUrl} class="hero-register" onclick={trackRegisterClick}>{content.cta.tryFree}</a>
		</div>

		<ul class="hero-highlights" aria-label="Huvudfunktioner">
			<li>
				<Barcode size={20} strokeWidth={2} aria-hidden="true" />
				<span>Streckkod</span>
			</li>
			<li>
				<Camera size={20} strokeWidth={2} aria-hidden="true" />
				<span>Kvitto & foto</span>
			</li>
			<li>
				<Refrigerator size={20} strokeWidth={2} aria-hidden="true" />
				<span>Kyl, frys & skafferi</span>
			</li>
		</ul>
	</div>

	<div class="hero-visual" aria-hidden="true">
		<div class="mock-panel">
			<div class="mock-header">
				<span class="dot"></span>
				<span class="dot"></span>
				<span class="dot"></span>
			</div>
			<div class="mock-body">
				<div class="mock-row accent"></div>
				<div class="mock-row"></div>
				<div class="mock-row short"></div>
				<div class="mock-grid">
					<div class="mock-card"></div>
					<div class="mock-card"></div>
					<div class="mock-card"></div>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="section">
	<div class="section-inner">
		<header class="section-header">
			<h2>{content.landing.featuresTitle}</h2>
			<p>{content.landing.featuresLead}</p>
		</header>
		<div class="feature-grid">
			{#each previewFeatures as feature (feature.title)}
				<MarketingFeatureCard {feature} />
			{/each}
		</div>
		<p class="section-link">
			<a href="/funktioner">Se alla funktioner →</a>
		</p>
	</div>
</section>

<section id="jamforelse" class="section">
	<div class="section-inner">
		<header class="section-header">
			<h2>{content.comparison.title}</h2>
			<p>{content.comparison.lead}</p>
		</header>
		<ComparisonTable comparison={content.comparison} />
		<p class="comparison-disclaimer">{content.comparison.disclaimer}</p>
		<div class="comparison-cta">
			<MarketingButtonLink href={loginUrl}>{content.cta.openApp}</MarketingButtonLink>
			<a href={loginUrl} class="comparison-login">{content.cta.login}</a>
		</div>
	</div>
</section>

<section class="section muted">
	<div class="section-inner">
		<header class="section-header">
			<h2>{content.landing.stepsTitle}</h2>
			<p>{content.landing.stepsLead}</p>
		</header>
		<div class="steps-grid">
			{#each content.howItWorks.steps as step (step.step)}
				<MarketingStepCard {step} />
			{/each}
		</div>
		<p class="section-link">
			<a href="/sa-fungerar-det">Läs mer om hur det fungerar →</a>
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
	onRegisterClick={trackRegisterClick}
/>

<style>
	.hero {
		display: grid;
		gap: var(--space-xl);
		max-width: 72rem;
		margin: 0 auto;
		padding: var(--space-xl) var(--space-lg) var(--space-xl);
		align-items: center;
	}

	@media (min-width: 960px) {
		.hero {
			grid-template-columns: 1.1fr 0.9fr;
			padding-top: calc(var(--space-xl) * 1.5);
		}
	}

	.eyebrow {
		margin: 0 0 var(--space-sm);
		color: var(--color-primary);
	}

	.hero-title {
		margin: 0;
		font-size: clamp(2rem, 5vw, 2.75rem);
		font-weight: var(--font-weight-display);
		line-height: 1.15;
		max-width: 16ch;
	}

	.hero-lead {
		margin: var(--space-md) 0 0;
		font-size: 1.125rem;
		line-height: var(--line-height-body);
		color: var(--color-text);
		max-width: 42ch;
	}

	.hero-secondary {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
		max-width: 42ch;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md) var(--space-lg);
		margin-top: var(--space-lg);
	}

	.hero-register {
		color: var(--color-text-muted);
		font-weight: 500;
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.hero-register:hover {
		color: var(--color-primary);
	}

	.hero-highlights {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md) var(--space-lg);
		margin: var(--space-lg) 0 0;
		padding: 0;
		list-style: none;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
	}

	.hero-highlights li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.hero-visual {
		display: flex;
		justify-content: center;
	}

	.mock-panel {
		width: min(100%, 22rem);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.mock-header {
		display: flex;
		gap: 0.35rem;
		padding: var(--space-md);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: var(--color-border);
	}

	.mock-body {
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.mock-row {
		height: 0.65rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
	}

	.mock-row.accent {
		width: 55%;
		background: color-mix(in srgb, var(--color-primary) 25%, var(--color-surface-muted));
	}

	.mock-row.short {
		width: 70%;
	}

	.mock-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	.mock-card {
		aspect-ratio: 1;
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
	}

	.section {
		padding: var(--space-xl) var(--space-lg);
	}

	.section.muted {
		background: color-mix(in srgb, var(--color-surface-muted) 70%, transparent);
	}

	.section-inner {
		max-width: 72rem;
		margin: 0 auto;
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
	}

	.section-header p {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		max-width: 48ch;
	}

	.feature-grid,
	.steps-grid {
		display: grid;
		gap: var(--space-md);
		margin-top: var(--space-lg);
	}

	@media (min-width: 768px) {
		.feature-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.steps-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.section-link {
		margin: var(--space-lg) 0 0;
	}

	.section-link a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.section-link a:hover {
		text-decoration: underline;
	}

	.comparison-disclaimer {
		margin: var(--space-lg) 0 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		max-width: 58ch;
		line-height: var(--line-height-body);
	}

	.comparison-cta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md) var(--space-lg);
		margin-top: var(--space-lg);
	}

	.comparison-login {
		color: var(--color-text-muted);
		font-weight: 500;
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.comparison-login:hover {
		color: var(--color-primary);
	}
</style>
