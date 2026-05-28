<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		tip?: string;
		showTip?: boolean;
		children: Snippet;
	}

	let { tip = '', showTip = false, children }: Props = $props();
</script>

<span class="tooltip-wrap" class:active={showTip && !!tip}>
	{@render children()}
	{#if showTip && tip}
		<span class="tooltip" role="tooltip">{tip}</span>
	{/if}
</span>

<style>
	.tooltip-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.tooltip {
		display: none;
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: 240px;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-text);
		color: var(--color-surface);
		font-size: 0.8rem;
		font-weight: 500;
		line-height: 1.4;
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
		z-index: 20;
		pointer-events: none;
		text-align: center;
	}

	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: var(--color-text);
	}

	.tooltip-wrap.active:hover .tooltip,
	.tooltip-wrap.active:focus-within .tooltip {
		display: block;
	}
</style>
