<svg class="illus" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<circle class="node n1" cx="16" cy="24" r="8" />
	<circle class="node n2" cx="40" cy="16" r="6" />
	<circle class="node n3" cx="42" cy="34" r="5" />
	<path class="link l1" d="M24 24 L34 18" stroke-width="2" stroke-linecap="round" />
	<path class="link l2" d="M24 26 L37 32" stroke-width="2" stroke-linecap="round" />
</svg>
<style>
	.illus {
		width: 3.5rem;
		height: auto;
		color: var(--color-primary);
	}

	.node {
		fill: color-mix(in srgb, var(--color-primary) 20%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 1.5;
		transform-origin: center;
		animation: node-glow 2.8s ease-in-out infinite;
	}

	.n2 {
		animation-delay: 0.35s;
	}

	.n3 {
		animation-delay: 0.7s;
	}

	.link {
		stroke: var(--color-primary);
		opacity: 0.7;
	}

	@keyframes node-glow {
		0%,
		100% {
			opacity: 0.75;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.node {
			animation: none;
			opacity: 1;
		}
	}
</style>
