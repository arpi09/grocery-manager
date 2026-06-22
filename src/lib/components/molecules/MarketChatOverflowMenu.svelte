<script lang="ts">
	import MarketReportModal from '$lib/components/molecules/MarketReportModal.svelte';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		threadId: string;
		disabled?: boolean;
		onThreadClosed?: () => void;
	}

	let { threadId, disabled = false, onThreadClosed }: Props = $props();

	let menuOpen = $state(false);
	let reportModalOpen = $state(false);
	let actionLoading = $state(false);

	function closeMenu() {
		menuOpen = false;
	}

	async function blockCounterpart() {
		closeMenu();
		actionLoading = true;
		try {
			const response = await fetch(`/api/market/chat/${threadId}/block`, { method: 'POST' });
			if (!response.ok) {
				showClientToast(t('marketV03.blockFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('marketV03.blockSuccess'), { variant: 'success' });
		} catch {
			showClientToast(t('marketV03.blockFailed'), { variant: 'error' });
		} finally {
			actionLoading = false;
		}
	}

	async function cancelRequest() {
		closeMenu();
		actionLoading = true;
		try {
			const response = await fetch(`/api/market/chat/${threadId}/cancel`, { method: 'POST' });
			if (!response.ok) {
				showClientToast(t('marketV03.cancelRequestFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('marketV03.cancelRequestSuccess'), { variant: 'success' });
			onThreadClosed?.();
		} catch {
			showClientToast(t('marketV03.cancelRequestFailed'), { variant: 'error' });
		} finally {
			actionLoading = false;
		}
	}

	function openReportModal() {
		closeMenu();
		reportModalOpen = true;
	}

	function handleReported() {
		onThreadClosed?.();
	}

	$effect(() => {
		if (!menuOpen) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			if (!target.closest('[data-market-overflow-menu]')) {
				closeMenu();
			}
		}

		const id = window.setTimeout(() => {
			window.addEventListener('pointerdown', handlePointerDown);
		}, 0);

		return () => {
			window.clearTimeout(id);
			window.removeEventListener('pointerdown', handlePointerDown);
		};
	});
</script>

<div class="overflow-wrap" data-market-overflow-menu>
	<button
		type="button"
		class="overflow-trigger"
		aria-expanded={menuOpen}
		aria-haspopup="menu"
		aria-label={t('marketV03.overflowMenuAria')}
		disabled={disabled || actionLoading}
		data-testid="market-chat-overflow-trigger"
		onclick={() => (menuOpen = !menuOpen)}
	>
		⋮
	</button>

	{#if menuOpen}
		<div class="overflow-panel" role="menu">
			<button
				type="button"
				class="overflow-item"
				role="menuitem"
				data-testid="market-chat-overflow-report"
				onclick={openReportModal}
			>
				{t('marketV03.overflowReport')}
			</button>
			<button
				type="button"
				class="overflow-item"
				role="menuitem"
				data-testid="market-chat-overflow-block"
				onclick={() => void blockCounterpart()}
			>
				{t('marketV03.overflowBlock')}
			</button>
			<button
				type="button"
				class="overflow-item overflow-item-danger"
				role="menuitem"
				data-testid="market-chat-overflow-cancel"
				onclick={() => void cancelRequest()}
			>
				{t('marketV03.overflowCancelRequest')}
			</button>
		</div>
	{/if}
</div>

<MarketReportModal
	open={reportModalOpen}
	{threadId}
	onClose={() => {
		reportModalOpen = false;
	}}
	onReported={handleReported}
/>

<style>
	.overflow-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.overflow-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.overflow-trigger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.overflow-panel {
		position: absolute;
		top: calc(100% + var(--space-2xs));
		right: 0;
		z-index: 20;
		min-width: 12rem;
		padding: var(--space-2xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-md, 0 4px 16px rgb(0 0 0 / 12%));
		display: grid;
		gap: var(--space-2xs);
	}

	.overflow-item {
		display: block;
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		font: inherit;
		font-size: 0.9375rem;
		text-align: left;
		cursor: pointer;
	}

	.overflow-item:hover,
	.overflow-item:focus-visible {
		background: var(--color-surface-muted);
	}

	.overflow-item-danger {
		color: var(--color-danger);
	}
</style>
