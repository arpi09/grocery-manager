<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import DigitalReceiptGuide from '$lib/components/molecules/DigitalReceiptGuide.svelte';
	import ImageSourcePicker from '$lib/components/molecules/ImageSourcePicker.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import type { ReceiptLine } from '$lib/domain/receipt-line';
	import { LOCATIONS, LOCATION_LABELS, type StorageLocation } from '$lib/domain/location';

	interface Props {
		returnTo: string;
	}

	let { returnTo }: Props = $props();

	let parsing = $state(false);
	let parseError = $state<string | null>(null);
	let lines = $state<ReceiptLine[]>([]);
	let selected = $state<Record<number, boolean>>({});
	let bulkLocation = $state<StorageLocation>('cupboard');
	let step = $state<'upload' | 'review'>('upload');
	let bulkSubmitting = $state(false);
	let discardReviewOpen = $state(false);

	const hubHref = $derived(`/scan?from=${encodeURIComponent(returnTo)}`);
	const cancelHref = $derived(hubHref);

	async function handleImage(file: File) {
		parsing = true;
		parseError = null;

		if (!file.type.startsWith('image/')) {
			parseError =
				'Just nu behövs en bildfil — spara kvittot som bild eller ta en skärmdump om du har PDF.';
			parsing = false;
			return;
		}

		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/receipt/parse', { method: 'POST', body: formData });
			const data = (await response.json()) as { error?: string; lines?: ReceiptLine[] };

			if (!response.ok || !data.lines?.length) {
				parseError = data.error ?? 'Hoppsan — kunde inte läsa kvittot. Prova en tydligare bild.';
				return;
			}

			lines = data.lines;
			selected = Object.fromEntries(data.lines.map((_, i) => [i, true]));
			step = 'review';
		} catch {
			parseError = 'Hoppsan — nätverksfel. Kontrollera anslutningen och försök igen.';
		} finally {
			parsing = false;
		}
	}

	function toggleAll(checked: boolean) {
		selected = Object.fromEntries(lines.map((_, i) => [i, checked]));
	}

	const selectedCount = $derived(lines.filter((_, i) => selected[i]).length);

	function requestNewImage() {
		if (lines.length > 0) {
			discardReviewOpen = true;
			return;
		}
		resetToUpload();
	}

	function resetToUpload() {
		discardReviewOpen = false;
		lines = [];
		selected = {};
		step = 'upload';
		parseError = null;
	}
</script>

{#if step === 'upload'}
	<section>
		<p class="lead">
			Har du kvittot i en app? Spara eller dela det som bild och ladda upp — eller fota ett papperskvitto.
			Vi föreslår varor du kan lägga till.
		</p>

		<DigitalReceiptGuide />

		{#if parsing}
			<FeedbackBanner
				tone="info"
				message="Läser kvittot… det tar oftast några sekunder."
			/>
		{/if}

		<ImageSourcePicker
			cameraLabel={parsing ? 'Läser kvitto…' : '📷 Fota papperskvitto'}
			fileLabel={parsing ? 'Läser kvitto…' : '📁 Välj från filer'}
			accept="image/*,application/pdf"
			disabled={parsing}
			onSelect={handleImage}
		/>

		{#if parseError}
			<FeedbackBanner tone="error" message={parseError} />
		{/if}

		<p class="hint">Kräver OPENAI_API_KEY i serverns .env.</p>
	</section>

	<ScanFlowFooter cancelHref={cancelHref} cancelLabel="Avbryt" />
{:else}
	<section>
		<h2 class="title">Välj varor ({selectedCount} av {lines.length})</h2>

		<div class="bulk-location">
			<span>Plats för alla valda:</span>
			<select bind:value={bulkLocation}>
				{#each LOCATIONS as loc (loc)}
					<option value={loc}>{LOCATION_LABELS[loc]}</option>
				{/each}
			</select>
		</div>

		<div class="select-actions">
			<button type="button" class="link-btn" onclick={() => toggleAll(true)}>Markera alla</button>
			<button type="button" class="link-btn" onclick={() => toggleAll(false)}>Avmarkera alla</button>
		</div>

		<form
			method="POST"
			action="?/bulkCreate"
			use:enhance={bindSubmitting((v) => (bulkSubmitting = v))}
		>
			<input type="hidden" name="returnTo" value={returnTo} />
			<ul class="line-list">
				{#each lines as line, index (index)}
					<li>
						<label class="line-row">
							<input type="checkbox" name="selected" value={index} checked={selected[index]} onchange={(e) => {
								selected[index] = (e.currentTarget as HTMLInputElement).checked;
							}} />
							<span class="line-name">{line.name}</span>
							{#if line.quantity}
								<span class="line-qty">{line.quantity}</span>
							{/if}
						</label>
						{#if selected[index]}
							<input type="hidden" name={`name_${index}`} value={line.name} />
							<input type="hidden" name={`quantity_${index}`} value={line.quantity ?? '1'} />
						{/if}
					</li>
				{/each}
			</ul>

			<div class="actions">
				<Button type="button" variant="secondary" onclick={requestNewImage}>Ny bild</Button>
				<Button
					type="submit"
					disabled={selectedCount === 0}
					loading={bulkSubmitting}
					loadingLabel="Sparar till skafferiet…"
				>
					Lägg till {selectedCount} {selectedCount === 1 ? 'vara' : 'varor'}
				</Button>
			</div>
		</form>
	</section>

	<ScanFlowFooter cancelHref={cancelHref} cancelLabel="Avbryt" />

	<DeleteSafetyModal
		open={discardReviewOpen}
		onClose={() => (discardReviewOpen = false)}
		tier={3}
		context="receiptDiscardReview"
		copyOptions={{ count: lines.length }}
		onConfirm={resetToUpload}
	/>
{/if}

<style>
	.lead {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.hint {
		margin-top: var(--space-md);
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.title {
		margin: 0 0 var(--space-md);
		font-size: 1.1rem;
	}

	.bulk-location {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
		font-size: 0.9rem;
	}

	.bulk-location select {
		padding: 0.4rem 0.6rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.select-actions {
		display: flex;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.link-btn {
		border: none;
		background: none;
		color: var(--color-primary);
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		min-height: 2.75rem;
	}

	.line-list {
		list-style: none;
		margin: 0 0 var(--space-lg);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.line-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
	}

	.line-name {
		font-weight: 600;
	}

	.line-qty {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	li {
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.actions {
		display: flex;
		gap: var(--space-sm);
	}

	.actions :global(.btn) {
		flex: 1;
		min-height: 2.75rem;
	}
</style>
