<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ConsumeItemPanel from '$lib/components/molecules/ConsumeItemPanel.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { TOAST_UNDO_DURATION_MS } from '$lib/utils/action-toast';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		item: InventoryItem | null;
		onClose: () => void;
		action?: string;
	}

	let { open, item, onClose, action = '/inventory?/consumeItem' }: Props = $props();

	/* Trust contract: the consume mutation gets a visible receipt with 8s Ångra.
	 * The snapshot is taken from the pre-consume item; ?/undoConsume restores quantity. */
	let undoPayload = $state<{ id: string; name: string; quantity: string } | null>(null);
	let undoSubmitting = $state(false);

	const undoAction = $derived(action.replace('?/consumeItem', '?/undoConsume'));

	function handleConsumeSuccess() {
		if (item) {
			undoPayload = { id: item.id, name: item.name, quantity: item.quantity };
		}
		void invalidateAll();
	}

	function dismissUndo() {
		undoPayload = null;
	}

	async function undoConsume() {
		if (!undoPayload || undoSubmitting) return;
		undoSubmitting = true;
		const formData = new FormData();
		formData.set('itemId', undoPayload.id);
		formData.set('quantity', undoPayload.quantity);
		try {
			const response = await fetch(undoAction, { method: 'POST', body: formData });
			if (response.ok) {
				undoPayload = null;
				await invalidateAll();
			}
		} finally {
			undoSubmitting = false;
		}
	}
</script>

{#if item}
	<Modal
		{open}
		{onClose}
		variant="sheet"
		title={t('pantry.v2.tile.consumeSheetTitle', { name: item.name })}
		data-testid="inventory-consume-sheet"
	>
		<ConsumeItemPanel
			{item}
			{action}
			variant="form"
			{onClose}
			onSuccess={handleConsumeSuccess}
		/>
	</Modal>
{/if}

{#if undoPayload}
	<div class="undo-toast-wrap" data-testid="consume-undo">
		<Toast
			message={t('consume.undoToastNamed', { name: undoPayload.name })}
			visible={true}
			variant="success"
			size="action"
			portal={false}
			durationMs={TOAST_UNDO_DURATION_MS}
			tapToDismiss={true}
			onDismiss={dismissUndo}
		/>
		<button
			type="button"
			class="undo-btn"
			disabled={undoSubmitting}
			onclick={() => void undoConsume()}
			data-testid="consume-undo-btn"
			aria-label={t('common.undo')}
		>
			{t('common.undo')}
		</button>
	</div>
{/if}

<style>
	.undo-toast-wrap {
		position: fixed;
		left: 50%;
		bottom: calc(var(--content-bottom-safe) + var(--space-sm));
		transform: translateX(-50%);
		z-index: var(--z-toast);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		max-width: calc(100vw - 2 * var(--page-padding-x));
	}

	.undo-btn {
		flex-shrink: 0;
		min-height: 2.75rem;
		padding: 0 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-primary);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.undo-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.undo-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
