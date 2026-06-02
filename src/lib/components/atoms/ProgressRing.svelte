<script lang="ts">
	interface Props {
		/** 0–1 fill ratio */
		ratio: number;
		size?: number;
		strokeWidth?: number;
		/** Center label (e.g. week count) */
		label?: string;
		sublabel?: string;
		/** Highlights streak milestone ring */
		active?: boolean;
		ariaLabel?: string;
	}

	let {
		ratio,
		size = 56,
		strokeWidth = 5,
		label,
		sublabel,
		active = false,
		ariaLabel
	}: Props = $props();

	const clamped = $derived(Math.min(1, Math.max(0, ratio)));
	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const dashOffset = $derived(circumference * (1 - clamped));
</script>

<div
	class="progress-ring"
	class:active
	style="--ring-size: {size}px; --ring-stroke: {strokeWidth}px;"
	role={ariaLabel ? 'img' : undefined}
	aria-label={ariaLabel}
>
	<svg
		class="ring-svg"
		width={size}
		height={size}
		viewBox="0 0 {size} {size}"
		aria-hidden={ariaLabel ? 'true' : undefined}
	>
		<circle
			class="ring-track"
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
		/>
		<circle
			class="ring-fill"
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke-dasharray={circumference}
			stroke-dashoffset={dashOffset}
		/>
	</svg>
	{#if label}
		<div class="ring-center">
			<span class="ring-label">{label}</span>
			{#if sublabel}
				<span class="ring-sublabel">{sublabel}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.progress-ring {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--ring-size);
		height: var(--ring-size);
		flex-shrink: 0;
	}

	.ring-svg {
		display: block;
		transform: rotate(-90deg);
	}

	.ring-track,
	.ring-fill {
		stroke-width: var(--ring-stroke);
		stroke-linecap: round;
	}

	.ring-track {
		stroke: color-mix(in srgb, var(--color-border) 80%, transparent);
	}

	.ring-fill {
		stroke: color-mix(in srgb, var(--color-primary) 85%, var(--color-accent));
		transition: stroke-dashoffset 0.55s cubic-bezier(0.33, 1, 0.68, 1);
	}

	.progress-ring.active .ring-fill {
		stroke: var(--color-primary);
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-primary) 35%, transparent));
	}

	.progress-ring.active {
		animation: streak-ring-pulse 2.4s ease-in-out infinite;
	}

	.ring-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.05rem;
		pointer-events: none;
		text-align: center;
	}

	.ring-label {
		font-size: 1.1rem;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--color-text);
	}

	.ring-sublabel {
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	@keyframes streak-ring-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.03);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ring-fill {
			transition: none;
		}

		.progress-ring.active {
			animation: none;
		}
	}
</style>
