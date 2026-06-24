<div class="moment-scene" aria-hidden="true">
	<span class="orb orb-a"></span>
	<span class="orb orb-b"></span>
	<span class="orb orb-c"></span>
	<span class="orb orb-d"></span>
</div>

<style>
	.moment-scene {
		position: relative;
		height: 56px;
		margin: calc(-1 * var(--space-sm)) calc(-1 * var(--space-md)) 0;
		overflow: hidden;
		background: color-mix(in srgb, var(--color-accent) 6%, var(--color-surface));
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		opacity: 0.3;
		animation: orb-float 10s ease-in-out infinite;
	}

	.orb-a {
		top: 12px;
		left: 16%;
		width: 32px;
		height: 32px;
		background: color-mix(in srgb, var(--color-accent) 45%, transparent);
		animation-delay: -1s;
	}

	.orb-b {
		top: 6px;
		right: 22%;
		width: 22px;
		height: 22px;
		background: color-mix(in srgb, var(--color-taupe) 55%, transparent);
		animation-delay: -3s;
	}

	.orb-c {
		bottom: 8px;
		left: 38%;
		width: 18px;
		height: 18px;
		background: color-mix(in srgb, var(--color-accent) 35%, transparent);
		animation-delay: -5s;
	}

	.orb-d {
		bottom: 14px;
		right: 12%;
		width: 26px;
		height: 26px;
		background: color-mix(in srgb, var(--color-taupe) 40%, transparent);
		animation-delay: -7s;
	}

	@keyframes orb-float {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
			opacity: 0.22;
		}
		33% {
			transform: translate(6px, -4px) scale(1.08);
			opacity: 0.38;
		}
		66% {
			transform: translate(-4px, 3px) scale(0.95);
			opacity: 0.28;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.orb {
			animation: none;
		}
	}
</style>
