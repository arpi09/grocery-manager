<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		message: string;
		visible?: boolean;
		durationMs?: number;
		onDismiss?: () => void;
	}

	let { message, visible = true, durationMs = 4500, onDismiss }: Props = $props();

	let show = $state(visible);

	$effect(() => {
		show = visible;
	});

	onMount(() => {
		if (!visible) {
			return;
		}
		const timer = window.setTimeout(() => {
			show = false;
			onDismiss?.();
		}, durationMs);
		return () => window.clearTimeout(timer);
	});
</script>

{#if show && message}
	<div class="toast" role="status" aria-live="polite">
		<p>{message}</p>
		{#if onDismiss}
			<button type="button" class="dismiss" onclick={() => { show = false; onDismiss?.(); }} aria-label="Stäng">
				×
			</button>
		{/if}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: calc(var(--space-lg) + env(safe-area-inset-bottom, 0px));
		transform: translateX(-50%);
		z-index: 120;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		max-width: min(420px, calc(100vw - 2 * var(--space-md)));
		padding: var(--space-sm) var(--space-md);
		background: var(--color-text);
		color: #fff;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
	}

	.toast p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.35;
	}

	.dismiss {
		border: none;
		background: transparent;
		color: inherit;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		padding: 0.15rem;
		flex-shrink: 0;
	}
</style>
