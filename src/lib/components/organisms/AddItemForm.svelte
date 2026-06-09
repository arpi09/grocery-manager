<script lang="ts">
	import { onMount } from 'svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Label from '$lib/components/atoms/Label.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import BarcodeScanButton from '$lib/components/molecules/BarcodeScanButton.svelte';
	import BarcodeScannerModal from '$lib/components/organisms/BarcodeScannerModal.svelte';
	import ProductPhotoScanPicker from '$lib/components/molecules/ProductPhotoScanPicker.svelte';
	import UnitSelect from '$lib/components/molecules/UnitSelect.svelte';
	import { guessShelfLife } from '$lib/domain/shelf-life';
	import { normalizeUnitInput, suggestUnitForName } from '$lib/domain/inventory-units';
	import ConsumeItemPanel from '$lib/components/molecules/ConsumeItemPanel.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';

	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import type { BarcodeLookupResult } from '$lib/domain/barcode-product';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { getFavoriteProduct } from '$lib/utils/favorite-products';

	interface Props {
		item?: InventoryItem;
		defaultLocation?: StorageLocation;
		returnTo?: string;
		errors?: Record<string, string[]>;
	}

	let { item, defaultLocation = 'fridge', returnTo, errors = {} }: Props = $props();

	const isEdit = !!item;

	let name = $state(item?.name ?? '');
	let quantity = $state(item?.quantity ?? '1');
	let unit = $state(item?.unit ?? '');
	let notes = $state(item?.notes ?? '');
	let expiresOn = $state(item?.expiresOn ?? '');
	let expiresOnAiInferred = $state(item?.expiresOnSource === 'ai_inferred');
	let location = $state<StorageLocation>(item?.location ?? defaultLocation);

	let scannerOpen = $state(false);
	let lookupLoading = $state(false);

	let scanMessage = $state<string | null>(null);
	let scanMethod = $state<'barcode' | 'photo'>('barcode');


	onMount(() => {
		name = item?.name ?? '';
		quantity = item?.quantity ?? '1';
		unit = item?.unit ?? '';
		notes = item?.notes ?? '';
		expiresOn = item?.expiresOn ?? '';
		expiresOnAiInferred = item?.expiresOnSource === 'ai_inferred';
		location = item?.location ?? defaultLocation;
	});

	function applyShelfLifeGuess() {
		const inferred = guessShelfLife(name, location);
		if (inferred) {
			expiresOn = inferred.expiresOn;
			expiresOnAiInferred = true;
		}
	}

	function handleNameOrLocationChange() {
		if (!isEdit && !expiresOn) {
			applyShelfLifeGuess();
		}
	}

	function openScanner() {
		scanMessage = null;
		scannerOpen = true;
	}

	function closeScanner() {
		scannerOpen = false;
	}

	async function handleBarcodeScanned(code: string) {
		scannerOpen = false;
		scanMessage = null;

		const cached = getFavoriteProduct(code);
		if (cached) {
			name = cached.name;
			quantity = cached.quantity;
			unit = cached.unit ?? '';
			if (cached.notes) {
				notes = notes ? `${notes}\n${cached.notes}` : cached.notes;
			}
			scanMessage = t('item.foundProduct', { name: cached.name, barcode: cached.barcode });
			return;
		}

		lookupLoading = true;

		try {
			const response = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
			const data = (await response.json()) as BarcodeLookupResult | { message?: string };

			if (!response.ok) {
				scanMessage =
					response.status === 400
						? t('item.invalidBarcode')
						: t('item.lookupFailed');
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
				? t('item.foundProduct', { name: product.name, barcode: product.barcode })
				: t('item.unknownBarcodeFilled', { name: product.name });
		} catch {
			scanMessage = t('item.lookupNetwork');
		} finally {
			lookupLoading = false;
		}
	}

	function handlePhotoProduct(product: {
		name: string;
		quantity: string;
		unit: string | null;
		expiresOn: string | null;
		notes: string | null;
	}) {
		name = product.name;
		quantity = product.quantity || '1';
		unit = normalizeUnitInput(product.unit) || suggestUnitForName(product.name, product.unit);
		if (product.expiresOn) {
			expiresOn = product.expiresOn;
		} else {
			const inferred = guessShelfLife(product.name, location);
			if (inferred) {
				expiresOn = inferred.expiresOn;
				expiresOnAiInferred = true;
			}
		}
		if (product.notes) {
			notes = notes ? `${notes}\n${product.notes}` : product.notes;
		}
	}
</script>

<form
	method="POST"
	action={isEdit ? '?/save' : '?/create'}
	class="form"
>
	{#if !isEdit && returnTo}
		<input type="hidden" name="returnTo" value={returnTo} />
	{/if}
	{#if !isEdit}
		<div class="barcode-row">
			<p class="scan-title">{t('item.howToFill')}</p>
			<div class="scan-method-tabs" role="radiogroup" aria-label={t('item.scanModeAria')}>
				<button
					type="button"
					role="radio"
					aria-checked={scanMethod === 'barcode'}
					class="scan-tab {scanMethod === 'barcode' ? 'active' : ''}"
					onclick={() => (scanMethod = 'barcode')}
				>
					{t('item.barcodeTab')}
				</button>
				<button
					type="button"
					role="radio"
					aria-checked={scanMethod === 'photo'}
					class="scan-tab {scanMethod === 'photo' ? 'active' : ''}"
					onclick={() => (scanMethod = 'photo')}
				>
					{t('item.photoTab')}
				</button>
			</div>

			{#if scanMethod === 'barcode'}
				<BarcodeScanButton onclick={openScanner} loading={lookupLoading} />
			{:else}
				<ProductPhotoScanPicker onProduct={handlePhotoProduct} />
			{/if}
		</div>
		{#if scanMessage}
			<p class="barcode-msg" role="status">{scanMessage}</p>
		{/if}
	{/if}

	<div class="field name-field">
		<Label for="name">{t('common.name')}</Label>
		<Input
			id="name"
			name="name"
			bind:value={name}
			error={!!errors.name}
			required
			onchange={handleNameOrLocationChange}
		/>
		{#if errors.name}
			<p class="error">{errors.name[0]}</p>
		{/if}
	</div>

	<div class="field">
		<Label for="location">{t('common.place')}</Label>
		<select
			id="location"
			name="location"
			class="select"
			bind:value={location}
			onchange={handleNameOrLocationChange}
		>
			{#each LOCATIONS as loc}
				<option value={loc}>{locationLabel(getLocale(), loc)}</option>
			{/each}
		</select>
		{#if errors.location}
			<p class="error">{errors.location[0]}</p>
		{/if}
	</div>

	<div class="row">
		<div class="field">
			<Label for="quantity">{t('common.quantity')}</Label>
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
			<UnitSelect id="unit" name="unit" bind:value={unit} productName={name} />
		</div>
	</div>

	<div class="field">
		<div class="expiry-label-row">
			<Label for="expiresOn">{t('item.bestBefore')}</Label>
			{#if expiresOnAiInferred && expiresOn}
				<Badge tone="default">{t('inventory.aiExpiryBadge')}</Badge>
			{/if}
		</div>
		<Input
			id="expiresOn"
			name="expiresOn"
			type="date"
			bind:value={expiresOn}
			onchange={() => {
				expiresOnAiInferred = false;
			}}
		/>
	</div>

	<div class="field">
		<Label for="notes">{t('item.notesOptional')}</Label>
		<textarea id="notes" name="notes" class="textarea" rows="3" bind:value={notes}></textarea>
	</div>


	<div class="actions">
		<Button type="submit" fullWidth>{isEdit ? t('item.saveChanges') : t('item.addSubmit')}</Button>
	</div>
</form>

{#if isEdit}
	<div class="secondary-actions">
		{#if item}
			<ConsumeItemPanel {item} action="?/markAsFinished" variant="form" />
		{/if}
		<DeleteConfirmButton
			tier={2}
			context="inventoryItem"
			copyOptions={{ itemName: name || item?.name }}
			action="?/delete"
			fullWidth
			label={t('item.deleteItem')}
			ariaLabel={t('item.deleteItemNamed', {
				name: name || item?.name || t('common.unknownProduct')
			})}
		/>
	</div>
{/if}

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

	.scan-title {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.scan-tab {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.75rem;
		min-height: var(--touch-target-min);
		font-weight: 600;
		cursor: pointer;
	}

	.scan-tab.active {
		background: var(--color-surface-muted);
		border-color: var(--color-primary);
		color: var(--color-primary);
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

	@media (max-width: 899px) {
		.select,
		.textarea,
		.barcode-row :global(input) {
			min-height: var(--touch-target-min);
		}
	}

	.expiry-label-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.expiry-prompt {
		margin-top: var(--space-sm);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.expiry-prompt p {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.expiry-prompt-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.error {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-danger);
	}

	.actions,
	.secondary-actions {
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
