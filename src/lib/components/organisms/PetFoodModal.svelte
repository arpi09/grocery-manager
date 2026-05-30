<script lang="ts">
	import { t } from '$lib/i18n';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import BarcodeScannerModal from '$lib/components/organisms/BarcodeScannerModal.svelte';
	import type { BarcodeLookupResult } from '$lib/domain/barcode-product';

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
			const data = (await response.json()) as BarcodeLookupResult | { message?: string };

			if (!response.ok) {
				scanMessage =
					response.status === 400
						? t('item.invalidBarcode')
						: t('pets.lookupFailed');
				return;
			}

			const { found, product } = data as BarcodeLookupResult;
			name = product.name;
			quantity = product.quantity;
			unit = product.unit ?? '';
			if (product.notes) {
				notes = notes ? `${notes}\n${product.notes}` : product.notes;
			}
			scanMessage = found
				? t('pets.foundProduct', { name: product.name, barcode: product.barcode })
				: t('pets.unknownBarcode', { name: product.name });
		} catch {
			scanMessage = t('pets.lookupNetwork');
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
				scanMessage = data.error ?? t('pets.photoReadFailed');
				return;
			}

			name = data.product.name;
			quantity = data.product.quantity || '1';
			unit = data.product.unit ?? '';
			if (data.product.notes) {
				notes = notes ? `${notes}\n${data.product.notes}` : data.product.notes;
			}

			scanMessage = t('pets.photoFilled', { confidence: data.product.confidence });
		} catch {
			scanMessage = t('pets.photoNetworkError');
		} finally {
			lookupLoading = false;
			input.value = '';
		}
	}
</script>

<Modal {open} onClose={closeModal} variant="center" title={t('pets.modalTitle')} panelClass="pet-food-panel">
	<div class="scan-tabs">
		<button
			type="button"
			class:active={scanMode === 'barcode'}
			onclick={() => (scanMode = 'barcode')}
		>
			{t('pets.barcodeTab')}
		</button>
		<button type="button" class:active={scanMode === 'photo'} onclick={() => (scanMode = 'photo')}>
			{t('pets.photoTab')}
		</button>
	</div>

	{#if scanMode === 'barcode'}
		<Button type="button" variant="secondary" onclick={openScanner} disabled={lookupLoading} fullWidth>
			{lookupLoading ? t('common.lookup') : t('pets.scanBarcodeBtn')}
		</Button>
	{:else}
		<Button type="button" variant="primary" onclick={triggerPhotoPicker} disabled={lookupLoading} fullWidth>
			{lookupLoading ? t('pets.analyzing') : t('pets.scanPhotoBtn')}
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
			{t('pets.foodName')}
			<input name="name" bind:value={name} placeholder={t('pets.foodNamePlaceholder')} required />
		</label>
		<div class="row">
			<label>
				{t('common.quantity')}
				<input name="quantity" bind:value={quantity} inputmode="decimal" required />
			</label>
			<label>
				{t('common.unit')}
				<input name="unit" bind:value={unit} placeholder={t('item.unitPlaceholder')} />
			</label>
		</div>
		<label>
			{t('pets.forPetOptional')}
			<select name="petId" bind:value={petId}>
				<option value="">{t('pets.anyPet')}</option>
				{#each pets as pet}
					<option value={pet.id}>{pet.name}{pet.species ? ` (${pet.species})` : ''}</option>
				{/each}
			</select>
		</label>
		<label>
			{t('common.notes')} ({t('common.optional')})
			<textarea name="notes" rows="3" bind:value={notes}></textarea>
		</label>

		<div class="actions">
			<Button type="button" variant="secondary" onclick={closeModal}>{t('common.cancel')}</Button>
			<Button type="submit">{t('pets.savePetFood')}</Button>
		</div>
	</form>
</Modal>

<BarcodeScannerModal
	open={scannerOpen}
	nested
	onScan={handleBarcodeScanned}
	onClose={() => (scannerOpen = false)}
/>

<style>
	:global(.pet-food-panel) {
		width: min(560px, calc(100vw - 2 * var(--space-md)));
	}

	.scan-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.scan-tabs button {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.5rem;
		font-weight: 700;
		cursor: pointer;
		color: var(--color-text);
	}

	.scan-tabs button.active {
		border-color: var(--color-primary);
		color: var(--color-primary);
		background: var(--color-surface-muted);
	}

	.scan-msg {
		margin: 0 0 var(--space-sm);
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
		background: var(--color-surface);
		color: var(--color-text);
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
