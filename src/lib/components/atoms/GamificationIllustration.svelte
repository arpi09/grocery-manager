<script lang="ts">
	/** SVG illustrations for gamification moments — warm, no emoji. */

	export type GamificationIllustrationVariant = 'streak' | 'milestone' | 'ritual' | 'savings';

	interface Props {
		variant: GamificationIllustrationVariant;
		size?: number;
	}

	let { variant, size = 100 }: Props = $props();
</script>

<div class="gamification-illus" class:variant-streak={variant === 'streak'} class:variant-savings={variant === 'savings'} style="--illus-size: {size}px" aria-hidden="true">
	<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
		{#if variant === 'streak'}
			<circle class="glow" cx="60" cy="60" r="52" />
			<circle class="ring ring-outer" cx="60" cy="60" r="42" stroke-width="4" />
			<circle class="ring ring-inner" cx="60" cy="60" r="30" stroke-width="5" stroke-dasharray="188" stroke-dashoffset="47" />
			<path class="flame" d="M60 38 C54 50 48 54 48 64 C48 72 53 78 60 78 C67 78 72 72 72 64 C72 54 66 50 60 38 Z" />
		{:else if variant === 'savings'}
			<circle class="glow glow-savings" cx="60" cy="60" r="52" />
			<rect class="coin" x="38" y="42" width="44" height="44" rx="22" stroke-width="3" />
			<path class="coin-mark" d="M52 68 L60 48 L68 68" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
			<circle class="burst b1" cx="22" cy="34" r="3.5" />
			<circle class="burst b2" cx="98" cy="30" r="3" />
		{:else if variant === 'ritual'}
			<circle class="glow glow-ritual" cx="60" cy="60" r="52" />
			<rect class="calendar" x="34" y="36" width="52" height="48" rx="6" stroke-width="3" />
			<line class="cal-line" x1="34" y1="50" x2="86" y2="50" stroke-width="3" />
			<circle class="cal-dot d1" cx="48" cy="64" r="4" />
			<circle class="cal-dot d2" cx="60" cy="64" r="4" />
			<path class="check" d="M72 62 L78 68 L90 54" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
		{:else}
			<circle class="glow" cx="60" cy="60" r="52" />
			<circle class="ring" cx="60" cy="60" r="36" stroke-width="3" />
			<path class="check" d="M42 60 L54 72 L82 46" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
			<circle class="burst b1" cx="24" cy="28" r="4" />
			<circle class="burst b2" cx="96" cy="22" r="3" />
			<circle class="burst b3" cx="92" cy="92" r="3.5" />
		{/if}
	</svg>
</div>

<style>
	.gamification-illus {
		display: flex;
		justify-content: center;
	}

	svg {
		width: var(--illus-size);
		height: var(--illus-size);
		overflow: visible;
	}

	.glow {
		fill: color-mix(in srgb, var(--color-success) 14%, var(--color-surface-muted));
		transform-origin: 60px 60px;
		animation: glow-in 0.5s ease-out both;
	}

	.glow-savings {
		fill: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
	}

	.glow-ritual {
		fill: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
	}

	.ring {
		stroke: color-mix(in srgb, var(--color-primary) 55%, transparent);
		fill: none;
		transform-origin: 60px 60px;
		animation: ring-pop 0.55s 0.08s cubic-bezier(0.34, 1.25, 0.64, 1) both;
	}

	.ring-inner {
		stroke: var(--color-primary);
		transform: rotate(-90deg);
		transform-origin: 60px 60px;
		animation:
			ring-pop 0.55s 0.08s cubic-bezier(0.34, 1.25, 0.64, 1) both,
			ring-fill 0.8s 0.3s ease-out forwards;
	}

	.flame {
		fill: color-mix(in srgb, var(--color-primary) 75%, var(--color-warning));
		animation: flame-rise 0.6s 0.2s ease-out both;
	}

	.check {
		stroke: var(--color-success);
		fill: none;
		stroke-dasharray: 60;
		stroke-dashoffset: 60;
		animation: stroke-draw 0.45s 0.25s ease-out forwards;
	}

	.coin {
		stroke: var(--color-primary);
		fill: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		animation: ring-pop 0.5s ease-out both;
	}

	.coin-mark {
		stroke: var(--color-primary);
		fill: none;
		stroke-dasharray: 40;
		stroke-dashoffset: 40;
		animation: stroke-draw 0.4s 0.2s ease-out forwards;
	}

	.calendar {
		stroke: var(--color-primary);
		fill: var(--color-surface);
		animation: ring-pop 0.5s ease-out both;
	}

	.cal-line {
		stroke: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
	}

	.cal-dot {
		fill: color-mix(in srgb, var(--color-primary) 35%, transparent);
		animation: dot-pop 0.35s ease-out both;
	}

	.d1 {
		animation-delay: 0.25s;
	}

	.d2 {
		animation-delay: 0.32s;
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

	@keyframes ring-fill {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes stroke-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes flame-rise {
		from {
			opacity: 0;
			transform: translateY(6px) scale(0.85);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes dot-pop {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
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
		.ring-inner,
		.check,
		.coin,
		.coin-mark,
		.calendar,
		.cal-dot,
		.flame,
		.burst {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
			transform: none;
		}
	}
</style>
