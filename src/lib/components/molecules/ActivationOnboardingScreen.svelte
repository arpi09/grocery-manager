<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		body: string;
		illustration: Snippet;
		extra?: Snippet;
		/** Compact: shrink the illustration stage when the extra block needs the space (fill chips). */
		compact?: boolean;
	}

	let { title, body, illustration, extra, compact = false }: Props = $props();
</script>

<div class="activation-screen" class:compact>
	<div class="halo" aria-hidden="true"></div>

	<div class="illus-stage motion-illus">
		{@render illustration()}
	</div>

	<div class="copy-block">
		<h2 class="screen-title motion-stagger">{title}</h2>
		<p class="screen-body motion-stagger">{body}</p>
		{#if extra}
			<div class="screen-extra motion-stagger">
				{@render extra()}
			</div>
		{/if}
	</div>
</div>

<style>
	.activation-screen {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-lg);
		flex: 1;
		min-height: 0;
	}

	.halo {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			110% 70% at 50% 18%,
			color-mix(in srgb, var(--color-primary) 9%, transparent),
			transparent 62%
		);
		pointer-events: none;
	}

	.illus-stage {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		min-height: 9rem;
		max-height: 14rem;
		padding-block: var(--space-xs);
		overflow: hidden;
	}

	.illus-stage :global(svg) {
		max-height: 100%;
		width: auto;
		height: 100%;
	}

	.compact .illus-stage {
		flex: 0 0 auto;
		min-height: 4.5rem;
		max-height: 6rem;
	}

	.compact {
		gap: var(--space-md);
	}

	.compact .copy-block {
		flex: 1;
		min-height: 0;
	}

	.compact .screen-extra {
		min-height: 0;
		overflow-y: auto;
	}

	@media (min-width: 768px) {
		.illus-stage {
			min-height: 11rem;
			max-height: 16rem;
			padding-block: var(--space-sm);
		}
	}

	.copy-block {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		text-align: center;
		max-width: 22rem;
		margin-inline: auto;
		width: 100%;
	}

	.screen-title {
		margin: 0;
		font-size: clamp(1.375rem, 5vw, 1.875rem);
		line-height: 1.2;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.screen-body {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		white-space: pre-line;
	}

	.screen-extra {
		text-align: left;
	}

	.motion-illus {
		animation: activation-enter 320ms cubic-bezier(0.33, 1, 0.68, 1) 120ms both;
	}

	.motion-stagger {
		animation: activation-enter 320ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	.screen-title.motion-stagger {
		animation-delay: 200ms;
	}

	.screen-body.motion-stagger {
		animation-delay: 260ms;
	}

	.screen-extra.motion-stagger {
		animation-delay: 320ms;
	}

	@keyframes activation-enter {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.motion-illus,
		.motion-stagger {
			animation: none;
		}
	}
</style>
