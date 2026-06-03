<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import DigitalReceiptGuide from '$lib/components/molecules/DigitalReceiptGuide.svelte';
	import ImageSourcePicker from '$lib/components/molecules/ImageSourcePicker.svelte';
	import { bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import { page } from '$app/state';
	import { recordReceiptActivation } from '$lib/utils/onboarding';
	import {
		prepareReceiptFileForUpload,
		RECEIPT_CAMERA_ACCEPT,
		RECEIPT_FILE_ACCEPT,
		ReceiptFileError
	} from '$lib/utils/receipt-file';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import type { ReceiptLine } from '$lib/domain/receipt-line';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		readReceiptBulkLocation,
		writeReceiptBulkLocation
	} from '$lib/utils/receipt-bulk-location';

	interface Props {
		returnTo: string;
	}

	let { returnTo }: Props = $props();

	let parsing = $state(false);
	let parseError = $state<string | null>(null);
	let lines = $state<ReceiptLine[]>([]);
	let selected = $state<Record<number, boolean>>({});
	let lineLocations = $state<Record<number, StorageLocation>>({});
	let bulkLocation = $state<StorageLocation>('cupboard');
	let locationOverrides = $state<Set<number>>(new Set());
	let step = $state<'upload' | 'review'>('upload');
	let bulkSubmitting = $state(false);
	let discardReviewOpen = $state(false);

	const hubHref = $derived(`/scan?from=${encodeURIComponent(returnTo)}`);
	const cancelHref = $derived(hubHref);

	function receiptFileErrorMessage(error: ReceiptFileError): string {
		if (error.code === 'too_large') {
			return t('receipt.formats.tooLarge');
		}
		if (error.code === 'processing_failed') {
			return t('receipt.formats.processingFailed');
		}
		return t('receipt.formats.unsupported');
	}

	function receiptParseFailureMessage(response: Response, data: { error?: string }): string {
		if (data.error) {
			return data.error;
		}
		if (response.status >= 500) {
			return t('errors.api.openAiNotConfigured');
		}
		return t('errors.api.receiptParseStatus', { status: response.status });
	}

	async function readReceiptParseResponse(response: Response): Promise<{
		lines?: ReceiptLine[];
		error?: string;
	}> {
		const contentType = response.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) {
			return {};
		}
		try {
			return (await response.json()) as { lines?: ReceiptLine[]; error?: string };
		} catch {
			return {};
		}
	}

	async function handleReceiptFile(file: File) {
		parsing = true;
		parseError = null;

		let uploadFile: File;
		try {
			uploadFile = await prepareReceiptFileForUpload(file);
		} catch (error) {
			parseError =
				error instanceof ReceiptFileError
					? receiptFileErrorMessage(error)
					: t('receipt.formats.unsupported');
			parsing = false;
			return;
		}

		try {
			const formData = new FormData();
			formData.append('image', uploadFile);

			const response = await fetch('/api/receipt/parse', { method: 'POST', body: formData });
			const data = await readReceiptParseResponse(response);

			if (!response.ok || !data.lines?.length) {
				parseError = receiptParseFailureMessage(response, data);
				return;
			}

			lines = data.lines;
			selected = Object.fromEntries(data.lines.map((_, i) => [i, true]));
			lineLocations = Object.fromEntries(data.lines.map((line, i) => [i, line.location]));
			bulkLocation = modeLocation(data.lines.map((l) => l.location)) ?? data.lines[0]?.location ?? 'cupboard';
			locationOverrides = new Set();
			step = 'review';
		} catch {
			parseError = t('receipt.networkError');
		} finally {
			parsing = false;
		}
	}

	function modeLocation(locations: StorageLocation[]): StorageLocation | undefined {
		if (locations.length === 0) return undefined;
		const counts = new Map<StorageLocation, number>();
		for (const loc of locations) {
			counts.set(loc, (counts.get(loc) ?? 0) + 1);
		}
		let best: StorageLocation = locations[0];
		let bestCount = 0;
		for (const [loc, count] of counts) {
			if (count > bestCount) {
				best = loc;
				bestCount = count;
			}
		}
		return best;
	}

	function applyBulkLocationToSelected() {
		lineLocations = {
			...lineLocations,
			...Object.fromEntries(
				lines
					.map((_, i) =>
						selected[i] && !locationOverrides.has(i) ? ([i, bulkLocation] as const) : null
					)
					.filter((entry): entry is [number, StorageLocation] => entry !== null)
			)
		};
	}

	function setLineLocation(index: number, loc: StorageLocation) {
		lineLocations[index] = loc;
		locationOverrides = new Set(locationOverrides).add(index);
	}

	function toggleAll(checked: boolean) {
		selected = Object.fromEntries(lines.map((_, i) => [i, checked]));
	}

	const selectedCount = $derived(lines.filter((_, i) => selected[i]).length);

	function formatLineAmount(line: ReceiptLine): string {
		if (!line.quantity && !line.unit) return '';
		if (line.quantity && line.unit) return `${line.quantity} ${line.unit}`;
		return line.quantity ?? line.unit ?? '';
	}

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
		lineLocations = {};
		locationOverrides = new Set();
		step = 'upload';
		parseError = null;
	}

	$effect(() => {
		if (!browser) return;
		writeReceiptBulkLocation(bulkLocation);
	});

	onMount(() => {
		if (!browser) return;
		const stored = readReceiptBulkLocation();
		if (stored) {
			bulkLocation = stored;
		}
		if (!import.meta.env.DEV) return;
		(
			window as Window & { __hpE2eReceiptUpload?: (file: File) => Promise<void> }
		).__hpE2eReceiptUpload = handleReceiptFile;
		return () => {
			delete (window as Window & { __hpE2eReceiptUpload?: (file: File) => Promise<void> })
				.__hpE2eReceiptUpload;
		};
	});
