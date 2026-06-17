<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<circle class="bg" cx="100" cy="80" r="56" />
	<rect class="item i1" x="58" y="52" width="36" height="22" rx="6" />
	<rect class="item i2" x="106" y="62" width="40" height="24" rx="6" />
	<rect class="item i3" x="72" y="92" width="56" height="20" rx="6" />
</svg>

<style>
	.illus {
		width: min(100%, 12.5rem);
		height: auto;
	}

	.bg {
		fill: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.item {
		fill: var(--color-surface);
		stroke: var(--color-primary);
		stroke-width: 2;
		transform-origin: center;
		animation: success-pop 420ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	.i2 {
		animation-delay: 100ms;
	}
	.i3 {
		animation-delay: 180ms;
	}

	@keyframes success-pop {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.item {
			animation: none;
		}
	}
</style>
