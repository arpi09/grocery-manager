<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<rect class="list" x="56" y="36" width="88" height="96" rx="12" stroke-width="2.5" />
	<rect class="row r1" x="68" y="54" width="52" height="8" rx="4" />
	<rect class="row r2" x="68" y="72" width="64" height="8" rx="4" />
	<rect class="row r3" x="68" y="90" width="48" height="8" rx="4" />
	<path class="tick" d="M68 58 L74 64 L86 50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>

<style>
	.illus {
		width: min(100%, 12.5rem);
		height: auto;
	}

	.list {
		fill: var(--color-surface);
		stroke: var(--color-border);
	}

	.row {
		fill: var(--color-surface-muted);
	}

	.r2 {
		opacity: 0.75;
	}
	.r3 {
		opacity: 0.55;
	}

	.tick {
		stroke: var(--color-primary);
		stroke-dasharray: 30;
		stroke-dashoffset: 30;
		animation: tick-draw 500ms ease forwards 300ms;
	}

	@keyframes tick-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tick {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
