<script lang="ts">
	import { ArrowRight, BookOpen, ListChecks, Sparkles, Users } from '@lucide/svelte';
	import LandingHeroVisual from '$lib/components/marketing/LandingHeroVisual.svelte';
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import MarketingCta from '$lib/components/marketing/MarketingCta.svelte';
	import MarketingDashboardCard from '$lib/components/marketing/MarketingDashboardCard.svelte';
	import MarketingScrollReveal from '$lib/components/marketing/MarketingScrollReveal.svelte';
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { page } from '$app/state';
	import { writeLandingVariantSession } from '$lib/client/landing-variant-session';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { trackProductEvent } from '$lib/client/product-events';
	import { buildLandingJsonLd } from '$lib/seo/seo';
	import { onMount } from 'svelte';

	let { data } = $props();

	const content = $derived(data.marketing);
	const loginUrl = $derived(data.loginUrl);
	const registerUrl = $derived(data.registerUrl);
	const hero = $derived(data.hero);
	const canonicalUrl = $derived(data.canonicalUrl);
	const marketingLocale = $derived(data.marketingLocale);
	const latestGuides = $derived(data.latestGuides);
	const isLoggedIn = $derived(Boolean(page.data.user?.id));
	const landing = $derived(content.landing);
	const jsonLd = $derived(buildLandingJsonLd(canonicalUrl, content.meta.description));

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
			<p class="eyebrow label-caps">{landing.heroEyebrow}</p>
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
					<MarketingButtonLink href="/sa-fungerar-det" variant="secondary">
						{landing.readHowItWorks}
					</MarketingButtonLink>
				{/if}
			</div>

			<ul class="hero-highlights" aria-label={landing.heroHighlightsAria}>
				<li>
					<ListChecks size={18} strokeWidth={2} aria-hidden="true" />
					<span>{landing.heroHighlights.list}</span>
				</li>
				<li>
					<Users size={18} strokeWidth={2} aria-hidden="true" />
					<span>{landing.heroHighlights.partner}</span>
				</li>
				<li>
					<Sparkles size={18} strokeWidth={2} aria-hidden="true" />
					<span>{landing.heroHighlights.eatFirst}</span>
				</li>
			</ul>
		</div>

		<div class="hero-visual-wrap">
			<LandingHeroVisual copy={landing.heroVisual} />
		</div>
	</div>
</section>

<MarketingScrollReveal immediate variant="fade">
	<section class="scan-cta-section">
		<div class="scan-cta-inner">
			<MarketingButtonLink
				href={registerUrl}
				fullWidth
				analyticsId="marketing.register_scan_cta"
				onclick={trackRegisterClick}
			>
				{landing.scanCtaLabel}
			</MarketingButtonLink>
		</div>
	</section>
</MarketingScrollReveal>

<MarketingScrollReveal>
	<section class="section" id="produkt">
		<div class="section-inner">
			<header class="section-header center">
				<h2>{landing.dashboardCardsTitle}</h2>
				<p>{landing.dashboardCardsLead}</p>
			</header>
			<div class="dashboard-grid">
				{#each landing.dashboardCards as card, i (card.href)}
					<div class="dashboard-reveal" style:--card-i={i}>
						<MarketingDashboardCard card={card} seeMoreLabel={landing.dashboardCardsSeeMore} />
					</div>
				{/each}
			</div>
		</div>
	</section>
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

{#if latestGuides.length > 0}
	<MarketingScrollReveal delay={40}>
		<section class="section muted" id="senaste-guider">
			<div class="section-inner">
				<header class="section-header">
					<span class="section-kicker label-caps">
						<BookOpen size={14} strokeWidth={2} aria-hidden="true" />
						{landing.guidesTeaserTitle}
					</span>
					<h2>{landing.guidesTeaserTitle}</h2>
					<p>{landing.guidesTeaserLead}</p>
				</header>
				<div class="guide-teaser-grid">
					{#each latestGuides as guide (guide.slug)}
						<article class="guide-teaser-card">
							<h3>
								<a href="/guider/{guide.slug}">{guide.title}</a>
							</h3>
							<p>{guide.description}</p>
							<a class="guide-teaser-link" href="/guider/{guide.slug}">
								{landing.guidesTeaserReadMore}
								<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
							</a>
						</article>
					{/each}
				</div>
				<p class="section-link">
					<a href="/guider">
						{landing.guidesTeaserSeeAll}
						<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
					</a>
				</p>
			</div>
		</section>
	</MarketingScrollReveal>
{/if}

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

	.hero-copy > *,
	.hero-visual-wrap {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.hero:not(.hero-ready) .hero-copy > * {
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

		.hero:not(.hero-ready) .hero-visual-wrap {
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

	.scan-cta-section {
		padding: 0 var(--space-lg) var(--space-lg);
	}

	.scan-cta-inner {
		max-width: 72rem;
		margin: 0 auto;
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

	.dashboard-grid {
		display: grid;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}

	@media (min-width: 768px) {
		.dashboard-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.dashboard-reveal {
		opacity: 1;
	}

	@media (prefers-reduced-motion: no-preference) {
		:global(.reveal.animate:not(.is-visible)) .dashboard-reveal {
			opacity: 0;
		}

		:global(.is-visible) .dashboard-reveal {
			animation: card-stagger 0.55s ease forwards;
			animation-delay: calc(0.07s * var(--card-i, 0));
		}
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

		.dashboard-reveal {
			opacity: 1;
			animation: none;
		}
	}

	.section-link {
		margin: var(--space-xl) 0 0;
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

	.guide-teaser-grid {
		display: grid;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}

	@media (min-width: 768px) {
		.guide-teaser-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.guide-teaser-card {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.guide-teaser-card h3 {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.3;
	}

	.guide-teaser-card h3 a {
		color: inherit;
		text-decoration: none;
	}

	.guide-teaser-card h3 a:hover {
		color: var(--color-primary);
	}

	.guide-teaser-card p {
		margin: var(--space-sm) 0 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.guide-teaser-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: var(--space-md);
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.guide-teaser-link:hover {
		text-decoration: underline;
	}
</style>
