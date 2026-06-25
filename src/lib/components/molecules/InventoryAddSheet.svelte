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
		<a
			class="choice-card choice-card--primary"
			href={photoHref}
			data-testid="inventory-add-photo"
			onclick={onClose}
		>
			{t('inventory.addSheet.photo')}
		</a>
		<details class="other-ways">
			<summary>{t('inventory.addSheet.otherWays')}</summary>
			<div class="other-links">
				<a class="text-action" href={receiptHref} data-testid="inventory-add-receipt" onclick={onClose}>
					{t('inventory.addSheet.receipt')}
				</a>
				<a class="text-action" href={barcodeHref} data-testid="inventory-add-barcode" onclick={onClose}>
					{t('inventory.addSheet.barcode')}
				</a>
				<a class="text-action" href={manualHref} data-testid="inventory-add-manual" onclick={onClose}>
					{t('inventory.addSheet.manual')}
				</a>
			</div>
		</details>
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

	.choice-card--primary {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-on-primary);
	}

	.other-ways {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.other-ways > summary {
		display: flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	.other-ways > summary::-webkit-details-marker {
		display: none;
	}

	.other-links {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: 0 var(--space-md) var(--space-md);
	}

	.text-action {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.25rem 0;
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.sheet-footer {
		margin-top: var(--space-md);
	}
</style>
