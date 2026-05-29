<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Label from '$lib/components/atoms/Label.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import BarcodeScanButton from '$lib/components/molecules/BarcodeScanButton.svelte';
	import BarcodeScannerModal from '$lib/components/organisms/BarcodeScannerModal.svelte';
	import ItemConsumptionActions from '$lib/components/molecules/ItemConsumptionActions.svelte';
	import { LOCATIONS, LOCATION_LABELS, type StorageLocation } from '$lib/domain/location';
	import type { BarcodeLookupResult } from '$lib/domain/barcode-product';
	import type { InventoryItem } from '$lib/domain/inventory-item';

	interface Props {
		item?: InventoryItem;
		defaultLocation?: StorageLocation;
		errors?: Record<string, string[]>;
	}

	let { item, defaultLocation = 'fridge', errors = {} }: Props = $props();

	const isEdit = !!item;

	let name = $state(item?.name ?? '');
	let quantity = $state(item?.quantity ?? '1');
	let unit = $state(item?.unit ?? '');
	let notes = $state(item?.notes ?? '');
	let location = $state<StorageLocation>(item?.location ?? defaultLocation);

	let scannerOpen = $state(false);
	let lookupLoading = $state(false);
	let imageLookupLoading = $state(false);
	let scanMessage = $state<string | null>(null);
	let scanMethod = $state<'barcode' | 'photo'>('barcode');
	let photoInputEl = $state<HTMLInputElement | null>(null);

	onMount(() => {
		name = item?.name ?? '';
		quantity = item?.quantity ?? '1';
		unit = item?.unit ?? '';
		notes = item?.notes ?? '';
		location = item?.location ?? defaultLocation;
	});

	function openScanner() {
		scanMessage = null;
		scannerOpen = true;
	}

	function closeScanner() {
		scannerOpen = false;
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
						? 'Ogiltig streckkod. Ange minst 8 siffror.'
						: 'Kunde inte slå upp streckkoden. Försök igen eller fyll i manuellt.';
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
				? `Hittade ${product.name} (${product.barcode}).`
				: `Okänd streckkod – fyllde i "${product.name}". Justera vid behov.`;
		} catch {
			scanMessage = 'Nätverksfel vid uppslagning av produkten.';
		} finally {
			lookupLoading = false;
		}
	}

	function triggerPhotoPicker() {
		scanMessage = null;
		photoInputEl?.click();
	}

	async function handlePhotoSelected(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

		imageLookupLoading = true;
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
				scanMessage = data.error ?? 'Could not read the product from this photo.';
				return;
			}

			name = data.product.name;
			quantity = data.product.quantity || '1';
			unit = data.product.unit ?? '';
			if (data.product.notes) {
				notes = notes ? `${notes}\n${data.product.notes}` : data.product.notes;
			}

			const confidenceLabel =
				data.product.confidence === 'high'
					? 'high'
					: data.product.confidence === 'medium'
						? 'medium'
						: 'low';
			scanMessage = `Filled fields from product photo (confidence: ${confidenceLabel}). Please review before saving.`;
		} catch {
			scanMessage = 'Network error while analyzing the photo.';
		} finally {
			imageLookupLoading = false;
			input.value = '';
		}
	}
</script>

