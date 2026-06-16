<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	export type ScanHubVariant = 'receipt' | 'photo' | 'barcode';

	interface Props {
		variant: ScanHubVariant;
		/** When false, motion is off even if reduced-motion is not set. */
		active?: boolean;
	}

	let { variant, active = true }: Props = $props();

	let reducedMotion = $state(true);

	onMount(() => {
		if (!browser) return;
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	let motionActive = $derived(active && !reducedMotion);
</script>

<div class="hub-illus" class:active={motionActive} data-variant={variant} aria-hidden="true">
	{#if variant === 'receipt'}
		<svg class="svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect class="paper" x="10" y="6" width="28" height="36" rx="4" />
			<path class="fold" d="M30 6 L38 14 V40 H10" />
			<path class="line l1" d="M14 18h20" stroke-width="2" stroke-linecap="round" />
			<path class="line l2" d="M14 24h16" stroke-width="2" stroke-linecap="round" />
			<path class="line l3" d="M14 30h18" stroke-width="2" stroke-linecap="round" />
			<circle class="spark" cx="34" cy="12" r="2.5" />
		</svg>
	{:else if variant === 'photo'}
		<svg class="svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect class="frame" x="8" y="12" width="32" height="24" rx="4" />
			<circle class="lens" cx="24" cy="24" r="7" stroke-width="2" />
			<path class="camera-body" d="M16 36h16l3-6H13l3 6z" stroke-width="2" />
			<path class="scan-line" d="M12 18h24" stroke-width="2.5" stroke-linecap="round" />
			<circle class="flash" cx="34" cy="16" r="3" />
		</svg>
	{:else}
		<svg class="svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect class="bar b1" x="12" y="10" width="3" height="28" rx="1.5" />
			<rect class="bar b2" x="18" y="14" width="3" height="24" rx="1.5" />
			<rect class="bar b3" x="24" y="8" width="3" height="32" rx="1.5" />
			<rect class="bar b4" x="30" y="12" width="3" height="26" rx="1.5" />
			<path class="scan-line" d="M8 24h32" stroke-width="2.5" stroke-linecap="round" />
		</svg>
	{/if}
</div>

<style>
	.hub-illus {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.svg {
		width: 1.75rem;
		height: 1.75rem;
		overflow: visible;
	}

	.paper,
	.frame {
		fill: var(--color-surface);
		stroke: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		stroke-width: 1.5;
	}

	.fold {
		fill: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));
		stroke: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		stroke-width: 1.5;
	}

	.line {
		stroke: color-mix(in srgb, var(--color-primary) 50%, var(--color-text-muted));
		opacity: 0.85;
	}

	.spark {
		fill: color-mix(in srgb, var(--color-success) 70%, var(--color-primary));
		opacity: 0.7;
	}

	.lens,
	.camera-body {
		stroke: var(--color-primary);
		fill: none;
	}

	.flash {
		fill: color-mix(in srgb, var(--color-warning, #f59e0b) 60%, var(--color-primary));
		opacity: 0.85;
	}

	.bar {
		fill: color-mix(in srgb, var(--color-primary) 55%, var(--color-text-muted));
		opacity: 0.9;
	}

	.scan-line {
		stroke: var(--color-success);
		opacity: 0.55;
	}

	.hub-illus.active .spark {
		animation: hub-spark 2.4s 0.3s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}

	.hub-illus.active .line {
		animation: hub-line-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.hub-illus.active .l2 {
		animation-delay: 0.08s;
	}

	.hub-illus.active .l3 {
		animation-delay: 0.16s;
	}

	.hub-illus.active .scan-line {
		animation: hub-scan-sweep 2s 0.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}

	.hub-illus[data-variant='photo'].active .flash {
		animation: hub-flash 2.6s 0.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}

	.hub-illus[data-variant='barcode'].active .bar {
		animation: hub-bar-pulse 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}

	.hub-illus.active .b2 {
		animation-delay: 0.15s;
	}

	.hub-illus.active .b3 {
		animation-delay: 0.3s;
	}

	.hub-illus.active .b4 {
		animation-delay: 0.45s;
	}

	@keyframes hub-spark {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1.15);
		}
	}

	@keyframes hub-line-in {
		from {
			opacity: 0;
			transform: scaleX(0.6);
			transform-origin: left center;
		}
		to {
			opacity: 0.85;
			transform: scaleX(1);
		}
	}

	@keyframes hub-scan-sweep {
		0%,
		100% {
			opacity: 0.3;
			transform: translateY(-8px);
		}
		50% {
			opacity: 1;
			transform: translateY(8px);
		}
	}

	@keyframes hub-flash {
		0%,
		82%,
		100% {
			opacity: 0.4;
			transform: scale(0.9);
		}
		86% {
			opacity: 1;
			transform: scale(1.2);
		}
		92% {
			opacity: 0.5;
			transform: scale(1);
		}
	}

	@keyframes hub-bar-pulse {
		0%,
		100% {
			opacity: 0.65;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hub-illus.active .spark,
		.hub-illus.active .line,
		.hub-illus.active .scan-line,
		.hub-illus.active .flash,
		.hub-illus.active .bar {
			animation: none;
			opacity: 0.85;
			transform: none;
		}
	}
</style>
