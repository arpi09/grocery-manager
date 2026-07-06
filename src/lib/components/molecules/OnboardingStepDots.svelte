<script lang="ts">
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	import { t } from '$lib/i18n';

	interface Props {
		keys: readonly string[];
		currentIndex: number;
		/** Pre-formatted "Steg X av Y" for screen readers */
		srLabel: string;
		canSelect?: (index: number) => boolean;
		onSelect?: (index: number) => void;
	}

	let {
		keys,
		currentIndex,
		srLabel,
		canSelect = (index) => index < currentIndex,
		onSelect
	}: Props = $props();

	/* Spring-driven "fill frontier": a continuous position that glides across the
	   dot row as the step advances. A touch of overshoot makes progress feel
	   physical/satisfying without being bouncy. Reduced-motion snaps instantly. */
	const frontier = new Spring(currentIndex, { stiffness: 0.16, damping: 0.72 });

	$effect(() => {
		if (prefersReducedMotion.current) {
			frontier.set(currentIndex, { instant: true });
		} else {
			frontier.target = currentIndex;
		}
	});

	/**
	 * Fill amount for a given segment (0..1) derived from the spring frontier.
	 * Segments fully behind the frontier are solid; the segment the frontier is
	 * crossing fills partially; segments ahead stay empty. This makes the whole
	 * row read as one advancing progress bar rather than independent dots.
	 */
	function fillFor(index: number, position: number): number {
		const amount = position - index + 1;
		return Math.max(0, Math.min(1, amount));
	}
</script>

<div class="step-dots">
	<!-- progressbar on its own node: its children are presentational (so the name must be
	     an aria-label, not text content), and buttons live in a sibling row -->
	<div
		class="sr-progress"
		role="progressbar"
		aria-valuemin={1}
		aria-valuemax={keys.length}
		aria-valuenow={currentIndex + 1}
		aria-label={srLabel}
	></div>

	<div class="step-dots-row">
		{#each keys as key, index (key)}
			{@const fill = fillFor(index, frontier.current)}
			<button
				type="button"
				class="dot-button"
				class:done={index < currentIndex}
				class:active={index === currentIndex}
				disabled={!canSelect(index) && index !== currentIndex}
				aria-current={index === currentIndex ? 'step' : undefined}
				aria-label={t('onboarding.stepOf', { current: index + 1, total: keys.length })}
				data-testid={`activation-progress-${key}`}
				onclick={() => onSelect?.(index)}
			>
				<span class="dot-segment" aria-hidden="true">
					<span class="dot-fill" style:transform={`scaleX(${fill})`}></span>
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.step-dots-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		width: 100%;
	}

	.dot-button {
		flex: 1;
		max-width: 2.25rem;
		min-height: 2.75rem;
		display: flex;
		align-items: center;
		padding: 0;
		border: none;
		background: none;
		cursor: default;
	}

	.dot-button:not(:disabled) {
		cursor: pointer;
	}

	.dot-button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: 999px;
	}

	.dot-segment {
		position: relative;
		display: block;
		width: 100%;
		height: 0.25rem;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
	}

	.dot-fill {
		position: absolute;
		inset: 0;
		border-radius: 999px;
		background: var(--color-primary);
		transform-origin: left;
		/* transform is driven inline by the spring; no CSS transition so the
		   spring is the single source of motion truth (avoids double easing). */
		will-change: transform;
	}

	@media (prefers-reduced-motion: reduce) {
		.dot-fill {
			will-change: auto;
		}
	}
</style>
