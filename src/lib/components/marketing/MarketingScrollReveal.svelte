<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	type RevealVariant = 'up' | 'fade' | 'scale';

	interface Props {
		children: Snippet;
		class?: string;
		/** Stagger delay in ms for child grids */
		delay?: number;
		/** Hero and above-the-fold blocks should not wait for scroll */
		immediate?: boolean;
		/** Motion style — all respect prefers-reduced-motion */
		variant?: RevealVariant;
	}

	let {
		children,
		class: className = '',
		delay = 0,
		immediate = false,
		variant = 'up'
	}: Props = $props();

	let root: HTMLElement | undefined = $state();
	/** SSR and no-JS: show content. With JS, below-fold blocks fade in on scroll. */
	let visible = $state(true);
	let animate = $state(immediate);

	const observerOptions: IntersectionObserverInit = {
		threshold: 0.08,
		rootMargin: '0px 0px -6% 0px'
	};

	function isInRevealViewport(element: HTMLElement): boolean {
		const rect = element.getBoundingClientRect();
		const viewportBottom = window.innerHeight * 0.94;
		return rect.top < viewportBottom && rect.bottom > 0;
	}

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
			visible = true;
			animate = false;
			return;
		}

		animate = true;

		if (isInRevealViewport(root)) {
			visible = true;
			return;
		}

		visible = false;

		const observer = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				visible = true;
				observer.disconnect();
			}
		}, observerOptions);
		observer.observe(root);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={root}
	class="reveal reveal-{variant} {className}"
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
	}

	.reveal-up.animate:not(.is-visible) {
		transform: translateY(1.25rem);
	}

	.reveal-fade.animate:not(.is-visible) {
		transform: none;
	}

	.reveal-scale.animate:not(.is-visible) {
		transform: translateY(0.85rem) scale(0.98);
	}

	.reveal.animate.is-visible {
		opacity: 1;
		transform: translateY(0) scale(1);
		transition:
			opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
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
