<svg class="illus" viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<rect class="shelf" x="8" y="44" width="64" height="6" rx="3" />
	<rect class="shelf" x="8" y="28" width="64" height="6" rx="3" />
	<rect class="item i1" x="14" y="14" width="14" height="20" rx="4" />
	<rect class="item i2" x="32" y="18" width="12" height="16" rx="3" />
	<rect class="item i3" x="48" y="16" width="18" height="18" rx="4" />
</svg>
<style>
	.illus {
		width: 5rem;
		height: auto;
		color: var(--color-primary);
	}

	.shelf {
		fill: var(--color-surface-muted);
	}

	.item {
		fill: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 1.5;
		transform-origin: center bottom;
		animation: shelf-pulse 3.6s ease-in-out infinite;
	}

	.i2 {
		animation-delay: 0.4s;
	}

	.i3 {
		animation-delay: 0.8s;
	}

	@keyframes shelf-pulse {
		0%,
		100% {
			opacity: 0.72;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.item {
			animation: none;
			opacity: 1;
		}
	}
</style>
