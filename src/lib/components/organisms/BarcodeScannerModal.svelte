<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import BarcodeScanner from '$lib/components/molecules/BarcodeScanner.svelte';

	interface Props {
		open: boolean;
		onScan: (barcode: string) => void;
		onClose: () => void;
	}

	let { open, onScan, onClose }: Props = $props();
</script>

{#if open}
	<div class="overlay" role="dialog" aria-modal="true" aria-label="Skanna streckkod">
		<div class="panel">
			<header>
				<h2>Skanna streckkod</h2>
				<button type="button" class="close" onclick={onClose} aria-label="Stäng">×</button>
			</header>

			<p class="hint">Rikta kameran mot produktens streckkod.</p>

			<BarcodeScanner active={open} {onScan} />

			<Button type="button" variant="secondary" fullWidth onclick={onClose}>Avbryt</Button>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(31, 42, 36, 0.65);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: var(--space-md);
	}

	.panel {
		width: 100%;
		max-width: 400px;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.close {
		border: none;
		background: transparent;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0.25rem;
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
