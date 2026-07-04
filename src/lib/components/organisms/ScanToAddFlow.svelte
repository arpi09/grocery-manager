<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Spinner from '$lib/components/atoms/Spinner.svelte';
	import BarcodeScanner from '$lib/components/molecules/BarcodeScanner.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import { bindEmbeddedScanSubmit } from '$lib/utils/scan-embedded-submit';
	import { page } from '$app/state';
	import { recordBarcodeActivation, shouldShowOnboarding } from '$lib/utils/onboarding';
	import { recordOnboardingScanSaveSync } from '$lib/utils/activation-scan-save';
	import type { BarcodeLookupResult } from '$lib/domain/barcode-product';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import {
		getFavoriteProduct,
		saveFavoriteProduct
	} from '$lib/utils/favorite-products';
	import { addRecentScan } from '$lib/utils/recent-scans';
	import { getScanQuickPicks, type ScanQuickPick } from '$lib/utils/scan-quick-picks';
	import { isDesktopDevice } from '$lib/utils/device';
	import { manualAddHref, scanModeHref } from '$lib/utils/scan-nav';
	import { getLastScanDefaults, saveLastScanDefaults, saveLastScanMode } from '$lib/utils/last-scan-defaults';

	interface Props {
		defaultLocation: StorageLocation;
		returnTo: string;
		cancelHref?: string;
		errors?: Record<string, string[]>;
		embedded?: boolean;
		formAction?: string;
		onItemSaved?: () => void;
	}

	let {
		defaultLocation,
		returnTo,
		cancelHref,
		errors = {},
		embedded = false,
		formAction,
		onItemSaved
	}: Props = $props();

	const saveFormAction = $derived(formAction ?? '?/create');

	type Step = 'scan' | 'confirm';

	let step = $state<Step>('scan');
	let scannerActive = $state(true);
	let cameraBlocked = $state(false);
	let lookupLoading = $state(false);
	let lookupError = $state<string | null>(null);
	let productFound = $state(true);
	let manualBarcode = $state('');
	let showMore = $state(false);
	let quickPicks = $state<ScanQuickPick[]>([]);
	let nameInputRef = $state<HTMLInputElement | null>(null);

	let barcode = $state('');
	let name = $state('');
	let quantity = $state('1');
	let unit = $state('');
	let notes = $state('');
	let location = $state<StorageLocation>(getLastScanDefaults()?.location ?? defaultLocation);
	let expiresOn = $state('');
	let saveSubmitting = $state(false);

	function applyProductFields(fields: {
		barcode: string;
		name: string;
		quantity: string;
		unit: string;
		notes: string;
		found: boolean;
	}) {
		barcode = fields.barcode;
		name = fields.name;
		quantity = fields.quantity;
		unit = fields.unit;
		notes = fields.notes;
		productFound = fields.found;
	}

	function refreshQuickPicks() {
		quickPicks = getScanQuickPicks();
	}

	$effect(() => {
		refreshQuickPicks();
		saveLastScanMode('barcode');
	});

	const manualAddLink = $derived(
		manualAddHref(returnTo, { location: defaultLocation })
	);

	/* Save-and-scan-next: non-embedded saves round-trip back to the camera (the server
	   redirect carries the toast params), so a whole bag of groceries is one flow.
	   The original return path stays in `from`; the Klar link exits the loop. */
	const saveReturnTo = $derived(embedded ? returnTo : scanModeHref('barcode', returnTo));

	function handleCameraError() {
		cameraBlocked = true;
		scannerActive = false;
	}

	function handleCameraReady() {
		cameraBlocked = false;
	}

	function resetToScan() {
		step = 'scan';
		scannerActive = true;
		cameraBlocked = false;
		lookupLoading = false;
		lookupError = null;
		barcode = '';
		manualBarcode = '';
		showMore = false;
	}

	async function applyLookupResult(result: BarcodeLookupResult) {
		const cached = getFavoriteProduct(result.product.barcode);
		applyProductFields({
			barcode: result.product.barcode,
			name: cached?.name ?? result.product.name,
			quantity: cached?.quantity ?? result.product.quantity,
			unit: cached?.unit ?? result.product.unit ?? '',
			notes: cached?.notes ?? result.product.notes ?? '',
			found: result.found || !!cached
		});
		addRecentScan({ barcode: result.product.barcode, name: name });
		refreshQuickPicks();
		scannerActive = false;
		showMore = false;
		step = 'confirm';
	}

	function applyCachedProduct(cached: NonNullable<ReturnType<typeof getFavoriteProduct>>) {
		applyProductFields({
			barcode: cached.barcode,
			name: cached.name,
			quantity: cached.quantity,
			unit: cached.unit ?? '',
			notes: cached.notes ?? '',
			found: true
		});
		addRecentScan({ barcode: cached.barcode, name: cached.name });
		refreshQuickPicks();
		scannerActive = false;
		showMore = false;
		step = 'confirm';
	}

	async function lookupBarcode(code: string) {
		const trimmed = code.trim();
		if (trimmed.length < 8) {
			lookupError = t('scanFlow.invalidBarcodeManual');
			return;
		}

		const cached = getFavoriteProduct(trimmed);
		if (cached) {
			lookupError = null;
			applyCachedProduct(cached);
			return;
		}

		lookupLoading = true;
		lookupError = null;
		scannerActive = false;

		try {
			const response = await fetch(`/api/barcode/${encodeURIComponent(trimmed)}`);
			const data = (await response.json()) as BarcodeLookupResult | { message?: string };

			if (!response.ok) {
				lookupError =
					'message' in data && data.message
						? data.message
						: t('scanFlow.lookupFailed');
				scannerActive = step === 'scan';
				return;
			}

			await applyLookupResult(data as BarcodeLookupResult);
		} catch {
			lookupError = t('scanFlow.networkError');
			scannerActive = step === 'scan';
		} finally {
			lookupLoading = false;
		}
	}

	function handleScan(code: string) {
		void lookupBarcode(code);
	}

	function handleManualLookup() {
		void lookupBarcode(manualBarcode);
	}

	function handleQuickPickSelect(pick: ScanQuickPick) {
		const cached = getFavoriteProduct(pick.barcode);
		if (cached) {
			applyCachedProduct(cached);
			return;
		}

		applyProductFields({
			barcode: pick.barcode,
			name: pick.name,
			quantity: pick.quantity,
			unit: pick.unit ?? '',
			notes: '',
			found: true
		});
		addRecentScan({ barcode: pick.barcode, name: pick.name });
		refreshQuickPicks();
		scannerActive = false;
		showMore = false;
		step = 'confirm';
	}

	function persistFavoriteProduct() {
		saveFavoriteProduct({
			barcode,
			name,
			quantity,
			unit: unit || null,
			notes: notes || null
		});
		refreshQuickPicks();
	}
