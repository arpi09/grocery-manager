<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<circle class="node n1" cx="56" cy="80" r="14" />
	<circle class="node n2" cx="100" cy="48" r="14" />
	<circle class="node n3" cx="144" cy="80" r="14" />
	<circle class="node n4" cx="100" cy="112" r="14" />
	<path class="link l1" d="M68 76 L88 54" stroke-width="2.5" stroke-linecap="round" />
	<path class="link l2" d="M112 54 L132 76" stroke-width="2.5" stroke-linecap="round" />
	<path class="link l3" d="M132 88 L112 108" stroke-width="2.5" stroke-linecap="round" />
	<path class="link l4" d="M88 108 L68 88" stroke-width="2.5" stroke-linecap="round" />
</svg>

<style>
	.illus {
		width: min(100%, 12.5rem);
		height: auto;
		color: var(--color-primary);
	}

	.node {
		fill: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 2;
	}

	.link {
		stroke: var(--color-primary);
		stroke-dasharray: 40;
		stroke-dashoffset: 40;
		animation: path-draw 700ms ease forwards;
	}

	.l2 {
		animation-delay: 120ms;
	}
	.l3 {
		animation-delay: 240ms;
	}
	.l4 {
		animation-delay: 360ms;
	}

	@keyframes path-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.link {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
