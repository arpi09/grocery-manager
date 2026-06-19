<script lang="ts">
	import SceneIllustration from '$lib/components/atoms/SceneIllustration.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import type { HomeBriefingForYouCard } from '$lib/domain/home-briefing';
	import type { HomeBriefingMessagePresentation } from '$lib/domain/home-briefing-presenter';
	import { t } from '$lib/i18n';

	interface Props {
		card: HomeBriefingForYouCard;
		title: HomeBriefingMessagePresentation;
		body: HomeBriefingMessagePresentation;
		cta: HomeBriefingMessagePresentation;
		canWrite?: boolean;
		ctaHref?: string | null;
		ctaLoading?: boolean;
		onCta?: () => void | Promise<void>;
	}

	let {
		card,
		title,
		body,
		cta,
		canWrite = false,
		ctaHref = null,
		ctaLoading = false,
		onCta
	}: Props = $props();

	const ctaLabel = $derived(t(cta.key, cta.params));
	const showButton = $derived(card.kind === 'replenishment' && canWrite && onCta);
	const showLink = $derived(Boolean(ctaHref));
</script>

<article class="for-you-card" data-testid="home-v2-for-you" data-for-you-kind={card.kind}>
	<SceneIllustration
		src="/illustrations/v2/for-you.svg"
		ariaLabel={t('home.v6.forYou.illustrationAria')}
		width={280}
		height={72}
	/>
	<h2 class="for-you-title">{t(title.key, title.params)}</h2>
	<p class="for-you-body">{t(body.key, body.params)}</p>

	{#if showButton}
		<Button type="button" fullWidth loading={ctaLoading} onclick={() => void onCta?.()}>
			{ctaLabel}
		</Button>
	{:else if showLink}
		<a class="btn btn-primary btn-full" href={ctaHref} onclick={() => void onCta?.()}>
			{ctaLabel}
		</a>
	{/if}
</article>

<style>
	.for-you-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.for-you-card :global(.scene-illus) {
		justify-content: stretch;
		opacity: 1;
	}

	.for-you-card :global(.scene-illus img) {
		width: 100%;
		max-height: 72px;
		aspect-ratio: auto;
		object-fit: cover;
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.for-you-title {
		margin: 0;
		font-size: 1.0625rem;
		font-weight: 700;
		line-height: 1.25;
	}

	.for-you-body {
		margin: 0 0 var(--space-xs);
		font-size: var(--font-size-body-sm, 0.875rem);
		color: var(--color-text-muted);
		line-height: 1.45;
	}
</style>
