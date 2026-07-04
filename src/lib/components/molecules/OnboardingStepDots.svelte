<script lang="ts">
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
					{#if index === currentIndex}
						<span class="dot-fill"></span>
					{/if}
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

	.dot-button.done .dot-segment {
		background: var(--color-primary);
	}

	.dot-fill {
		position: absolute;
		inset: 0;
		border-radius: 999px;
		background: var(--color-primary);
		transform-origin: left;
		animation: segment-fill-in var(--motion-duration-slow) var(--motion-ease-out) both;
	}

	@keyframes segment-fill-in {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot-fill {
			animation: none;
			transform: scaleX(1);
		}
	}
</style>
