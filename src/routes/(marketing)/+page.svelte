<script lang="ts">
	import {
		ArrowRight,
		Barcode,
		Camera,
		Leaf,
		Refrigerator,
		Shield,
		Sparkles,
		Store
	} from '@lucide/svelte';
	import ComparisonTable from '$lib/components/marketing/ComparisonTable.svelte';
	import LandingHeroVisual from '$lib/components/marketing/LandingHeroVisual.svelte';
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingFeatureCard from '$lib/components/marketing/MarketingFeatureCard.svelte';
	import MarketingProLaunchBanner from '$lib/components/marketing/MarketingProLaunchBanner.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingStepCard from '$lib/components/marketing/MarketingStepCard.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { page } from '$app/state';
	import { writeLandingVariantSession } from '$lib/client/landing-variant-session';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { trackProductEvent } from '$lib/client/product-events';
	import { buildLandingJsonLd } from '$lib/seo/seo';
	import { onMount } from 'svelte';

	let { data } = $props();

	const { marketing: content, loginUrl, registerUrl, hero, canonicalUrl, marketingLocale } = data;
	const isLoggedIn = $derived(Boolean(page.data.user?.id));
	const landing = content.landing;
	const previewFeatures = content.features.items.slice(0, 4);
	const jsonLd = buildLandingJsonLd(canonicalUrl, content.meta.description);

	let heroReady = $state(false);

	onMount(() => {
		writeLandingVariantSession(data.landingVariant);
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			heroReady = true;
			return;
		}
		requestAnimationFrame(() => {
			heroReady = true;
		});
	});

	function trackRegisterClick() {
		void trackProductEvent('register_click', { variant: data.landingVariant });
	}
</script>

<MarketingSeoHead
	title={content.meta.title}
	description={content.meta.description}
	ogTitle={content.meta.ogTitle}
	ogDescription={content.meta.ogDescription}
	{canonicalUrl}
	locale={marketingLocale}
	{jsonLd}
/>

