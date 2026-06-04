<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import NewsPathIllustration from '$lib/components/organisms/NewsPathIllustration.svelte';
	import type { AppNewsItem } from '$lib/data/app-news';

	interface Props {
		item: AppNewsItem;
		title: string;
		body: string;
		dateLabel: string;
		index: number;
	}

	let { item, title, body, dateLabel, index }: Props = $props();

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
	style:--milestone-delay="{Math.min(index * 90, 360)}ms"
	aria-labelledby="news-{item.id}-title"
>
	<div class="path-node" aria-hidden="true">
		<span class="path-dot"></span>
	</div>

	<div class="card">
		<div class="card-media">
			<NewsPathIllustration id={item.illustration} active={visible} />
		</div>
		<div class="card-body">
			<time class="date" datetime={item.date}>{dateLabel}</time>
			<h2 class="title" id="news-{item.id}-title">{title}</h2>
			<p class="copy">{body}</p>
		</div>
	</div>
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
		transform: translateY(1.25rem);
	}

	.milestone.animate.is-visible {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
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

	.card-body {
		min-width: 0;
	}

	.date {
		display: block;
		margin: 0 0 var(--space-xs);
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
		font-variant-numeric: tabular-nums;
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

	@media (prefers-reduced-motion: reduce) {
		.milestone {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
