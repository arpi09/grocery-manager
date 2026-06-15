<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		receiptHref: string;
		photoHref: string;
		barcodeHref: string;
		manualHref: string;
		onClose: () => void;
	}

	let { open, receiptHref, photoHref, barcodeHref, manualHref, onClose }: Props = $props();
</script>

<Modal
	{open}
	{onClose}
	variant="sheet"
	title={t('inventory.addSheet.title')}
	data-testid="inventory-add-sheet"
>
	<nav class="choices" aria-label={t('inventory.addSheet.title')}>
		<a class="choice-card" href={receiptHref} data-testid="inventory-add-receipt" onclick={onClose}>
			{t('inventory.addSheet.receipt')}
		</a>
		<a class="choice-card" href={photoHref} data-testid="inventory-add-photo" onclick={onClose}>
			{t('inventory.addSheet.photo')}
		</a>
		<a class="choice-card" href={barcodeHref} data-testid="inventory-add-barcode" onclick={onClose}>
			{t('inventory.addSheet.barcode')}
		</a>
		<a class="choice-card choice-card--ghost" href={manualHref} data-testid="inventory-add-manual" onclick={onClose}>
			{t('inventory.addSheet.manual')}
		</a>
	</nav>
	<div class="sheet-footer">
		<Button type="button" variant="ghost" fullWidth onclick={onClose}>{t('common.cancel')}</Button>
	</div>
</Modal>

<style>
	.choices {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.choice-card {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font-weight: 600;
		font-size: var(--font-size-body-sm);
		text-decoration: none;
		color: var(--color-text);
	}

	.choice-card:first-child {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-on-primary);
	}

	.choice-card--ghost {
		background: transparent;
		font-weight: 600;
		color: var(--color-primary);
	}

	.sheet-footer {
		margin-top: var(--space-md);
	}
</style>
