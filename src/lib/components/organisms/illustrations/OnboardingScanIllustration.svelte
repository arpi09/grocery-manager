<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<rect class="frame" x="52" y="28" width="96" height="104" rx="12" stroke-width="3" />
	<line class="beam" x1="52" y1="72" x2="148" y2="72" stroke-width="3" stroke-linecap="round" />
	<rect class="barcode" x="72" y="86" width="56" height="28" rx="4" stroke-width="2" />
	<path class="check" d="M88 100 L96 108 L116 88" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</svg>

<style>
	.illus {
		width: min(100%, 12.5rem);
		height: auto;
	}

	.frame {
		stroke: var(--color-border);
		fill: var(--color-surface-muted);
	}

	.beam {
		stroke: var(--color-primary);
		opacity: 0.85;
		animation: beam-sweep 1.6s ease-in-out infinite;
	}

	.barcode {
		fill: var(--color-surface);
		stroke: var(--color-text-muted);
	}

	.check {
		stroke: var(--color-primary);
		stroke-dasharray: 40;
		stroke-dashoffset: 40;
		animation: check-draw 600ms ease forwards 400ms;
	}

	@keyframes beam-sweep {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		50% {
			transform: translateY(6px);
			opacity: 1;
		}
	}

	@keyframes check-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.beam,
		.check {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
