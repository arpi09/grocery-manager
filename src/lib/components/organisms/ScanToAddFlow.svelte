<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Spinner from '$lib/components/atoms/Spinner.svelte';
	import BarcodeScanner from '$lib/components/molecules/BarcodeScanner.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import type { BarcodeLookupResult } from '$lib/domain/barcode-product';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { addRecentScan, getRecentScans, type RecentScan } from '$lib/utils/recent-scans';
	import { isDesktopDevice } from '$lib/utils/device';

	interface Props {
		defaultLocation: StorageLocation;
		returnTo: string;
		cancelHref?: string;
		errors?: Record<string, string[]>;
	}

	let { defaultLocation, returnTo, cancelHref, errors = {} }: Props = $props();

	const locationLabels: Record<StorageLocation, string> = {
		fridge: 'Kyl',
		freezer: 'Frys',
		cupboard: 'Skafferi'
	};

	type Step = 'scan' | 'confirm';

	let step = $state<Step>('scan');
	let scannerActive = $state(true);
	let lookupLoading = $state(false);
	let lookupError = $state<string | null>(null);
	let productFound = $state(true);
	let manualBarcode = $state('');
	let showMore = $state(false);
	let recentScans = $state<RecentScan[]>([]);

	let barcode = $state('');
	let name = $state('');
	let quantity = $state('1');
	let unit = $state('');
	let notes = $state('');
	let location = $state<StorageLocation>(defaultLocation);
	let expiresOn = $state('');
	let saveSubmitting = $state(false);

	$effect(() => {
		recentScans = getRecentScans();
	});

	function resetToScan() {
		step = 'scan';
		scannerActive = true;
		lookupLoading = false;
		lookupError = null;
		barcode = '';
		manualBarcode = '';
		showMore = false;
	}

	async function applyLookupResult(result: BarcodeLookupResult) {
		barcode = result.product.barcode;
		name = result.product.name;
		quantity = result.product.quantity;
		unit = result.product.unit ?? '';
		notes = result.product.notes ?? '';
		productFound = result.found;
		addRecentScan({ barcode: result.product.barcode, name: result.product.name });
		recentScans = getRecentScans();
		scannerActive = false;
		step = 'confirm';
	}

	async function lookupBarcode(code: string) {
		const trimmed = code.trim();
		if (trimmed.length < 8) {
			lookupError = 'Hoppsan — ange en giltig streckkod (minst 8 siffror).';
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
						: 'Hoppsan — kunde inte slå upp streckkoden. Försök igen eller ange manuellt.';
				scannerActive = step === 'scan';
				return;
			}

			await applyLookupResult(data as BarcodeLookupResult);
		} catch {
			lookupError = 'Hoppsan — nätverksfel. Kontrollera anslutningen och försök igen.';
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

	async function handleRecentSelect(scan: RecentScan) {
		barcode = scan.barcode;
		name = scan.name;
		quantity = '1';
		unit = '';
		notes = '';
		productFound = true;
		scannerActive = false;
		step = 'confirm';
	}
</script>

{#if step === 'scan'}
	<section class="scan-step">
		<div class="scanner-wrap" aria-busy={lookupLoading}>
			<BarcodeScanner active={scannerActive && !lookupLoading} onScan={handleScan} />
			{#if lookupLoading}
				<div class="lookup-overlay" role="status" aria-live="polite">
					<Spinner size="md" label="Slår upp produkt" />
					<p>Slår upp produkt…</p>
				</div>
			{/if}
		</div>

		{#if lookupError}
			<FeedbackBanner tone="error" message={lookupError} />
		{/if}

		{#if isDesktopDevice()}
			<div class="manual">
				<label for="manual-barcode">Eller ange streckkod manuellt</label>
				<div class="manual-row">
					<input
						id="manual-barcode"
						type="text"
						inputmode="numeric"
						bind:value={manualBarcode}
						placeholder="7310862000003"
					/>
					<Button
						type="button"
						variant="secondary"
						onclick={handleManualLookup}
						loading={lookupLoading}
						loadingLabel="Söker…"
					>
						Sök
					</Button>
				</div>
			</div>
		{/if}

		{#if recentScans.length > 0}
			<div class="recent">
				<h3>Senaste skanningar</h3>
				<ul>
					{#each recentScans as scan}
						<li>
							<button type="button" class="recent-btn" onclick={() => handleRecentSelect(scan)}>
								<span class="recent-name">{scan.name}</span>
								<span class="recent-code">{scan.barcode}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>
{:else}
	<section class="confirm-step">
		{#if !productFound}
			<p class="unknown-banner" role="status">
				Produkten hittades inte i databasen. Kontrollera namnet innan du sparar.
			</p>
		{/if}

		<p class="product-name">{name}</p>
		<p class="barcode-label">Streckkod: {barcode}</p>

		<form
			method="POST"
			action="?/create"
			use:enhance={bindSubmitting((v) => (saveSubmitting = v))}
			class="save-form"
		>
			<input type="hidden" name="barcode" value={barcode} />
			<input type="hidden" name="returnTo" value={returnTo} />
			<input type="hidden" name="productFound" value={productFound ? '1' : '0'} />

			<fieldset class="locations">
				<legend>Var ska varan ligga?</legend>
				<div class="location-grid">
					{#each LOCATIONS as loc}
						<label class="location-option">
							<input type="radio" name="location" value={loc} bind:group={location} />
							<span>{locationLabels[loc]}</span>
						</label>
					{/each}
				</div>
				{#if errors.location}
					<p class="error">{errors.location[0]}</p>
				{/if}
			</fieldset>

			{#if showMore}
				<div class="more-fields">
					<label>
						Namn
						<input name="name" bind:value={name} required />
					</label>
					<div class="row">
						<label>
							Antal
							<input name="quantity" bind:value={quantity} inputmode="decimal" required />
						</label>
						<label>
							Enhet
							<input name="unit" bind:value={unit} placeholder="st, g, L…" />
						</label>
					</div>
					<label>
						Går ut (valfritt)
						<input name="expiresOn" type="date" bind:value={expiresOn} />
					</label>
					<label>
						Anteckningar
						<textarea name="notes" rows="2" bind:value={notes}></textarea>
					</label>
				</div>
			{:else}
				<input type="hidden" name="name" value={name} />
				<input type="hidden" name="quantity" value={quantity} />
				<input type="hidden" name="unit" value={unit} />
				<input type="hidden" name="notes" value={notes} />
				<input type="hidden" name="expiresOn" value="" />
			{/if}

			{#if errors.name}
				<p class="error">{errors.name[0]}</p>
			{/if}

			<div class="actions">
				{#if cancelHref}
					<a class="cancel-link" href={cancelHref}>Avbryt</a>
				{/if}
				<Button type="button" variant="ghost" onclick={resetToScan}>Skanna igen</Button>
				<Button type="button" variant="secondary" onclick={() => (showMore = !showMore)}>
					{showMore ? 'Dölj detaljer' : 'Mer'}
				</Button>
				<Button type="submit" fullWidth loading={saveSubmitting} loadingLabel="Sparar till skafferiet…">
					Spara
				</Button>
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

	.recent {
		margin-top: var(--space-lg);
	}

	.recent h3 {
		margin: 0 0 var(--space-sm);
		font-size: 0.95rem;
	}

	.recent ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.recent-btn {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		cursor: pointer;
		text-align: left;
	}

	.recent-name {
		font-weight: 600;
	}

	.recent-code {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.unknown-banner {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: #fff8e6;
		border: 1px solid #f0d2a8;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: #8a5a12;
	}

	.product-name {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.barcode-label {
		margin: var(--space-xs) 0 var(--space-lg);
		font-size: 0.85rem;
		color: var(--color-text-muted);
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

	.more-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
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

	.cancel-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		color: var(--color-text-muted);
		font-weight: 600;
		text-decoration: none;
	}

	.cancel-link:hover {
		color: var(--color-text);
		text-decoration: none;
	}
</style>
