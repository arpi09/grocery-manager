<script lang="ts">
	import ModalCloseButton from '$lib/components/atoms/ModalCloseButton.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		titleId?: string;
		onClose?: () => void;
		closeLabel?: string;
		subtitle?: string;
		subtitleTestId?: string;
		actions?: Snippet;
	}

	let { title, titleId, onClose, closeLabel, subtitle, subtitleTestId, actions }: Props = $props();
</script>

<header class="modal-header">
	<div class="modal-header-text">
		{#if title}
			<h2 id={titleId}>{title}</h2>
		{/if}
		{#if subtitle}
			<p class="modal-header-sub" data-testid={subtitleTestId}>{subtitle}</p>
		{/if}
	</div>
	{#if actions}
		<div class="modal-header-actions">
			{@render actions()}
		</div>
	{/if}
	{#if onClose}
		<ModalCloseButton onclick={onClose} label={closeLabel} />
	{/if}
</header>

<style>
	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		flex-shrink: 0;
	}

	.modal-header-text {
		flex: 1;
		min-width: 0;
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	.modal-header-sub {
		margin: 0.2rem 0 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.modal-header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
</style>
