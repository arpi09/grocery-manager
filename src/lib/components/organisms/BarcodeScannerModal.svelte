<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import BarcodeScanner from '$lib/components/molecules/BarcodeScanner.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';

	interface Props {
		open: boolean;
		onScan: (barcode: string) => void;
		onClose: () => void;
		nested?: boolean;
	}

	let { open, onScan, onClose, nested = false }: Props = $props();
</script>

<Modal
	{open}
	onClose={onClose}
	variant="sheet"
	{nested}
	title="Skanna streckkod"
	panelClass="barcode-scanner-panel"
	bodyClass="barcode-scanner-body"
>
	<p class="hint">Rikta kameran mot produktens streckkod.</p>

	<BarcodeScanner active={open} {onScan} />

	<Button type="button" variant="secondary" fullWidth onclick={onClose}>Avbryt</Button>
</Modal>

<style>
	:global(.barcode-scanner-panel) {
		width: min(400px, calc(100vw - 2 * var(--space-md)));
	}

	:global(.barcode-scanner-body) {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
