<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import NewsPathIllustration from '$lib/components/molecules/NewsPathIllustration.svelte';
	import type { AppNewsItem, NewsIllustrationId } from '$lib/data/app-news';
	import { t } from '$lib/i18n';

	const ILLUSTRATION_STAGGER_MS: Record<NewsIllustrationId, number> = {
		brain: 0,
		launch: 100,
		scan: 70,
		onboarding: 70,
		recipe: 85,
		push: 55,
		'inventory-table': 40
	};

	interface Props {
		item: AppNewsItem;
		title: string;
		body: string;
		dateLabel: string;
		versionLabel?: string | null;
		hasDetail?: boolean;
		onReadMore?: () => void;
	}

	let {
		item,
		title,
		body,
		dateLabel,
		versionLabel = null,
		hasDetail = false,
		onReadMore
	}: Props = $props();

	const revealDelay = $derived(ILLUSTRATION_STAGGER_MS[item.illustration]);

	let root: HTMLElement | undefined = $state();
	let visible = $state(true);
	let animate = $state(false);

	onMount(() => {
		if (!browser || !root) {
			return;
		}
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			visible = true;
			animate = true;
			return;
		}

		visible = false;
		animate = true;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					visible = true;
					observer.disconnect();
				}
			},
			{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
		);
		observer.observe(root);
		return () => observer.disconnect();
	});
</script>

<article
	bind:this={root}
	class="milestone"
	class:animate
	class:is-visible={visible}
	style:--milestone-delay="{revealDelay}ms"
	aria-labelledby="news-{item.id}-title"
>
	<div class="path-node" aria-hidden="true">
		<span class="path-dot"></span>
	</div>

	<button
		type="button"
		class="card"
		class:interactive={hasDetail}
		disabled={!hasDetail}
		aria-label={hasDetail ? t('news.openDetail', { title }) : undefined}
		onclick={() => onReadMore?.()}
	>
		<div class="card-media">
			<NewsPathIllustration id={item.illustration} active={visible} />
		</div>
		<div class="card-body">
			<div class="meta">
				<time class="date" datetime={item.date}>{dateLabel}</time>
				{#if versionLabel}
					<span class="version">{versionLabel}</span>
				{/if}
			</div>
			<h2 class="title" id="news-{item.id}-title">{title}</h2>
			<p class="copy">{body}</p>
			{#if hasDetail}
				<span class="read-more">{t('news.readMore')}</span>
			{/if}
		</div>
	</button>
</article>

<style>
	.milestone {
		position: relative;
		display: grid;
		grid-template-columns: 2.5rem minmax(0, 1fr);
		gap: var(--space-md);
		padding-bottom: var(--space-xl);
		opacity: 1;
		transform: none;
	}

	.milestone.animate:not(.is-visible) {
		opacity: 0;
		transform: translateY(0.5rem) scale(0.98);
	}

	.milestone.animate.is-visible {
		opacity: 1;
		transform: translateY(0) scale(1);
		transition:
			opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: var(--milestone-delay, 0ms);
	}

	.path-node {
		display: flex;
		justify-content: center;
		padding-top: var(--space-lg);
	}

	.path-dot {
		width: 0.85rem;
		height: 0.85rem;
		border-radius: 999px;
		background: var(--color-primary);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		flex-shrink: 0;
	}

	.card {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		width: 100%;
		text-align: left;
		font: inherit;
		color: inherit;
		cursor: default;
	}

	.card.interactive {
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	.card.interactive:hover {
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.card:disabled {
		opacity: 1;
	}

	@media (min-width: 640px) {
		.card {
			grid-template-columns: minmax(9rem, 11rem) minmax(0, 1fr);
			align-items: center;
			padding: var(--space-lg);
		}
	}

	.card-media {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-media :global(.illus-wrap) {
		padding: var(--space-xs) 0;
	}

	.card-media :global(.illus) {
		width: min(140px, 44vw);
	}

	@media (min-width: 640px) {
		.card-media :global(.illus) {
			width: min(160px, 100%);
		}
	}

	.card-body {
		min-width: 0;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: var(--space-xs);
	}

	.date {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
		font-variant-numeric: tabular-nums;
	}

	.version {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
	}

	.title {
		margin: 0 0 var(--space-sm);
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.3;
		color: var(--color-text);
	}

	.copy {
		margin: 0;
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
		color: var(--color-text-muted);
	}

	.read-more {
		display: inline-block;
		margin-top: var(--space-sm);
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	@media (prefers-reduced-motion: reduce) {
		.milestone {
			opacity: 1;
			transform: none;
			transition: none;
		}

		.card.interactive:hover {
			transform: none;
		}
	}
</style>
