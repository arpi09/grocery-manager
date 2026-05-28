<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import BarcodeScannerModal from '$lib/components/organisms/BarcodeScannerModal.svelte';
	import type { BarcodeProduct } from '$lib/domain/barcode-product';

	interface PetOption {
		id: string;
		name: string;
		species: string | null;
	}

	interface Props {
		open: boolean;
		onClose: () => void;
		pets: PetOption[];
		submitAction: string;
	}

	let { open, onClose, pets, submitAction }: Props = $props();

	let scanMode = $state<'barcode' | 'photo'>('barcode');
	let scannerOpen = $state(false);
	let lookupLoading = $state(false);
	let scanMessage = $state<string | null>(null);
	let photoInputEl = $state<HTMLInputElement | null>(null);

	let name = $state('');
	let quantity = $state('1');
	let unit = $state('');
	let notes = $state('');
	let petId = $state('');

	function resetForm() {
		scanMode = 'barcode';
		scannerOpen = false;
		lookupLoading = false;
		scanMessage = null;
		name = '';
		quantity = '1';
		unit = '';
		notes = '';
		petId = '';
	}

	function closeModal() {
		onClose();
		resetForm();
	}

	function openScanner() {
		scanMessage = null;
		scannerOpen = true;
	}

	function triggerPhotoPicker() {
		scanMessage = null;
		photoInputEl?.click();
	}

	async function handleBarcodeScanned(code: string) {
		scannerOpen = false;
		lookupLoading = true;
		scanMessage = null;

		try {
			const response = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
			if (!response.ok) {
				scanMessage =
					response.status === 404
						? 'Could not find this barcode. Enter details manually.'
						: 'Could not look up this barcode right now.';
				return;
			}

			const product = (await response.json()) as BarcodeProduct;
			name = product.name;
			quantity = product.quantity;
			unit = product.unit ?? '';
			if (product.notes) {
				notes = notes ? `${notes}\n${product.notes}` : product.notes;
			}
			scanMessage = `Filled from barcode ${product.barcode}.`;
		} catch {
			scanMessage = 'Network error while looking up barcode.';
		} finally {
			lookupLoading = false;
		}
	}

	async function handlePhotoSelected(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

		lookupLoading = true;
		scanMessage = null;

		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/product-from-image', {
				method: 'POST',
				body: formData
			});

			const data = (await response.json()) as {
				error?: string;
				product?: {
					name: string;
					quantity: string;
					unit: string | null;
					notes: string | null;
					confidence: 'high' | 'medium' | 'low';
				};
			};

			if (!response.ok || !data.product) {
				scanMessage = data.error ?? 'Could not read product from image.';
				return;
			}

			name = data.product.name;
			quantity = data.product.quantity || '1';
			unit = data.product.unit ?? '';
			if (data.product.notes) {
				notes = notes ? `${notes}\n${data.product.notes}` : data.product.notes;
			}

			scanMessage = `Filled from photo scan (${data.product.confidence} confidence).`;
		} catch {
			scanMessage = 'Network error while scanning image.';
		} finally {
			lookupLoading = false;
			input.value = '';
		}
	}
</script>

{#if open}
	<div class="overlay" role="dialog" aria-modal="true" aria-label="Add pet food">
		<div class="modal">
			<div class="head">
				<h2>Add pet food</h2>
				<button type="button" class="close" onclick={closeModal}>X</button>
			</div>

			<div class="scan-tabs">
				<button
					type="button"
					class:active={scanMode === 'barcode'}
					onclick={() => (scanMode = 'barcode')}
				>
					Barcode
				</button>
				<button
					type="button"
					class:active={scanMode === 'photo'}
					onclick={() => (scanMode = 'photo')}
				>
					ChatGPT Photo Scan
				</button>
			</div>

			{#if scanMode === 'barcode'}
				<Button type="button" variant="secondary" onclick={openScanner} disabled={lookupLoading} fullWidth>
					{lookupLoading ? 'Looking up...' : 'Scan pet food barcode'}
				</Button>
			{:else}
				<Button type="button" variant="primary" onclick={triggerPhotoPicker} disabled={lookupLoading} fullWidth>
					{lookupLoading ? 'Analyzing...' : 'Scan pet food with photo'}
				</Button>
				<input
					bind:this={photoInputEl}
					type="file"
					class="hidden-input"
					accept="image/*"
					capture="environment"
					onchange={handlePhotoSelected}
				/>
			{/if}

			{#if scanMessage}
				<p class="scan-msg">{scanMessage}</p>
			{/if}

			<form method="POST" action={submitAction} class="form">
				<label>
					Food name
					<input name="name" bind:value={name} placeholder="e.g. Grain-free cat food" required />
				</label>
				<div class="row">
					<label>
						Quantity
						<input name="quantity" bind:value={quantity} inputmode="decimal" required />
					</label>
					<label>
						Unit
						<input name="unit" bind:value={unit} placeholder="kg, g, pcs..." />
					</label>
				</div>
				<label>
					For pet (optional)
					<select name="petId" bind:value={petId}>
						<option value="">Any pet</option>
						{#each pets as pet}
							<option value={pet.id}>{pet.name}{pet.species ? ` (${pet.species})` : ''}</option>
						{/each}
					</select>
				</label>
				<label>
					Notes (optional)
					<textarea name="notes" rows="3" bind:value={notes}></textarea>
				</label>

				<div class="actions">
					<Button type="button" variant="secondary" onclick={closeModal}>Cancel</Button>
					<Button type="submit">Save pet food</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if scannerOpen}
	<BarcodeScannerModal open={scannerOpen} onScan={handleBarcodeScanned} onClose={() => (scannerOpen = false)} />
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(31, 42, 36, 0.45);
		display: grid;
		place-items: center;
		padding: var(--space-md);
		z-index: 60;
	}

	.modal {
		width: min(560px, 100%);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.head h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.close {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		width: 2rem;
		height: 2rem;
		cursor: pointer;
	}

	.scan-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.scan-tabs button {
		border: 1px solid var(--color-border);
		background: #fff;
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.5rem;
		font-weight: 700;
		cursor: pointer;
	}

	.scan-tabs button.active {
		border-color: var(--color-primary);
		color: var(--color-primary);
		background: var(--color-surface-muted);
	}

	.scan-msg {
		margin: 0;
		padding: 0.45rem 0.6rem;
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	input,
	select,
	textarea {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: #fff;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.hidden-input {
		display: none;
	}
</style>
