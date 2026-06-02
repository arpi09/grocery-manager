<script lang="ts">
	interface Props {
		active?: boolean;
	}

	let { active = false }: Props = $props();
</script>

{#if active}
	<div class="celebration-burst" aria-hidden="true">
		{#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
			<span class="particle" style="--i: {i}"></span>
		{/each}
	</div>
{/if}

<style>
	.celebration-burst {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.particle {
		position: absolute;
		left: 50%;
		top: 45%;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 2px;
		background: var(--color-primary);
		opacity: 0;
		animation: confetti-burst 0.9s ease-out forwards;
		animation-delay: calc(var(--i) * 35ms);
		transform: rotate(calc(var(--i) * 30deg)) translateY(0);
	}

	.particle:nth-child(3n) {
		background: var(--color-accent);
		width: 0.3rem;
		height: 0.45rem;
	}

	.particle:nth-child(5n) {
		background: color-mix(in srgb, var(--color-primary) 70%, #fff);
		border-radius: 999px;
	}

	@keyframes confetti-burst {
		0% {
			opacity: 1;
			transform: rotate(calc(var(--i) * 30deg)) translateY(0) scale(1);
		}
		100% {
			opacity: 0;
			transform: rotate(calc(var(--i) * 30deg)) translateY(-2.5rem) scale(0.4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.celebration-burst {
			display: none;
		}
	}
</style>
