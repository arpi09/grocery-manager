<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		body: string;
		illustration: Snippet;
		extra?: Snippet;
		actions: Snippet;
	}

	let { title, body, illustration, extra, actions }: Props = $props();
</script>

<div class="activation-screen motion-enter">
	<div class="illus-slot">
		{@render illustration()}
	</div>

	<div class="copy-block">
		<h2 class="screen-title">{title}</h2>
		<p class="screen-body">{body}</p>
		{#if extra}
			<div class="screen-extra">
				{@render extra()}
			</div>
		{/if}
	</div>

	<div class="action-block">
		{@render actions()}
	</div>
</div>

<style>
	.activation-screen {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		flex: 1;
		min-height: 0;
	}

	.illus-slot {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 9rem;
		padding-block: var(--space-sm);
	}

	.copy-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		text-align: center;
		max-width: 22rem;
		margin-inline: auto;
	}

	.screen-title {
		margin: 0;
		font-size: clamp(1.5rem, 5vw, 1.75rem);
		line-height: 1.2;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.screen-body {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		white-space: pre-line;
	}

	.screen-extra {
		text-align: left;
	}

	.action-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-top: auto;
		padding-top: var(--space-md);
	}

	.motion-enter {
		animation: activation-enter 320ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	@keyframes activation-enter {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.motion-enter {
			animation: none;
		}
	}
</style>
