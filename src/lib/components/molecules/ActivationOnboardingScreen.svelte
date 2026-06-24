<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		body: string;
		illustration: Snippet;
		extra?: Snippet;
	}

	let { title, body, illustration, extra }: Props = $props();
</script>

<div class="activation-screen motion-enter">
	<div class="illus-slot">
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
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		flex: 1;
		min-height: 0;
	}

	.illus-slot {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 3.5rem;
		max-height: 4.5rem;
		padding-block: var(--space-xs);
		flex-shrink: 0;
		overflow: hidden;
	}

	.illus-slot :global(svg) {
		max-height: 4.5rem;
		width: auto;
		height: auto;
	}

	@media (min-width: 768px) {
		.illus-slot {
			min-height: 5rem;
			max-height: 6.5rem;
			padding-block: var(--space-sm);
		}

		.illus-slot :global(svg) {
			max-height: 6.5rem;
		}
	}

	.copy-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		text-align: center;
		max-width: 22rem;
		margin-inline: auto;
	}

	.screen-title {
		margin: 0;
		font-size: clamp(1.25rem, 4.5vw, 1.75rem);
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

	.motion-enter {
		animation: activation-enter 320ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	.motion-stagger {
		animation: activation-enter 320ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	.screen-title.motion-stagger {
		animation-delay: 40ms;
	}

	.screen-body.motion-stagger {
		animation-delay: 80ms;
	}

	.screen-extra.motion-stagger {
		animation-delay: 120ms;
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
		.motion-enter,
		.motion-stagger {
			animation: none;
		}
	}
</style>
