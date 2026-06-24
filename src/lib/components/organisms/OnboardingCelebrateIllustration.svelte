<script lang="ts">
	/** Compact celebration graphic for activation modal */

	interface Props {
		heavy?: boolean;
	}

	let { heavy = false }: Props = $props();
</script>

<div class="celebrate-illus" class:heavy aria-hidden="true">
	{#if heavy}
		<span class="party-emoji" aria-hidden="true">🎉</span>
	{/if}
	<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle class="glow" class:glow-pulse={heavy} cx="60" cy="60" r="52" />
		<circle class="ring" cx="60" cy="60" r="36" stroke-width="3" />
		<path
			class="check"
			d="M42 60 L54 72 L82 46"
			stroke-width="5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		{#if heavy}
			<path
				class="party-horn horn-left"
				d="M18 42 L8 28 L22 34 Z M8 28 L4 18 L14 24 Z"
				fill="var(--color-primary)"
			/>
			<path
				class="party-horn horn-right"
				d="M102 42 L112 28 L98 34 Z M112 28 L116 18 L106 24 Z"
				fill="var(--color-success)"
			/>
			<circle class="burst b1 heavy-burst" cx="18" cy="24" r="4.5" />
			<circle class="burst b2 heavy-burst" cx="102" cy="18" r="4" />
			<circle class="burst b3 heavy-burst" cx="108" cy="96" r="4.5" />
			<circle class="burst b4 heavy-burst" cx="14" cy="88" r="3.5" />
			<rect class="burst b5 heavy-burst" x="94" y="52" width="7" height="7" rx="1.5" transform="rotate(22 97.5 55.5)" />
			<rect class="burst b6 heavy-burst" x="20" y="58" width="6" height="6" rx="1.5" transform="rotate(-18 23 61)" />
		{:else}
			<circle class="burst b1" cx="24" cy="28" r="4" />
			<circle class="burst b2" cx="96" cy="22" r="3" />
			<circle class="burst b3" cx="92" cy="92" r="3.5" />
		{/if}
	</svg>
</div>

<style>
	.celebrate-illus {
		position: relative;
		display: flex;
		justify-content: center;
	}

	.celebrate-illus.heavy {
		padding-top: 0.35rem;
	}

	.party-emoji {
		position: absolute;
		top: -0.15rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 1.35rem;
		line-height: 1;
		z-index: 2;
		animation: party-emoji-pop 0.65s 0.2s cubic-bezier(0.34, 1.35, 0.64, 1) both;
	}

	svg {
		width: 5.5rem;
		height: 5.5rem;
		overflow: visible;
	}

	.heavy svg {
		width: 6.25rem;
		height: 6.25rem;
	}

	.glow {
		fill: color-mix(in srgb, var(--color-success) 14%, var(--color-surface-muted));
		transform-origin: 60px 60px;
		animation: glow-in 0.5s ease-out both;
	}

	.glow.glow-pulse {
		animation:
			glow-in 0.5s ease-out both,
			glow-pulse 2.2s 0.55s ease-in-out infinite;
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

	.party-horn {
		opacity: 0;
		transform-origin: center;
	}

	.horn-left {
		animation: horn-pop 0.5s 0.3s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
	}

	.horn-right {
		animation: horn-pop 0.5s 0.38s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
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

	.heavy-burst {
		animation-duration: 1.1s;
	}

	.heavy .b1 {
		animation: heavy-burst 1.15s 0.2s ease-out infinite;
	}

	.heavy .b2 {
		fill: var(--color-success);
		animation: heavy-burst 1.2s 0.32s ease-out infinite;
	}

	.heavy .b3 {
		fill: color-mix(in srgb, var(--color-warning) 75%, var(--color-primary));
		animation: heavy-burst 1.05s 0.44s ease-out infinite;
	}

	.heavy .b4 {
		fill: var(--color-success);
		animation: heavy-burst 1.25s 0.56s ease-out infinite;
	}

	.heavy .b5 {
		fill: var(--color-primary);
		animation: heavy-burst 1.1s 0.68s ease-out infinite;
	}

	.heavy .b6 {
		fill: color-mix(in srgb, var(--color-warning) 70%, var(--color-primary));
		animation: heavy-burst 1.18s 0.8s ease-out infinite;
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

	@keyframes glow-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.06);
			opacity: 0.88;
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

	@keyframes heavy-burst {
		0% {
			opacity: 0;
			transform: translateY(6px) scale(0.55) rotate(0deg);
		}
		25% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-18px) scale(1.15) rotate(18deg);
		}
	}

	@keyframes party-emoji-pop {
		from {
			opacity: 0;
			transform: translateX(-50%) scale(0.4) rotate(-12deg);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) scale(1) rotate(0deg);
		}
	}

	@keyframes horn-pop {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.party-emoji,
		.glow,
		.ring,
		.check,
		.burst,
		.party-horn {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
			transform: none;
		}

		.party-emoji {
			transform: translateX(-50%);
		}
	}
</style>
