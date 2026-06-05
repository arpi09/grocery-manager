<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let ready = $state(false);

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			ready = true;
			return;
		}
		requestAnimationFrame(() => {
			ready = true;
		});
	});
</script>

<section class="page-hero" class:page-hero-ready={ready}>
	<div class="inner">
		{@render children()}
	</div>
</section>

<style>
	.page-hero {
		padding: var(--space-xl) var(--space-lg) var(--space-md);
	}

	.inner {
		max-width: 42rem;
		margin: 0 auto;
	}

	.inner > :global(*) {
		opacity: 0;
		transform: translateY(0.65rem);
	}

	.page-hero-ready .inner > :global(*) {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.5s ease,
			transform 0.5s ease;
	}

	.page-hero-ready .inner > :global(*:nth-child(2)) {
		transition-delay: 0.06s;
	}

	.page-hero-ready .inner > :global(*:nth-child(3)) {
		transition-delay: 0.12s;
	}

	@media (prefers-reduced-motion: reduce) {
		.inner > :global(*) {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}

	.inner :global(h1) {
		margin: 0;
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
	}

	.inner :global(p) {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}
</style>