</script>

{#if step === 'scan'}
	<section class="scan-step">
		{#if quickPicks.length > 0}
			<div class="quick-picks">
				<h3>{t('scanFlow.quickPicks')}</h3>
				<div class="quick-picks-row">
					{#each quickPicks as pick (pick.barcode)}
						<button
							type="button"
							class="quick-pick"
							class:quick-pick-favorite={pick.source === 'favorite'}
							onclick={() => handleQuickPickSelect(pick)}
						>
							<span class="quick-pick-name">{pick.name}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="scanner-wrap" aria-busy={lookupLoading}>
			<BarcodeScanner
				active={scannerActive && !lookupLoading && !cameraBlocked}
				onScan={handleScan}
				onCameraError={handleCameraError}
				onCameraReady={handleCameraReady}
			/>
			{#if lookupLoading}
				<div class="lookup-overlay" role="status" aria-live="polite">
					<Spinner size="md" label={t('scanFlow.lookupProduct')} />
					<p>{t('scanFlow.lookupProduct')}…</p>
				</div>
			{/if}
		</div>

		{#if lookupError}
			<FeedbackBanner tone="error" message={lookupError} />
		{/if}

		{#snippet manualRow()}
			<div class="manual-row">
				<input
					id="manual-barcode"
					type="text"
					inputmode="numeric"
					aria-label={t('scanFlow.manualBarcode')}
					bind:value={manualBarcode}
					placeholder="7310862000003"
				/>
				<Button
					type="button"
					variant="secondary"
					onclick={handleManualLookup}
					loading={lookupLoading}
					loadingLabel={t('common.searching')}
				>
					{t('common.search')}
				</Button>
			</div>
		{/snippet}

		{#if isDesktopDevice() || cameraBlocked}
			<div class="manual">
				<label for="manual-barcode">{t('scanFlow.manualBarcode')}</label>
				{@render manualRow()}
			</div>
		{:else}
			<details class="manual-details">
				<summary>{t('scanFlow.manualBarcode')}</summary>
				{@render manualRow()}
			</details>
		{/if}

		{#if cameraBlocked}
			<p class="manual-add-fallback">
				<a href={manualAddLink}>{t('scanFlow.manualAddFallback')}</a>
			</p>
		{/if}

		{#if !embedded}
			<p class="done-row">
				<a class="text-action" href={returnTo} data-testid="scan-done-link">{t('scanFlow.doneLink')}</a>
			</p>
		{/if}

	</section>
{:else}
	<section class="confirm-step">
		{#if !productFound}
			<p class="unknown-banner" role="status">
				{t('scanFlow.productNotFoundBanner')}
			</p>
		{/if}

		<p class="barcode-label">{t('scanFlow.barcodeLabel', { barcode })}</p>

		<form
			method="POST"
			action={saveFormAction}
			use:enhance={embedded
				? bindEmbeddedScanSubmit(
						(v) => (saveSubmitting = v),
						() => {
							persistFavoriteProduct();
							onItemSaved?.();
						}
					)
				: bindSubmittingWithRedirect(
						(v) => (saveSubmitting = v),
						async () => {
							persistFavoriteProduct();
							const uid = page.data.user?.id;
							if (shouldShowOnboarding(uid)) {
								recordOnboardingScanSaveSync(uid, [
									{
										name,
										location,
										expiresOn: expiresOn || null
									}
								]);
							} else {
								recordBarcodeActivation(uid);
							}
							saveLastScanDefaults({ location });
							/* The redirect lands on this same route, so the component is not
							   remounted — reset to the camera for the next item ourselves. */
							resetToScan();
						}
					)}
			class="save-form"
		>
			<input type="hidden" name="barcode" value={barcode} />
			<input type="hidden" name="returnTo" value={saveReturnTo} />
			<input type="hidden" name="productFound" value={productFound ? '1' : '0'} />

			<div class="quick-edit">
				<label for="scan-product-name">
					{t('common.name')}
					{#if !productFound}
						<span class="edit-hint">{t('scanFlow.editNameHint')}</span>
					{/if}
				</label>
				<input
					id="scan-product-name"
					name="name"
					bind:value={name}
					bind:this={nameInputRef}
					required
				/>
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
			</div>

			<fieldset class="locations">
				<legend>{t('scanFlow.whereLocation')}</legend>
				<div class="location-grid">
					{#each LOCATIONS as loc}
						<label class="location-option">
							<input type="radio" name="location" value={loc} bind:group={location} />
							<span>{locationLabel(getLocale(), loc)}</span>
						</label>
					{/each}
				</div>
				{#if errors.location}
					<p class="error">{errors.location[0]}</p>
				{/if}
			</fieldset>

			<details class="more-details" bind:open={showMore}>
				<summary>{t('scanFlow.moreOptions')}</summary>
				<div class="more-fields">
					<label>
						{t('scanFlow.expiresOptional')}
						<input name="expiresOn" type="date" bind:value={expiresOn} />
					</label>
					<label>
						{t('common.notes')}
						<textarea name="notes" rows="2" bind:value={notes}></textarea>
					</label>
				</div>
			</details>

			{#if errors.name}
				<p class="error">{errors.name[0]}</p>
			{/if}

			<div class="actions">
				<Button type="submit" fullWidth loading={saveSubmitting} loadingLabel={t('scanFlow.saving')}>
					{embedded ? t('common.save') : t('scanFlow.saveAndNext')}
				</Button>
				<div class="secondary-actions">
					<button type="button" class="text-action" onclick={resetToScan}>
						{t('scanFlow.scanAgain')}
					</button>
					{#if cancelHref && !embedded}
						<a class="text-action cancel-link" href={cancelHref}>{t('common.cancel')}</a>
					{/if}
				</div>
			</div>
		</form>
	</section>
{/if}

<style>
	.scanner-wrap {
		position: relative;
	}

	.lookup-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		background: color-mix(in srgb, var(--color-surface) 82%, transparent);
		border-radius: var(--radius-md);
		z-index: 2;
	}

	.lookup-overlay p {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.manual {
		margin-top: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.manual label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.manual-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-sm);
	}

	.manual-row input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
	}

	.manual-add-fallback {
		margin: var(--space-sm) 0 0;
		font-size: 0.9rem;
		text-align: center;
	}

	.manual-add-fallback a {
		font-weight: 600;
	}

	.manual-details {
		margin-top: var(--space-md);
	}

	.manual-details summary {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.manual-details[open] summary {
		margin-bottom: var(--space-xs);
	}

	.done-row {
		margin: var(--space-sm) 0 0;
		text-align: center;
	}

	.quick-picks {
		margin-bottom: var(--space-md);
	}

	.quick-picks h3 {
		margin: 0 0 var(--space-sm);
		font-size: 0.95rem;
		font-weight: 600;
	}

	.quick-picks-row {
		display: flex;
		flex-wrap: nowrap;
		gap: var(--space-sm);
		overflow-x: auto;
		padding-bottom: 0.15rem;
		-webkit-overflow-scrolling: touch;
	}

	.quick-pick {
		flex: 0 0 auto;
		max-width: min(14rem, 70vw);
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.45rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		cursor: pointer;
		text-align: left;
	}

	.quick-pick-favorite {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.quick-pick-name {
		font-size: 0.875rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.unknown-banner {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: var(--color-warning);
	}

	.barcode-label {
		margin: 0 0 var(--space-md);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.quick-edit {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.quick-edit label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.edit-hint {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.quick-edit input {
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 1.05rem;
		font-weight: 600;
	}

	.locations {
		border: none;
		margin: 0 0 var(--space-lg);
		padding: 0;
	}

	.locations legend {
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	.location-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-sm);
	}

	.location-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 0.75rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-weight: 600;
	}

	.location-option:has(input:checked) {
		border-color: var(--color-primary);
		background: var(--color-surface-muted);
		color: var(--color-primary);
	}

	.location-option input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.more-details {
		margin-bottom: var(--space-md);
	}

	.more-details summary {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.more-details[open] summary {
		margin-bottom: var(--space-xs);
	}

	.more-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.more-fields label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.more-fields input,
	.more-fields textarea {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.secondary-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
	}

	.cancel-link {
		color: var(--color-text-muted);
	}
</style>
