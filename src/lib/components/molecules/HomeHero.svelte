<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import HomeHeroIllustration from '$lib/components/organisms/illustrations/HomeHeroIllustration.svelte';
	import { deriveHeroStatus, getHomeHeroTimeBand } from '$lib/domain/home-hero';
	import type { HomeState } from '$lib/domain/home-state';
	import { t } from '$lib/i18n';

	interface Props {
		homeState: HomeState;
		scanHref?: string;
		scrollTargetId?: string;
	}

	let { homeState, scanHref = '/scan', scrollTargetId = 'home-for-you' }: Props = $props();

	const band = $derived(getHomeHeroTimeBand());
	const heroStatus = $derived(deriveHeroStatus(homeState));

	const title = $derived(t(`home.v5.hero.${band}.title` as 'home.v5.hero.morning.title'));
	const body = $derived(
		heroStatus === 'healthy'
			? t('home.v5.hero.defaultBody')
			: t(`home.v5.hero.status.${heroStatus}` as 'home.v5.hero.status.healthy')
	);

	function scrollToTarget() {
		document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		void import('$lib/client/product-events').then(({ trackProductEvent }) =>
			trackProductEvent('primary_action_clicked', { entryPoint: 'hero' })
		);
	}
</script>

<section class="home-hero" aria-labelledby="home-hero-title" data-testid="home-hero">
	<div class="hero-illus" aria-hidden="true">
		<HomeHeroIllustration />
	</div>
	<div class="hero-copy">
		<h1 id="home-hero-title">{title}</h1>
		<p class="hero-body">{body}</p>
		<div class="hero-actions">
			<Button type="button" onclick={scrollToTarget}>{t('home.v5.hero.cta')}</Button>
			<a class="scan-link" href={scanHref}>{t('home.v5.hero.scanLink')}</a>
		</div>
	</div>
</section>

<style>
	.home-hero {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		align-items: center;
		padding: var(--space-md);
		border-radius: var(--radius-lg);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
	}

	.hero-illus {
		flex-shrink: 0;
	}

	.hero-copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
		width: 100%;
	}

	h1 {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.25;
	}

	.hero-body {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
		line-height: 1.45;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
	}

	.scan-link {
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	@media (min-width: 720px) {
		.home-hero {
			flex-direction: row;
			align-items: center;
		}

		.hero-illus {
			order: -1;
		}
	}
</style>
