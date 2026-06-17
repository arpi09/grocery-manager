<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<rect class="shelf" x="36" y="108" width="128" height="10" rx="5" />
	<rect class="shelf" x="36" y="82" width="128" height="10" rx="5" />
	<rect class="jar j1" x="48" y="56" width="22" height="34" rx="6" />
	<rect class="jar j2" x="78" y="62" width="18" height="28" rx="5" />
	<rect class="box b1" x="104" y="58" width="28" height="32" rx="4" />
	<rect class="box b2" x="140" y="64" width="20" height="26" rx="4" />
	<path class="fill-line" d="M42 118 H158" stroke-width="3" stroke-linecap="round" />
</svg>

<style>
	.illus {
		width: min(100%, 12.5rem);
		height: auto;
		color: var(--color-primary);
	}

	.shelf {
		fill: var(--color-surface-muted);
	}

	.jar,
	.box {
		fill: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 2;
		transform-origin: center bottom;
		animation: item-rise 480ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	.j2 {
		animation-delay: 80ms;
	}
	.b1 {
		animation-delay: 140ms;
	}
	.b2 {
		animation-delay: 200ms;
	}

	.fill-line {
		stroke: var(--color-primary);
		stroke-dasharray: 120;
		stroke-dashoffset: 120;
		animation: line-draw 600ms ease forwards 240ms;
	}

	@keyframes item-rise {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes line-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.jar,
		.box,
		.fill-line {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
