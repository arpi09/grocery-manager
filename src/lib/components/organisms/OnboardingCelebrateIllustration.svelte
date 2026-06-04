<script lang="ts">
	/** Compact celebration graphic for activation modal */
</script>

<div class="celebrate-illus" aria-hidden="true">
	<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle class="glow" cx="60" cy="60" r="52" />
		<circle class="ring" cx="60" cy="60" r="36" stroke-width="3" />
		<path
			class="check"
			d="M42 60 L54 72 L82 46"
			stroke-width="5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<circle class="burst b1" cx="24" cy="28" r="4" />
		<circle class="burst b2" cx="96" cy="22" r="3" />
		<circle class="burst b3" cx="92" cy="92" r="3.5" />
	</svg>
</div>

<style>
	.celebrate-illus {
		display: flex;
		justify-content: center;
	}

	svg {
		width: 5.5rem;
		height: 5.5rem;
		overflow: visible;
	}

	.glow {
		fill: color-mix(in srgb, var(--color-success) 14%, var(--color-surface-muted));
		transform-origin: 60px 60px;
		animation: glow-in 0.5s ease-out both;
	}

	.ring {
		stroke: color-mix(in srgb, var(--color-success) 50%, transparent);
		fill: none;
		transform-origin: 60px 60px;
		animation: ring-pop 0.55s 0.08s cubic-bezier(0.34, 1.25, 0.64, 1) both;
	}

	.check {
		stroke: var(--color-success);
		fill: none;
		stroke-dasharray: 60;
		stroke-dashoffset: 60;
		animation: check-draw 0.45s 0.25s ease-out forwards;
	}

	.burst {
		fill: var(--color-primary);
		opacity: 0;
	}

	.b1 {
		animation: burst 1.4s 0.35s ease-out infinite;
	}

	.b2 {
		fill: var(--color-success);
		animation: burst 1.5s 0.5s ease-out infinite;
	}

	.b3 {
		animation: burst 1.3s 0.65s ease-out infinite;
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

	@keyframes burst {
		0% {
			opacity: 0;
			transform: translateY(4px);
		}
		35% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-10px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glow,
		.ring,
		.check,
		.burst {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
		}
	}
</style>