<section class="hero" class:hero-ready={heroReady}>
	<div class="hero-bg" aria-hidden="true"></div>
	<div class="hero-inner">
		<div class="hero-copy">
			<p class="eyebrow label-caps">{content.siteName} {landing.heroDomainSuffix}</p>
			<h1 class="hero-title">{hero.heroTitle}</h1>
			<p class="hero-lead">{hero.heroLead}</p>
			<p class="hero-secondary">{hero.heroSecondary}</p>

			<div class="hero-actions">
				{#if isLoggedIn}
					<MarketingButtonLink href={APP_HOME_PATH}>{content.cta.openApp}</MarketingButtonLink>
				{:else}
					<MarketingButtonLink href={registerUrl} analyticsId="marketing.register_hero" onclick={trackRegisterClick}>
						{content.cta.tryFree}
					</MarketingButtonLink>
					<MarketingButtonLink href={loginUrl} variant="secondary">{content.cta.login}</MarketingButtonLink>
					<a href={registerUrl} class="hero-register" data-analytics-id="marketing.register_link" onclick={trackRegisterClick}>
						{content.cta.register}
						<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
					</a>
				{/if}
			</div>

			<ul class="hero-highlights" aria-label={landing.heroHighlightsAria}>
				<li>
					<Barcode size={18} strokeWidth={2} aria-hidden="true" />
					<span>{landing.heroHighlights.barcode}</span>
				</li>
				<li>
					<Camera size={18} strokeWidth={2} aria-hidden="true" />
					<span>{landing.heroHighlights.receipt}</span>
				</li>
				<li>
					<Refrigerator size={18} strokeWidth={2} aria-hidden="true" />
					<span>{landing.heroHighlights.storage}</span>
				</li>
			</ul>
		</div>

		<div class="hero-visual-wrap">
			<LandingHeroVisual copy={landing.heroVisual} />
		</div>
	</div>
</section>

<MarketingScrollReveal variant="scale" delay={40}>
	<MarketingProLaunchBanner
		proLaunch={content.proLaunch}
		{registerUrl}
		onRegisterClick={trackRegisterClick}
	/>
</MarketingScrollReveal>

<MarketingScrollReveal immediate variant="fade">
<section class="stats-strip" aria-label={landing.statsAria}>
	<ul class="stats-list">
		{#each landing.stats as stat, i (stat.label)}
			<li class="stat" style:--stat-i={i}>
				<span class="stat-value">{stat.value}</span>
				<span class="stat-label">{stat.label}</span>
			</li>
		{/each}
	</ul>
</section>
</MarketingScrollReveal>

<MarketingScrollReveal>
	<section class="section" id="varfor-skaffu">
		<div class="section-inner">
			<header class="section-header center">
				<h2>{landing.differentiatorsTitle}</h2>
				<p>{landing.differentiatorsLead}</p>
			</header>
			<div class="diff-grid">
				{#each landing.differentiators as diff, i (diff.title)}
					<article class="diff-card diff-reveal" style:--card-i={i}>
						<span class="diff-tag label-caps">{diff.tag}</span>
						<h3>{diff.title}</h3>
						<p>{diff.description}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={80} variant="fade">
	<section class="section muted">
		<div class="section-inner">
			<header class="section-header">
				<h2>{landing.featuresTitle}</h2>
				<p>{landing.featuresLead}</p>
			</header>
			<div class="feature-grid">
				{#each previewFeatures as feature, i (feature.title)}
					<div class="feature-reveal" style:--card-i={i}>
						<MarketingFeatureCard {feature} />
					</div>
				{/each}
			</div>
			<p class="section-link">
				<a href="/funktioner">
					{landing.seeAllFeatures}
					<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
				</a>
			</p>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal variant="scale">
	<section class="section waste" id="minska-matsvinn">
		<div class="section-inner waste-inner">
			<div class="waste-copy">
				<span class="waste-icon" aria-hidden="true">
					<Leaf size={28} strokeWidth={1.75} />
				</span>
				<header class="section-header">
					<h2>{landing.wasteReductionTitle}</h2>
					<p>{landing.wasteReductionLead}</p>
				</header>
				<ul class="waste-points">
					{#each landing.wasteReductionPoints as point (point)}
						<li>{point}</li>
					{/each}
				</ul>
			</div>
			<div class="waste-aside" aria-hidden="true">
				<div class="waste-meter">
					<span class="meter-label">{landing.wasteMeterLabel}</span>
					<div class="meter-bar">
						<span class="meter-fill"></span>
					</div>
					<p class="meter-caption">{landing.wasteMeterCaption}</p>
				</div>
			</div>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal>
	<section id="jamforelse" class="section">
		<div class="section-inner">
			<header class="section-header center">
				<span class="section-kicker label-caps">
					<Store size={14} strokeWidth={2} aria-hidden="true" />
					{landing.comparisonKicker}
				</span>
				<h2>{content.comparison.title}</h2>
				<p>{content.comparison.lead}</p>
			</header>
			<ComparisonTable comparison={content.comparison} />
			<p class="comparison-disclaimer">
				<Shield size={14} strokeWidth={2} aria-hidden="true" />
				{content.comparison.disclaimer}
			</p>
			<div class="comparison-cta">
				<MarketingButtonLink href={registerUrl} analyticsId="marketing.register_comparison" onclick={trackRegisterClick}>
					{content.cta.tryFree}
				</MarketingButtonLink>
				<MarketingButtonLink href={loginUrl} variant="secondary">{content.cta.login}</MarketingButtonLink>
			</div>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={60}>
	<section class="section muted">
		<div class="section-inner">
			<header class="section-header center">
				<span class="section-kicker label-caps">
					<Sparkles size={14} strokeWidth={2} aria-hidden="true" />
					{landing.stepsKicker}
				</span>
				<h2>{landing.stepsTitle}</h2>
				<p>{landing.stepsLead}</p>
			</header>
			<div class="steps-grid">
				{#each content.howItWorks.steps as step, i (step.step)}
					<div class="step-reveal" style:--card-i={i}>
						<MarketingStepCard {step} />
					</div>
				{/each}
			</div>
			<p class="section-link center-link">
				<a href="/sa-fungerar-det">
					{landing.readHowItWorks}
					<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
				</a>
			</p>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal delay={60} variant="fade">
<div class="final-cta-wrap">
	<MarketingCta
		title={landing.finalCtaTitle}
		lead={landing.finalCtaLead}
		primaryLabel={content.cta.tryFree}
		primaryHref={registerUrl}
		primaryAnalyticsId="marketing.register_footer"
		secondaryLabel={content.cta.login}
		secondaryHref={loginUrl}
		onRegisterClick={trackRegisterClick}
	/>
</div>
</MarketingScrollReveal>

<style>
	.hero {
		position: relative;
		overflow: hidden;
		padding: var(--space-xl) var(--space-lg) var(--space-lg);
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 90% 60% at 10% 0%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 55%),
			radial-gradient(ellipse 70% 50% at 95% 20%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 50%);
		pointer-events: none;
	}

	.hero-inner {
		position: relative;
		display: grid;
		gap: var(--space-xl);
		max-width: 72rem;
		margin: 0 auto;
		align-items: center;
	}

	@media (min-width: 960px) {
		.hero {
			padding-top: calc(var(--space-xl) * 1.75);
			padding-bottom: var(--space-xl);
		}

		.hero-inner {
			grid-template-columns: 1.05fr 0.95fr;
			gap: var(--space-xl);
		}
	}

	.hero-copy > * {
		opacity: 0;
		transform: translateY(0.75rem);
	}

	.hero-ready .hero-copy > * {
		opacity: 1;
		transform: translateY(0);
	}

	.hero-ready .eyebrow {
		transition:
			opacity 0.5s ease,
			transform 0.5s ease;
	}
	.hero-ready .hero-title {
		transition:
			opacity 0.55s ease 0.05s,
			transform 0.55s ease 0.05s;
	}
	.hero-ready .hero-lead {
		transition:
			opacity 0.55s ease 0.1s,
			transform 0.55s ease 0.1s;
	}
	.hero-ready .hero-secondary {
		transition:
			opacity 0.55s ease 0.14s,
			transform 0.55s ease 0.14s;
	}
	.hero-ready .hero-actions {
		transition:
			opacity 0.55s ease 0.18s,
			transform 0.55s ease 0.18s;
	}
	.hero-ready .hero-highlights {
		transition:
			opacity 0.55s ease 0.22s,
			transform 0.55s ease 0.22s;
	}

	.hero-visual-wrap {
		opacity: 0;
		transform: translateY(1rem) scale(0.98);
	}

	.hero-ready .hero-visual-wrap {
		opacity: 1;
		transform: translateY(0) scale(1);
		transition:
			opacity 0.7s ease 0.12s,
			transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.12s;
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-copy > *,
		.hero-visual-wrap {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}

	.eyebrow {
		margin: 0 0 var(--space-sm);
		color: var(--color-primary);
	}

	.hero-title {
		margin: 0;
		font-size: clamp(2.1rem, 5.5vw, 3rem);
		font-weight: var(--font-weight-display);
		line-height: 1.08;
		letter-spacing: -0.02em;
		max-width: 14ch;
	}

	.hero-lead {
		margin: var(--space-md) 0 0;
		font-size: clamp(1.05rem, 2.2vw, 1.2rem);
		line-height: 1.55;
		color: var(--color-text);
		max-width: 40ch;
	}

	.hero-secondary {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
		max-width: 44ch;
		font-size: var(--font-size-body-sm);
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
		margin-top: var(--space-lg);
	}

	.hero-register {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.hero-register:hover {
		text-decoration: underline;
	}

	.hero-highlights {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-lg);
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
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-surface) 80%, transparent);
		border: 1px solid var(--color-border);
	}

	.stats-strip {
		border-block: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-bg));
	}

	.stats-list {
		display: grid;
		gap: var(--space-md);
		max-width: 72rem;
		margin: 0 auto;
		padding: var(--space-lg);
		list-style: none;
	}

	@media (min-width: 768px) {
		.stats-list {
			grid-template-columns: repeat(3, 1fr);
			padding-inline: var(--space-lg);
		}
	}

	.stat {
		text-align: center;
		padding: var(--space-md);
		opacity: 0;
		animation: stat-in 0.6s ease forwards;
		animation-delay: calc(0.08s * var(--stat-i, 0) + 0.2s);
	}

	.stat-value {
		display: block;
		font-size: clamp(2rem, 4vw, 2.5rem);
		font-weight: var(--font-weight-display);
		line-height: 1;
		color: var(--color-primary);
		letter-spacing: -0.03em;
	}

	.stat-label {
		display: block;
		margin-top: var(--space-sm);
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: 1.45;
		max-width: 22ch;
		margin-inline: auto;
	}

	@keyframes stat-in {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stat {
			opacity: 1;
			animation: none;
		}
	}

	.section {
		padding: calc(var(--space-xl) * 1.25) var(--space-lg);
	}

	.section.muted {
		background: color-mix(in srgb, var(--color-surface-muted) 65%, transparent);
	}

	.section-inner {
		max-width: 72rem;
		margin: 0 auto;
	}

	.section-header h2 {
		margin: 0;
		font-size: clamp(1.5rem, 3.5vw, 2rem);
		font-weight: var(--font-weight-display);
		line-height: 1.15;
		letter-spacing: -0.02em;
	}

	.section-header p {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		max-width: 50ch;
		line-height: 1.55;
	}

	.section-header.center {
		text-align: center;
	}

	.section-header.center p {
		margin-inline: auto;
	}

	.section-kicker {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: var(--space-sm);
		color: var(--color-primary);
	}

	.diff-grid {
		display: grid;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}

	@media (min-width: 640px) {
		.diff-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.diff-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.diff-card {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.diff-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.diff-tag {
		display: inline-block;
		margin-bottom: var(--space-sm);
		color: var(--color-primary);
	}

	.diff-card h3 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.diff-card p {
		margin: var(--space-sm) 0 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.feature-grid,
	.steps-grid {
		display: grid;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}

	@media (min-width: 640px) {
		.feature-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.feature-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.steps-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	:global(.is-visible) .feature-reveal,
	:global(.is-visible) .step-reveal,
	:global(.is-visible) .diff-reveal {
		animation: card-stagger 0.55s ease forwards;
		animation-delay: calc(0.07s * var(--card-i, 0));
	}

	.feature-reveal,
	.step-reveal,
	.diff-reveal {
		opacity: 0;
	}

	@keyframes card-stagger {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.feature-reveal,
		.step-reveal,
		.diff-reveal {
			opacity: 1;
			animation: none;
		}

		.diff-card:hover {
			transform: none;
		}
	}

	.section-link {
		margin: var(--space-xl) 0 0;
	}

	.section-link.center-link {
		text-align: center;
	}

	.section-link a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.section-link a:hover {
		text-decoration: underline;
	}

	.waste-inner {
		display: grid;
		gap: var(--space-xl);
		align-items: center;
	}

	@media (min-width: 900px) {
		.waste-inner {
			grid-template-columns: 1.1fr 0.9fr;
		}
	}

	.waste-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
		color: var(--color-primary);
		margin-bottom: var(--space-md);
	}

	.waste-points {
		margin: var(--space-lg) 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		max-width: 48ch;
	}

	.waste-points li {
		position: relative;
		padding-left: 1.25rem;
		line-height: var(--line-height-body);
	}

	.waste-points li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 999px;
		background: var(--color-primary);
	}

	.waste-aside {
		display: flex;
		justify-content: center;
	}

	.waste-meter {
		width: min(100%, 20rem);
		padding: var(--space-xl);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
	}

	.meter-label {
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		letter-spacing: var(--letter-spacing-label);
		text-transform: uppercase;
		color: var(--color-primary);
	}

	.meter-bar {
		margin-top: var(--space-md);
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
		overflow: hidden;
	}

	.meter-fill {
		display: block;
		height: 100%;
		width: 72%;
		border-radius: inherit;
		background: linear-gradient(
			90deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-accent) 70%, var(--color-primary))
		);
	}

	@media (prefers-reduced-motion: no-preference) {
		.meter-fill {
			animation: meter-grow 1.2s ease 0.3s both;
		}
	}

	@keyframes meter-grow {
		from {
			width: 0;
		}
		to {
			width: 72%;
		}
	}

	.meter-caption {
		margin: var(--space-md) 0 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.comparison-disclaimer {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		margin: var(--space-lg) 0 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		max-width: 58ch;
		line-height: var(--line-height-body);
	}

	.comparison-cta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}

	.final-cta-wrap {
		padding-bottom: var(--space-xl);
		background: linear-gradient(
			180deg,
			transparent,
			color-mix(in srgb, var(--color-primary) 6%, var(--color-bg))
		);
	}

	.final-cta-wrap :global(.cta-section) {
		padding-top: 0;
	}

	.final-cta-wrap :global(.inner) {
		background: linear-gradient(
			145deg,
			var(--color-surface),
			color-mix(in srgb, var(--color-surface-muted) 40%, var(--color-surface))
		);
		border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
	}
</style>
