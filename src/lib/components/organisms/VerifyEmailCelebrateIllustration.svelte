<script lang="ts">
	/** Celebration graphic for successful email verification */
</script>

<div class="celebrate-illus" aria-hidden="true">
	<svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle class="glow" cx="80" cy="72" r="58" />
		<circle class="ring" cx="80" cy="68" r="40" stroke-width="3" />
		<path
			class="check"
			d="M56 68 L72 84 L108 50"
			stroke-width="5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path class="star s1" d="M28 34 L30 40 L36 40 L31 44 L33 50 L28 46 L23 50 L25 44 L20 40 L26 40 Z" />
		<path class="star s2" d="M132 28 L133.5 32 L138 32 L134.5 35 L136 39 L132 36 L128 39 L129.5 35 L126 32 L130.5 32 Z" />
		<path class="star s3" d="M124 108 L125.5 112 L130 112 L126.5 115 L128 119 L124 116 L120 119 L121.5 115 L118 112 L122.5 112 Z" />
		<circle class="confetti c1" cx="44" cy="52" r="4" />
		<circle class="confetti c2" cx="118" cy="44" r="3.5" />
		<rect class="confetti c3" x="134" y="88" width="7" height="7" rx="1.5" transform="rotate(22 137.5 91.5)" />
		<circle class="confetti c4" cx="36" cy="98" r="3" />
		<circle class="confetti c5" cx="96" cy="118" r="2.5" />
	</svg>
</div>

<style>
	.celebrate-illus {
		display: flex;
		justify-content: center;
		margin-bottom: var(--space-md);
	}

	svg {
		width: min(9rem, 42vw);
		height: auto;
		overflow: visible;
	}

	.glow {
		fill: color-mix(in srgb, var(--color-success) 14%, var(--color-surface-muted));
		transform-origin: 80px 72px;
		animation: glow-in 0.55s ease-out both;
	}

	.ring {
		stroke: color-mix(in srgb, var(--color-success) 50%, transparent);
		fill: none;
		transform-origin: 80px 68px;
		animation: ring-pop 0.6s 0.08s cubic-bezier(0.34, 1.25, 0.64, 1) both;
	}

	.check {
		stroke: var(--color-success);
		fill: none;
		stroke-dasharray: 72;
		stroke-dashoffset: 72;
		animation: check-draw 0.5s 0.28s ease-out forwards;
	}

	.star {
		fill: color-mix(in srgb, var(--color-warning, #f59e0b) 75%, var(--color-primary));
		opacity: 0;
		transform-origin: center;
	}

	.s1 {
		animation: star-twinkle 1.8s 0.4s ease-in-out infinite;
	}

	.s2 {
		animation: star-twinkle 2s 0.55s ease-in-out infinite;
	}

	.s3 {
		animation: star-twinkle 1.7s 0.7s ease-in-out infinite;
	}

	.confetti {
		fill: var(--color-primary);
		opacity: 0;
	}

	.c1 {
		animation: confetti-rise 1.5s 0.35s ease-out infinite;
	}

	.c2 {
		fill: var(--color-success);
		animation: confetti-rise 1.6s 0.5s ease-out infinite;
	}

	.c3 {
		fill: color-mix(in srgb, var(--color-warning, #f59e0b) 70%, var(--color-primary));
		animation: confetti-rise 1.55s 0.65s ease-out infinite;
	}

	.c4 {
		fill: var(--color-success);
		animation: confetti-rise 1.45s 0.45s ease-out infinite;
	}

	.c5 {
		animation: confetti-rise 1.65s 0.75s ease-out infinite;
	}

	@keyframes glow-in {
		from {
			opacity: 0;
			transform: scale(0.85);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes ring-pop {
		from {
			opacity: 0;
			transform: scale(0.65);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes check-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes star-twinkle {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.85) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.05) rotate(12deg);
		}
	}

	@keyframes confetti-rise {
		0% {
			opacity: 0;
			transform: translateY(6px) scale(0.7);
		}
		30% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-16px) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glow,
		.ring,
		.check,
		.star,
		.confetti {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
			transform: none;
		}
	}
</style>
