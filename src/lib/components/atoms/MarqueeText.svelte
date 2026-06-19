<script lang="ts">
	interface Props {
		text: string;
		class?: string;
	}

	let { text, class: className = '' }: Props = $props();

	let viewportEl = $state<HTMLSpanElement | undefined>();
	let overflows = $state(false);
	let reducedMotion = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			reducedMotion = mq.matches;
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	$effect(() => {
		const el = viewportEl;
		const currentText = text;
		if (!el || !currentText) return;

		const measure = () => {
			const content = el.querySelector<HTMLElement>('.marquee-content');
			if (!content) return;
			const amount = Math.max(0, content.scrollWidth - el.clientWidth);
			overflows = amount > 1;
			el.style.setProperty('--scroll-amount', `${amount}px`);
			el.style.setProperty('--marquee-duration', `${Math.max(6, amount * 0.04)}s`);
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		const content = el.querySelector<HTMLElement>('.marquee-content');
		if (content) observer.observe(content);
		return () => observer.disconnect();
	});

	const shouldAnimate = $derived(overflows && !reducedMotion);
</script>

<span
	bind:this={viewportEl}
	class="marquee-viewport {className}"
	class:overflows
	class:reduced-motion={reducedMotion}
	title={overflows && reducedMotion ? text : undefined}
>
	<span class="marquee-track" class:animate={shouldAnimate}>
		<span class="marquee-content">{text}</span>
	</span>
</span>

<style>
	.marquee-viewport {
		display: block;
		overflow: hidden;
		min-width: 0;
		max-width: 100%;
	}

	.marquee-track {
		display: inline-block;
		white-space: nowrap;
	}

	.marquee-content {
		display: inline-block;
	}

	.marquee-viewport.overflows:not(.reduced-motion) .marquee-track.animate {
		animation: chip-marquee var(--marquee-duration, 8s) ease-in-out infinite;
	}

	.marquee-viewport.overflows.reduced-motion .marquee-content {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@keyframes chip-marquee {
		0%,
		18% {
			transform: translateX(0);
		}
		82%,
		100% {
			transform: translateX(calc(-1 * var(--scroll-amount, 0px)));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee-track.animate {
			animation: none;
		}
	}
</style>
