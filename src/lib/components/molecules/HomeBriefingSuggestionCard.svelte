<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import HomeBriefingMomentScene from '$lib/components/molecules/HomeBriefingMomentScene.svelte';
	import type { HomeBriefingMessagePresentation } from '$lib/domain/home-briefing-presenter';
	import { t } from '$lib/i18n';

	interface Props {
		kind: string;
		variant?: 'forYou' | 'moment';
		title: HomeBriefingMessagePresentation;
		body: HomeBriefingMessagePresentation;
		cta: HomeBriefingMessagePresentation;
		canWrite?: boolean;
		ctaHref?: string | null;
		ctaLoading?: boolean;
		showActionButton?: boolean;
		onCta?: () => void | Promise<void>;
	}

	let {
		kind,
		variant = 'forYou',
		title,
		body,
		cta,
		canWrite = false,
		ctaHref = null,
		ctaLoading = false,
		showActionButton = false,
		onCta
	}: Props = $props();

	const ctaLabel = $derived(t(cta.key, cta.params));
	const testId = $derived(variant === 'moment' ? 'home-v2-moment' : 'home-v2-for-you');
	const showButton = $derived(canWrite && showActionButton && onCta);
	const showLink = $derived(Boolean(ctaHref) && !showButton);
</script>

<article
	class="suggestion-card"
	data-testid={testId}
	data-for-you-kind={variant === 'forYou' ? kind : undefined}
	data-moment-kind={variant === 'moment' ? kind : undefined}
>
	{#if variant === 'forYou'}
		<div class="suggestion-accent" aria-hidden="true">
			<span class="accent-bar"></span>
			<span class="accent-shape shape-a"></span>
			<span class="accent-shape shape-b"></span>
		</div>
	{:else}
		<HomeBriefingMomentScene />
	{/if}

	<h2 class="suggestion-title">{t(title.key, title.params)}</h2>
	<p class="suggestion-body">{t(body.key, body.params)}</p>

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
	.suggestion-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.suggestion-accent {
		position: relative;
		height: 40px;
		margin: calc(-1 * var(--space-sm)) calc(-1 * var(--space-md)) 0;
		overflow: hidden;
		background: color-mix(in srgb, var(--color-accent, #8a9a7b) 8%, var(--color-surface));
	}

	.accent-bar {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-accent, #8a9a7b) 0%, transparent) 0%,
			color-mix(in srgb, var(--color-accent, #8a9a7b) 35%, transparent) 35%,
			color-mix(in srgb, var(--color-taupe, #c4b8a8) 30%, transparent) 65%,
			color-mix(in srgb, var(--color-accent, #8a9a7b) 0%, transparent) 100%
		);
		background-size: 200% 100%;
		animation: accent-shift 8s ease-in-out infinite;
	}

	.accent-shape {
		position: absolute;
		border-radius: 50%;
		opacity: 0.35;
		animation: accent-pulse 6s ease-in-out infinite;
	}

	.shape-a {
		top: 8px;
		right: 24%;
		width: 28px;
		height: 28px;
		background: color-mix(in srgb, var(--color-accent, #8a9a7b) 40%, transparent);
		animation-delay: -2s;
	}

	.shape-b {
		bottom: 4px;
		left: 18%;
		width: 18px;
		height: 18px;
		background: color-mix(in srgb, var(--color-taupe, #c4b8a8) 50%, transparent);
		animation-delay: -4s;
	}

	@keyframes accent-shift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	@keyframes accent-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.25;
		}
		50% {
			transform: scale(1.15);
			opacity: 0.45;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.accent-bar,
		.accent-shape {
			animation: none;
		}
	}

	.suggestion-title {
		margin: 0;
		font-size: 1.0625rem;
		font-weight: 700;
		line-height: 1.25;
	}

	.suggestion-body {
		margin: 0 0 var(--space-xs);
		font-size: var(--font-size-body-sm, 0.875rem);
		color: var(--color-text-muted);
		line-height: 1.45;
	}
</style>
