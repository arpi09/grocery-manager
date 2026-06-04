<script lang="ts">
	import type { NewsIllustrationId } from '$lib/data/app-news';

	interface Props {
		id: NewsIllustrationId;
		/** When true, CSS/SVG motion runs (set by scroll reveal). */
		active?: boolean;
	}

	let { id, active = true }: Props = $props();
</script>

<div class="illus-wrap" class:active data-illus={id} aria-hidden="true">
	{#if id === 'scan'}
		<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="illus-bg" cx="100" cy="80" r="72" />
			<rect class="illus-frame" x="58" y="44" width="84" height="64" rx="10" />
			<path class="illus-camera" d="M72 108h56l8-14H64l8 14z" stroke-width="2.5" />
			<circle class="illus-lens" cx="100" cy="108" r="10" stroke-width="2.5" />
			<path class="illus-scan-line" d="M66 58h68" stroke-width="3" stroke-linecap="round" />
			<circle class="illus-dot dot-a" cx="48" cy="52" r="4" />
			<circle class="illus-dot dot-b" cx="152" cy="46" r="3" />
		</svg>
	{:else if id === 'onboarding'}
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
	{:else if id === 'recipe'}
		<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="illus-bg" cx="100" cy="80" r="72" />
			<rect class="illus-card" x="52" y="38" width="96" height="88" rx="12" />
			<path class="illus-line l1" d="M68 58h64" stroke-width="4" stroke-linecap="round" />
			<path class="illus-line l2" d="M68 74h48" stroke-width="3" stroke-linecap="round" />
			<path class="illus-line l3" d="M68 88h56" stroke-width="3" stroke-linecap="round" />
			<circle class="illus-badge" cx="132" cy="108" r="14" />
			<path class="illus-spark" d="M132 100v16M124 108h16" stroke-width="2.5" stroke-linecap="round" />
		</svg>
	{:else if id === 'push'}
		<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="illus-bg" cx="100" cy="80" r="72" />
			<path
				class="illus-bell"
				d="M100 36c-14 0-22 10-22 24v28l-10 12h64l-10-12V60c0-14-8-24-22-24Z"
				stroke-width="2.5"
			/>
			<path class="illus-clapper" d="M100 112v8" stroke-width="3" stroke-linecap="round" />
			<circle class="illus-pulse p1" cx="100" cy="52" r="22" stroke-width="2" />
			<circle class="illus-pulse p2" cx="100" cy="52" r="32" stroke-width="1.5" />
		</svg>
	{:else}
		<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle class="illus-bg" cx="100" cy="80" r="72" />
			<rect class="illus-table" x="44" y="48" width="112" height="72" rx="10" />
			<path class="illus-row r1" d="M56 68h88" stroke-width="3" stroke-linecap="round" />
			<path class="illus-row r2" d="M56 84h72" stroke-width="3" stroke-linecap="round" />
			<path class="illus-row r3" d="M56 100h80" stroke-width="3" stroke-linecap="round" />
			<rect class="illus-chip" x="56" y="58" width="28" height="8" rx="4" />
		</svg>
	{/if}
</div>

<style>
	.illus-wrap {
		display: flex;
		justify-content: center;
		width: 100%;
		padding: var(--space-sm) 0;
	}

	.illus {
		width: min(180px, 56vw);
		height: auto;
		overflow: visible;
	}

	.illus-bg {
		fill: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
		transform-origin: 100px 80px;
	}

	.illus-bg.celebrate {
		fill: color-mix(in srgb, var(--color-success) 12%, var(--color-surface-muted));
	}

	.illus-wrap.active .illus-bg {
		animation: illus-bg-in 0.7s ease-out both;
	}

	.illus-frame,
	.illus-card,
	.illus-table {
		fill: var(--color-surface);
		stroke: color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		stroke-width: 1.5;
		opacity: 0;
	}

	.illus-wrap.active .illus-frame,
	.illus-wrap.active .illus-card,
	.illus-wrap.active .illus-table {
		animation: illus-fade-up 0.55s 0.12s ease-out forwards;
	}

	.illus-camera,
	.illus-lens,
	.illus-bell,
	.illus-clapper {
		stroke: var(--color-primary);
		fill: none;
		opacity: 0;
	}

	.illus-wrap.active .illus-camera,
	.illus-wrap.active .illus-lens {
		animation: illus-fade-up 0.5s 0.35s ease-out forwards;
	}

	.illus-scan-line {
		stroke: var(--color-success);
		opacity: 0;
	}

	.illus-wrap.active .illus-scan-line {
		animation: illus-scan-sweep 1.6s 0.5s ease-in-out infinite;
	}

	.illus-dot {
		fill: color-mix(in srgb, var(--color-primary) 55%, transparent);
		opacity: 0;
	}

	.illus-wrap.active .dot-a {
		animation: illus-dot 2s 0.55s ease-in-out infinite;
	}

	.illus-wrap.active .dot-b {
		animation: illus-dot 2.2s 0.85s ease-in-out infinite;
	}

	.illus-ring {
		stroke: color-mix(in srgb, var(--color-success) 45%, transparent);
		fill: none;
		opacity: 0;
		transform-origin: 100px 72px;
	}

	.illus-wrap.active .illus-ring {
		animation: illus-ring-pop 0.65s 0.1s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
	}

	.illus-check {
		stroke: var(--color-success);
		fill: none;
		stroke-dasharray: 80;
		stroke-dashoffset: 80;
	}

	.illus-wrap.active .illus-check {
		animation: illus-check-draw 0.55s 0.35s ease-out forwards;
	}

	.illus-confetti {
		fill: var(--color-primary);
		opacity: 0;
	}

	.illus-wrap.active .c1 {
		animation: illus-confetti 1.6s 0.45s ease-out infinite;
	}

	.illus-wrap.active .c2 {
		fill: color-mix(in srgb, var(--color-success) 80%, var(--color-primary));
		animation: illus-confetti 1.8s 0.6s ease-out infinite;
	}

	.illus-wrap.active .c3 {
		fill: color-mix(in srgb, var(--color-warning, #f59e0b) 70%, var(--color-primary));
		animation: illus-confetti 1.7s 0.75s ease-out infinite;
	}

	.illus-wrap.active .c4 {
		fill: var(--color-success);
		animation: illus-confetti 1.5s 0.5s ease-out infinite;
	}

	.illus-line,
	.illus-row {
		stroke: color-mix(in srgb, var(--color-primary) 55%, var(--color-text-muted));
		opacity: 0;
	}

	.illus-wrap.active .l1 {
		animation: illus-fade-up 0.45s 0.22s ease-out forwards;
	}

	.illus-wrap.active .l2 {
		animation: illus-fade-up 0.45s 0.32s ease-out forwards;
	}

	.illus-wrap.active .l3 {
		animation: illus-fade-up 0.45s 0.42s ease-out forwards;
	}

	.illus-wrap.active .r1 {
		animation: illus-fade-up 0.45s 0.24s ease-out forwards;
	}

	.illus-wrap.active .r2 {
		animation: illus-fade-up 0.45s 0.34s ease-out forwards;
	}

	.illus-wrap.active .r3 {
		animation: illus-fade-up 0.45s 0.44s ease-out forwards;
	}

	.illus-badge {
		fill: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 1.5;
		opacity: 0;
	}

	.illus-wrap.active .illus-badge {
		animation: illus-ring-pop 0.55s 0.48s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
	}

	.illus-spark {
		stroke: var(--color-primary);
		opacity: 0;
	}

	.illus-wrap.active .illus-spark {
		animation: illus-fade-up 0.4s 0.58s ease-out forwards;
	}

	.illus-chip {
		fill: color-mix(in srgb, var(--color-primary) 22%, var(--color-surface-muted));
		opacity: 0;
	}

	.illus-wrap.active .illus-chip {
		animation: illus-fade-up 0.45s 0.18s ease-out forwards;
	}

	.illus-wrap.active .illus-bell,
	.illus-wrap.active .illus-clapper {
		animation: illus-fade-up 0.5s 0.2s ease-out forwards;
	}

	.illus-pulse {
		stroke: color-mix(in srgb, var(--color-primary) 40%, transparent);
		fill: none;
		opacity: 0;
		transform-origin: 100px 52px;
	}

	.illus-wrap.active .p1 {
		animation: illus-pulse 2s 0.4s ease-out infinite;
	}

	.illus-wrap.active .p2 {
		animation: illus-pulse 2s 0.65s ease-out infinite;
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

	@keyframes illus-scan-sweep {
		0%,
		100% {
			opacity: 0.35;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(36px);
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

	@keyframes illus-pulse {
		0% {
			opacity: 0.55;
			transform: scale(0.85);
		}
		70% {
			opacity: 0;
			transform: scale(1.15);
		}
		100% {
			opacity: 0;
			transform: scale(1.15);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.illus-wrap.active .illus-bg,
		.illus-wrap.active .illus-frame,
		.illus-wrap.active .illus-card,
		.illus-wrap.active .illus-table,
		.illus-wrap.active .illus-camera,
		.illus-wrap.active .illus-lens,
		.illus-wrap.active .illus-scan-line,
		.illus-wrap.active .illus-dot,
		.illus-wrap.active .illus-ring,
		.illus-wrap.active .illus-check,
		.illus-wrap.active .illus-confetti,
		.illus-wrap.active .illus-line,
		.illus-wrap.active .illus-row,
		.illus-wrap.active .illus-badge,
		.illus-wrap.active .illus-spark,
		.illus-wrap.active .illus-chip,
		.illus-wrap.active .illus-bell,
		.illus-wrap.active .illus-clapper,
		.illus-wrap.active .illus-pulse {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
			transform: none;
		}
	}
</style>
