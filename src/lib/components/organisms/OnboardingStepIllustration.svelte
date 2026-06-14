<script lang="ts">
	import type { OnboardingStepId } from '$lib/utils/onboarding-steps';

	interface Props {
		step: OnboardingStepId;
	}

	let { step }: Props = $props();
</script>

<div class="illus-wrap" data-step={step} aria-hidden="true">
	{#if step === 'welcome'}
		<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="illus-bg" cx="100" cy="80" r="72" />
			<rect class="illus-shelf" x="44" y="88" width="112" height="8" rx="4" />
			<rect class="illus-jar jar-a" x="52" y="52" width="36" height="44" rx="8" />
			<rect class="illus-jar jar-b" x="96" y="44" width="36" height="52" rx="8" />
			<rect class="illus-jar jar-c" x="140" y="58" width="28" height="38" rx="7" />
			<path
				class="illus-spark"
				d="M100 24 L102 32 L110 30 L104 36 L112 40 L100 38 L88 40 L96 36 L90 30 L98 32 Z"
			/>
			<circle class="illus-dot dot-1" cx="68" cy="36" r="4" />
			<circle class="illus-dot dot-2" cx="132" cy="28" r="3" />
			<path class="illus-camera" d="M72 108h56l8-14H64l8 14z" stroke-width="2.5" />
			<circle class="illus-lens" cx="100" cy="108" r="10" stroke-width="2.5" />
			<circle class="flash-ring camera-flash" cx="100" cy="108" r="16" />
			<circle class="flash-burst camera-flash" cx="100" cy="108" r="9" />
		</svg>
	{:else if step === 'pathGuide'}
		<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="illus-bg" cx="100" cy="80" r="72" />
			<rect class="scan-frame" x="52" y="36" width="96" height="88" rx="10" stroke-width="3" />
			<path class="scan-corner tl" d="M52 52 V36 H68" stroke-width="4" stroke-linecap="round" />
			<path class="scan-corner tr" d="M132 36 H148 V52" stroke-width="4" stroke-linecap="round" />
			<path class="scan-corner bl" d="M52 108 V124 H68" stroke-width="4" stroke-linecap="round" />
			<path class="scan-corner br" d="M148 108 V124 H132" stroke-width="4" stroke-linecap="round" />
			<line class="scan-line" x1="60" y1="72" x2="140" y2="72" stroke-width="2.5" stroke-linecap="round" />
			<circle class="add-plus ring" cx="100" cy="80" r="22" stroke-width="2.5" />
			<path class="add-plus" d="M100 70 V90 M90 80 H110" stroke-width="3" stroke-linecap="round" />
		</svg>
	{:else}
		<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="illus-bg celebrate" cx="100" cy="80" r="72" />
			<circle class="illus-ring" cx="100" cy="72" r="44" stroke-width="4" />
			<path
				class="illus-check"
				d="M78 72 L94 88 L128 54"
				stroke-width="6"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<circle class="illus-confetti c1" cx="48" cy="48" r="5" />
			<circle class="illus-confetti c2" cx="152" cy="40" r="4" />
			<rect class="illus-confetti c3" x="156" y="96" width="8" height="8" rx="2" transform="rotate(18 160 100)" />
			<circle class="illus-confetti c4" cx="40" cy="108" r="3.5" />
		</svg>
	{/if}
</div>

<style>
	.illus-wrap {
		display: flex;
		justify-content: center;
		width: 100%;
		flex-shrink: 0;
		padding: var(--space-lg) 0 var(--space-md);
	}

	.illus {
		width: min(220px, 72vw);
		max-height: 10rem;
		height: auto;
		flex-shrink: 0;
		overflow: visible;
	}

	.illus-bg {
		fill: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
		transform-origin: 100px 80px;
		animation: illus-bg-in 0.7s ease-out both;
	}

	.illus-bg.celebrate {
		fill: color-mix(in srgb, var(--color-success) 12%, var(--color-surface-muted));
	}

	.illus-shelf {
		fill: color-mix(in srgb, var(--color-border) 80%, var(--color-surface));
		opacity: 0;
		animation: illus-fade-up 0.5s 0.2s ease-out forwards;
	}

	.illus-jar {
		fill: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		stroke: color-mix(in srgb, var(--color-primary) 35%, transparent);
		stroke-width: 1.5;
		opacity: 0;
		transform-origin: center bottom;
	}

	.jar-a {
		animation: illus-jar-in 0.55s 0.15s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
	}

	.jar-b {
		animation: illus-jar-in 0.55s 0.28s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
	}

	.jar-c {
		animation: illus-jar-in 0.55s 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
	}

	.illus-spark {
		fill: var(--color-primary);
		opacity: 0;
		transform-origin: 100px 32px;
		animation: illus-spark 1.8s 0.5s ease-in-out infinite;
	}

	.illus-dot {
		fill: color-mix(in srgb, var(--color-primary) 55%, transparent);
		opacity: 0;
	}

	.dot-1 {
		animation: illus-dot 2s 0.6s ease-in-out infinite;
	}

	.dot-2 {
		animation: illus-dot 2.2s 0.9s ease-in-out infinite;
	}

	.illus-camera,
	.illus-lens {
		stroke: var(--color-primary);
		fill: none;
		opacity: 0;
		animation: illus-fade-up 0.5s 0.55s ease-out forwards;
	}

	.camera-flash {
		fill: none;
		stroke: color-mix(in srgb, var(--color-primary) 55%, #fff);
		transform-origin: 100px 108px;
		pointer-events: none;
	}

	.flash-ring {
		opacity: 0;
		animation: camera-flash 2.4s 0.9s ease-out infinite;
	}

	.flash-burst {
		fill: color-mix(in srgb, var(--color-primary) 25%, #fff);
		stroke: none;
		opacity: 0;
		animation: camera-flash 2.4s 0.9s ease-out infinite;
		animation-delay: 0.05s;
	}

	.scan-frame {
		fill: none;
		stroke: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		opacity: 0;
		animation: scan-frame-in 0.55s 0.1s ease-out forwards;
	}

	.scan-corner {
		stroke: var(--color-primary);
		fill: none;
		opacity: 0;
		animation: scan-frame-in 0.45s ease-out forwards;
	}

	.scan-corner.tl {
		animation-delay: 0.15s;
	}

	.scan-corner.tr {
		animation-delay: 0.22s;
	}

	.scan-corner.bl {
		animation-delay: 0.29s;
	}

	.scan-corner.br {
		animation-delay: 0.36s;
	}

	.scan-line {
		stroke: color-mix(in srgb, var(--color-primary) 70%, var(--color-success));
		opacity: 0;
		animation: scan-line 2.2s 0.5s ease-in-out infinite;
	}

	.add-plus {
		stroke: var(--color-primary);
		fill: none;
		opacity: 0;
		transform-origin: 100px 80px;
	}

	.add-plus.ring {
		fill: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		animation: add-plus-in 0.5s 0.35s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
	}

	.add-plus:not(.ring) {
		animation: add-plus-in 0.5s 0.42s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
	}

	.illus-ring {
		stroke: color-mix(in srgb, var(--color-success) 45%, transparent);
		fill: none;
		opacity: 0;
		transform-origin: 100px 72px;
		animation: illus-ring-pop 0.65s 0.1s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
	}

	.illus-check {
		stroke: var(--color-success);
		fill: none;
		stroke-dasharray: 80;
		stroke-dashoffset: 80;
		animation: illus-check-draw 0.55s 0.35s ease-out forwards;
	}

	.illus-confetti {
		fill: var(--color-primary);
		opacity: 0;
	}

	.c1 {
		animation: illus-confetti 1.6s 0.45s ease-out infinite;
	}

	.c2 {
		fill: color-mix(in srgb, var(--color-success) 80%, var(--color-primary));
		animation: illus-confetti 1.8s 0.6s ease-out infinite;
	}

	.c3 {
		fill: color-mix(in srgb, var(--color-warning, #f59e0b) 70%, var(--color-primary));
		animation: illus-confetti 1.7s 0.75s ease-out infinite;
	}

	.c4 {
		fill: var(--color-success);
		animation: illus-confetti 1.5s 0.5s ease-out infinite;
	}

	@keyframes illus-bg-in {
		from {
			opacity: 0;
			transform: scale(0.88);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes illus-jar-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.92);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes illus-fade-up {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes illus-spark {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.9) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.08) rotate(12deg);
		}
	}

	@keyframes illus-dot {
		0%,
		100% {
			opacity: 0.25;
			transform: translateY(0);
		}
		50% {
			opacity: 0.9;
			transform: translateY(-4px);
		}
	}

	@keyframes camera-flash {
		0%,
		78%,
		100% {
			opacity: 0;
			transform: scale(0.75);
		}
		82% {
			opacity: 0.85;
			transform: scale(1.15);
		}
		86% {
			opacity: 0.35;
			transform: scale(1.45);
		}
		92% {
			opacity: 0;
			transform: scale(1.7);
		}
	}

	@keyframes scan-frame-in {
		from {
			opacity: 0;
			transform: scale(0.94);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes scan-line {
		0%,
		100% {
			opacity: 0.25;
			transform: translateY(-18px);
		}
		15% {
			opacity: 0.9;
		}
		50% {
			opacity: 1;
			transform: translateY(18px);
		}
		85% {
			opacity: 0.9;
		}
	}

	@keyframes add-plus-in {
		from {
			opacity: 0;
			transform: scale(0.7);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes illus-ring-pop {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes illus-check-draw {
		to {
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}

	@keyframes illus-confetti {
		0% {
			opacity: 0;
			transform: translateY(6px) scale(0.6);
		}
		30% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-14px) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.illus-bg,
		.illus-jar,
		.illus-shelf,
		.illus-spark,
		.illus-dot,
		.illus-camera,
		.illus-lens,
		.camera-flash,
		.scan-frame,
		.scan-corner,
		.scan-line,
		.add-plus,
		.illus-ring,
		.illus-check,
		.illus-confetti {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
			transform: none;
		}
	}
</style>
