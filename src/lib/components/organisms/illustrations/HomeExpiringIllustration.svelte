<svg class="illus" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<rect x="10" y="8" width="20" height="24" rx="4" class="box" />
	<circle cx="30" cy="12" r="6" class="clock" />
	<path class="hand" d="M30 12 V9" stroke-width="1.5" stroke-linecap="round" />
</svg>
<style>
	.illus {
		width: 2.5rem;
		height: auto;
		color: var(--color-primary);
	}

	.box {
		fill: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 1.5;
	}

	.clock {
		fill: var(--color-surface-muted);
		stroke: var(--color-primary);
		stroke-width: 1.5;
	}

	.hand {
		stroke: var(--color-primary);
		transform-origin: 30px 12px;
		animation: hand-tick 4s ease-in-out infinite;
	}

	@keyframes hand-tick {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(8deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hand {
			animation: none;
		}
	}
</style>