</script>

{#if step === 'upload'}
	<section>
		<p class="lead">
			{t('receiptBulk.lead')}
		</p>

		<DigitalReceiptGuide />

		{#if parsing}
			<FeedbackBanner
				tone="info"
				message={t('receipt.readingStatus')}
			/>
		{/if}

		<ImageSourcePicker
			cameraLabel={parsing ? t('receipt.reading') : t('receiptBulk.cameraPaper')}
			fileLabel={parsing ? t('receipt.reading') : t('receipt.pickFile')}
			accept={RECEIPT_FILE_ACCEPT}
			cameraAccept={RECEIPT_CAMERA_ACCEPT}
			disabled={parsing}
			onSelect={handleReceiptFile}
		/>

		<p class="hint">{t('receipt.formats.hint')}</p>

		{#if parseError}
			<div data-testid="receipt-parse-error">
				<FeedbackBanner tone="error" message={parseError} />
			</div>
		{/if}

		{#if import.meta.env.DEV}
			<p class="hint">{t('receiptBulk.apiKeyHint')}</p>
		{/if}
	</section>

	<ScanFlowFooter cancelHref={cancelHref} cancelLabel={t('scan.allModes')} />
{:else}
	<section data-testid="receipt-review">
		<h2 class="title">{t('receiptBulk.selectItems', { selected: selectedCount, total: lines.length })}</h2>

		<div class="bulk-location">
			<div class="bulk-location-copy">
				<span>{t('receiptBulk.locationForAll')}</span>
				<p class="bulk-location-hint">{t('receiptBulk.locationBulkHint')}</p>
			</div>
			<select
				bind:value={bulkLocation}
				onchange={() => {
					applyBulkLocationToSelected();
					writeReceiptBulkLocation(bulkLocation);
				}}
				data-testid="receipt-bulk-location"
			>
				{#each LOCATIONS as loc (loc)}
					<option value={loc}>{locationLabel(getLocale(), loc)}</option>
				{/each}
			</select>
		</div>

		<div class="select-actions">
			<button type="button" class="link-btn" onclick={() => toggleAll(true)}>{t('common.selectAll')}</button>
			<button type="button" class="link-btn" onclick={() => toggleAll(false)}>{t('common.deselectAll')}</button>
		</div>

		<form
			method="POST"
			action="?/bulkCreate"
			use:enhance={bindSubmittingWithRedirect(
				(v) => (bulkSubmitting = v),
				async () => {
					recordReceiptActivation(page.data.user?.id);
				}
			)}
		>
			<input type="hidden" name="bulkFlow" value="receipt" />
			<input type="hidden" name="returnTo" value={returnTo} />
			<ul class="line-list" data-testid="receipt-line-list">
				{#each lines as line, index (index)}
					<li data-testid="receipt-line-{index}">
						<div class="line-main">
							<label class="line-row">
								<input
									type="checkbox"
									data-testid="receipt-line-checkbox-{index}"
									name="selected"
									value={index}
									checked={selected[index]}
									onchange={(e) => {
										const checked = (e.currentTarget as HTMLInputElement).checked;
										selected[index] = checked;
										if (checked && !locationOverrides.has(index)) {
											lineLocations[index] = lines[index].location;
										}
									}} />
								<span class="line-name">{line.name}</span>
								{#if formatLineAmount(line)}
									<span class="line-qty">{formatLineAmount(line)}</span>
								{/if}
							</label>
							<label class="line-location">
								<span class="line-location-label">
									{t('receiptBulk.locationPerItem')}
									{#if locationOverrides.has(index)}
										<span class="override-badge">{t('receiptBulk.locationOverride')}</span>
									{/if}
								</span>
								<select
									data-testid="receipt-line-location-{index}"
									value={lineLocations[index] ?? line.location}
									onchange={(e) => {
										setLineLocation(
											index,
											(e.currentTarget as HTMLSelectElement).value as StorageLocation
										);
									}}
								>
									{#each LOCATIONS as loc (loc)}
										<option value={loc}>{locationLabel(getLocale(), loc)}</option>
									{/each}
								</select>
							</label>
						</div>
						{#if selected[index]}
							<input type="hidden" name={`name_${index}`} value={line.name} />
							<input type="hidden" name={`quantity_${index}`} value={line.quantity ?? '1'} />
							<input type="hidden" name={`unit_${index}`} value={line.unit ?? ''} />
							<input
								type="hidden"
								name={`location_${index}`}
								value={lineLocations[index] ?? line.location}
							/>
						{/if}
					</li>
				{/each}
			</ul>

			<div class="actions">
				<Button type="button" variant="secondary" onclick={requestNewImage}>{t('common.newImage')}</Button>
				<Button
					type="submit"
					data-testid="receipt-bulk-submit"
					disabled={selectedCount === 0}
					loading={bulkSubmitting}
					loadingLabel={t('receipt.saving')}
				>
					{t('receiptBulk.addCount', { count: selectedCount })}
				</Button>
			</div>
		</form>
	</section>

	<ScanFlowFooter cancelHref={returnTo} cancelLabel={t('scan.cancelBackToHome')} />

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
		align-items: flex-start;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
		font-size: 0.9rem;
	}

	.bulk-location-copy {
		flex: 1;
		min-width: 12rem;
	}

	.bulk-location-hint {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.35;
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

	.line-main {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		justify-content: space-between;
	}

	.line-location {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.85rem;
	}

	.line-location-label {
		color: var(--color-text-muted);
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.override-badge {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.line-location select {
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
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