<form method="POST" action={isEdit ? '?/save' : '?/create'} class="form">
	{#if !isEdit}
		<div class="barcode-row">
			<div class="scan-title-row">
				<p class="scan-title">Choose scan mode</p>
				<span class="ai-badge">NEW: ChatGPT Vision</span>
			</div>
			<div class="scan-method-tabs" role="tablist" aria-label="Scan method">
				<button
					type="button"
					class="scan-tab {scanMethod === 'barcode' ? 'active' : ''}"
					onclick={() => (scanMethod = 'barcode')}
				>
					Barcode
				</button>
				<button
					type="button"
					class="scan-tab scan-tab-ai {scanMethod === 'photo' ? 'active' : ''}"
					onclick={() => (scanMethod = 'photo')}
				>
					ChatGPT AI Scan
				</button>
			</div>

			{#if scanMethod === 'barcode'}
				<BarcodeScanButton onclick={openScanner} loading={lookupLoading} />
			{:else}
				<Button
					type="button"
					variant="primary"
					class="scan-btn ai-scan-btn"
					disabled={imageLookupLoading}
					onclick={triggerPhotoPicker}
				>
					{imageLookupLoading ? 'Analyzing with ChatGPT AI...' : '📸 Scan with ChatGPT AI'}
				</Button>
				<input
					bind:this={photoInputEl}
					type="file"
					accept="image/*"
					capture="environment"
					class="sr-input"
					onchange={handlePhotoSelected}
				/>
				<p class="scan-help">
					Take a clear photo of the product label and ChatGPT Vision will prefill item details for
					you.
				</p>
			{/if}
		</div>
		{#if scanMessage}
			<p class="barcode-msg" role="status">{scanMessage}</p>
		{/if}
	{/if}

	<div class="field name-field">
		<Label for="name">Name</Label>
		<Input id="name" name="name" bind:value={name} error={!!errors.name} required />
		{#if errors.name}
			<p class="error">{errors.name[0]}</p>
		{/if}
	</div>

	<div class="field">
		<Label for="location">Location</Label>
		<select id="location" name="location" class="select" bind:value={location}>
			{#each LOCATIONS as loc}
				<option value={loc}>{LOCATION_LABELS[loc]}</option>
			{/each}
		</select>
		{#if errors.location}
			<p class="error">{errors.location[0]}</p>
		{/if}
	</div>

	<div class="row">
		<div class="field">
			<Label for="quantity">Quantity</Label>
			<Input
				id="quantity"
				name="quantity"
				type="text"
				inputmode="decimal"
				bind:value={quantity}
				error={!!errors.quantity}
				required
			/>
			{#if errors.quantity}
				<p class="error">{errors.quantity[0]}</p>
			{/if}
		</div>
		<div class="field">
			<Label for="unit">Unit</Label>
			<Input id="unit" name="unit" placeholder="pcs, g, L…" bind:value={unit} />
		</div>
	</div>

	<div class="field">
		<Label for="expiresOn">Expires on (optional)</Label>
		<Input id="expiresOn" name="expiresOn" type="date" value={item?.expiresOn ?? ''} />
	</div>

	<div class="field">
		<Label for="notes">Notes (optional)</Label>
		<textarea id="notes" name="notes" class="textarea" rows="3" bind:value={notes}></textarea>
	</div>

	{#if isEdit && item}
		<section class="consumption-section" aria-label="Förbrukning">
			<h2 class="section-title">Förbrukning</h2>
			<p class="section-help">Markera varan som förbrukad eller kastad när den är slut.</p>
			<ItemConsumptionActions itemId={item.id} />
		</section>
	{/if}

	<div class="actions">
		<Button type="submit" fullWidth>{isEdit ? 'Save changes' : 'Add item'}</Button>
		{#if isEdit}
			<Button type="submit" formaction="?/delete" variant="danger" fullWidth>Delete item</Button>
		{/if}
	</div>
</form>

{#if scannerOpen}
	<BarcodeScannerModal open={scannerOpen} onScan={handleBarcodeScanned} onClose={closeScanner} />
{/if}

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.barcode-row {
		margin-bottom: var(--space-sm);
		display: grid;
		gap: var(--space-sm);
	}

	.scan-method-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.scan-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.scan-title {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.ai-badge {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		background: linear-gradient(90deg, #6b7fd4 0%, #3d6b4f 100%);
		color: #fff;
	}

	.scan-tab {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.scan-tab.active {
		background: var(--color-surface-muted);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.scan-tab-ai {
		position: relative;
		overflow: hidden;
	}

	.scan-tab-ai::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(110deg, rgba(107, 127, 212, 0.15) 0%, rgba(61, 107, 79, 0.15) 100%);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.scan-tab-ai:hover::before,
	.scan-tab-ai.active::before {
		opacity: 1;
	}

	.barcode-row :global(.tooltip-wrap),
	.barcode-row :global(.scan-btn) {
		width: 100%;
	}

	.barcode-msg {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.scan-help {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	:global(.ai-scan-btn) {
		background: linear-gradient(100deg, #6b7fd4 0%, #3d6b4f 100%);
		border: none;
	}

	:global(.ai-scan-btn:hover:not(:disabled)) {
		filter: brightness(1.06);
	}

	.sr-input {
		display: none;
	}

	.field {
		margin-bottom: var(--space-md);
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	.select,
	.textarea {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
	}

	.error {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-danger);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	.consumption-section {
		margin: var(--space-md) 0;
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.section-title {
		margin: 0 0 var(--space-xs);
		font-size: 0.95rem;
		font-weight: 700;
	}

	.section-help {
		margin: 0 0 var(--space-sm);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
