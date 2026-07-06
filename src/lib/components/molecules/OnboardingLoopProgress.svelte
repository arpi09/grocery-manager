<script lang="ts">
	/**
	 * Persistent "loop mark" that ties the whole activation flow to Skaffu's
	 * core-loop metaphor (list → shop → pantry → next week's list).
	 *
	 * Unlike the per-screen illustrations, this element persists across
	 * welcome → fill → invite → finish. A single dot travels along a closed
	 * loop; its position is spring-driven from the step progress, so advancing a
	 * step nudges the loop forward instead of each screen animating in isolation.
	 * On the final step the loop "closes" — the dot lands back at the start node
	 * and the path completes once. That completion is the payoff moment.
	 *
	 * Reduced-motion: the dot is placed at its resting position instantly (no
	 * travel), the loop path is drawn fully (no dash march), and the closing
	 * flourish is a static "complete" state — no animation.
	 */
	import { Spring, prefersReducedMotion } from 'svelte/motion';

	interface Props {
		/** Current step index (0-based) */
		stepIndex: number;
		/** Total number of steps */
		stepCount: number;
		/** True on the final step — triggers the loop-closing payoff */
		complete?: boolean;
	}

	let { stepIndex, stepCount, complete = false }: Props = $props();

	/* Closed rounded-rect loop path. Total geometric length ≈ 300 (used only for
	   the offset-path animation; exact value not critical). */
	const LOOP_PATH =
		'M20 8 H100 Q112 8 112 20 Q112 32 100 32 H20 Q8 32 8 20 Q8 8 20 8 Z';

	/* Fraction of the loop the dot should sit at for a given step. The last step
	   completes the loop (1 === back to start), which is the "closing" moment. */
	const progressTarget = $derived(
		stepCount <= 1 ? 0 : stepIndex / (stepCount - 1)
	);

	/* Spring the dot position around the loop. Gentle, no overshoot past 1 so the
	   dot settles cleanly onto the start node when the loop closes. */
	const dot = new Spring(progressTarget, { stiffness: 0.12, damping: 0.85 });

	$effect(() => {
		if (prefersReducedMotion.current) {
			dot.set(progressTarget, { instant: true });
		} else {
			dot.target = progressTarget;
		}
	});

	/* offset-distance as a percentage string for the traveling dot. */
	const offset = $derived(`${(dot.current * 100).toFixed(2)}%`);
</script>

<div class="loop-mark" class:complete aria-hidden="true">
	<svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
		<!-- faint full loop -->
		<path class="loop-track" d={LOOP_PATH} stroke-width="2" />
		<!-- solid progress that grows as the loop closes -->
		<path
			class="loop-progress"
			d={LOOP_PATH}
			stroke-width="2"
			pathLength="1"
			style:stroke-dashoffset={1 - dot.current}
		/>

		<!-- loop nodes: list · cart · shelf -->
		<circle class="node node-list" cx="8" cy="20" r="3" />
		<circle class="node node-cart" cx="112" cy="20" r="3" />
		<circle class="node node-shelf" cx="60" cy="32" r="3" />

		<!-- traveling dot -->
		<circle class="travel-dot" r="3.4" style:offset-distance={offset} />
	</svg>
</div>

<style>
	.loop-mark {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.loop-mark svg {
		width: 4.5rem;
		height: 1.5rem;
		overflow: visible;
		color: var(--color-primary);
	}

	.loop-track {
		stroke: color-mix(in srgb, var(--color-primary) 22%, transparent);
	}

	.loop-progress {
		stroke: var(--color-primary);
		stroke-linecap: round;
		stroke-dasharray: 1;
		transition: stroke 200ms ease-out;
	}

	.node {
		fill: color-mix(in srgb, var(--color-primary) 30%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 1.5;
	}

	.travel-dot {
		fill: var(--color-primary);
		offset-path: path('M20 8 H100 Q112 8 112 20 Q112 32 100 32 H20 Q8 32 8 20 Q8 8 20 8 Z');
		offset-distance: 0%;
		offset-rotate: 0deg;
	}

	/* Payoff: on complete, the loop gets a single calm glow pulse and nodes
	   settle to solid. Subtle — one ring, no confetti. */
	.loop-mark.complete .loop-progress {
		stroke: var(--color-success);
		filter: drop-shadow(0 0 3px color-mix(in srgb, var(--color-success) 55%, transparent));
		animation: loop-close-glow 900ms var(--motion-ease-out) both;
	}

	.loop-mark.complete .node {
		fill: color-mix(in srgb, var(--color-success) 28%, var(--color-surface));
		stroke: var(--color-success);
	}

	.loop-mark.complete .travel-dot {
		fill: var(--color-success);
	}

	@keyframes loop-close-glow {
		0% {
			opacity: 0.55;
		}
		45% {
			opacity: 1;
		}
		100% {
			opacity: 1;
		}
	}

	@supports not (offset-path: path('M0 0')) {
		/* Fallback for engines without offset-path: hide the traveling dot; the
		   growing loop-progress path already conveys advancement. */
		.travel-dot {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loop-mark.complete .loop-progress {
			animation: none;
			filter: none;
		}
	}
</style>
