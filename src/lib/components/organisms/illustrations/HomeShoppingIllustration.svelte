<svg class="illus" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<path class="basket" d="M8 16 H32 L28 34 H12 Z" />
	<path class="check" d="M14 22 L18 26 L26 18" stroke-width="2" stroke-linecap="round" />
</svg>
<style>
	.illus {
		width: 2.5rem;
		height: auto;
		color: var(--color-primary);
	}

	.basket {
		fill: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 1.5;
	}

	.check {
		stroke: var(--color-primary);
		fill: none;
		stroke-dasharray: 20;
		stroke-dashoffset: 20;
		animation: check-draw 700ms ease forwards 200ms;
	}

	@keyframes check-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.check {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
