<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		/** Stagger delay in ms for child grids */
		delay?: number;
		/** Hero and above-the-fold blocks should not wait for scroll */
		immediate?: boolean;
	}

	let { children, class: className = '', delay = 0, immediate = false }: Props = $props();

	let root: HTMLElement | undefined = $state();
	/** SSR and no-JS: show content. With JS, below-fold blocks fade in on scroll. */
	let visible = $state(true);
	let animate = $state(immediate);

	onMount(() => {
		if (immediate) {
			visible = true;
			animate = true;
			return;
		}
		if (!browser || !root) {
			return;
		}
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
			{ threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
		);
		observer.observe(root);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={root}
	class="reveal {className}"
	class:animate
	class:is-visible={visible}
	style:--reveal-delay="{delay}ms"
>
	{@render children()}
</div>

<style>
	.reveal {
		opacity: 1;
		transform: none;
	}

	.reveal.animate:not(.is-visible) {
		opacity: 0;
		transform: translateY(1.25rem);
	}

	.reveal.animate.is-visible {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: var(--reveal-delay, 0ms);
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
