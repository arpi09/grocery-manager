<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import DigitalReceiptGuide from '$lib/components/molecules/DigitalReceiptGuide.svelte';
	import ImageSourcePicker from '$lib/components/molecules/ImageSourcePicker.svelte';
	import { bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { scanToastMessage } from '$lib/utils/scan-toast';
	import { bindEmbeddedScanSubmit } from '$lib/utils/scan-embedded-submit';
	import { page } from '$app/state';
	import { recordReceiptActivation } from '$lib/utils/onboarding';
	import {
		prepareReceiptFileForUpload,
		RECEIPT_CAMERA_ACCEPT,
		RECEIPT_FILE_ACCEPT,
		ReceiptFileError
	} from '$lib/utils/receipt-file';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import type { ReceiptLine, ReceiptLocationPrediction, ReceiptParseResult, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';
	import type { ReceiptImportSource } from '$lib/domain/receipt-import-source';
	import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { trackProductEvent } from '$lib/client/product-events';
	import {
		aggregateReceiptImportSummary,
		aggregateReceiptLocationCounts,
		markReceiptImportCompleted
	} from '$lib/utils/receipt-import-session';
	import {
		readReceiptBulkLocation,
		writeReceiptBulkLocation
	} from '$lib/utils/receipt-bulk-location';
	import { fetchMergeCandidates, type MergeCandidateMatch } from '$lib/client/merge-candidates';
	import { saveLastScanMode } from '$lib/utils/last-scan-defaults';

	interface Props {
		returnTo: string;
		embedded?: boolean;
		formAction?: string;
		onItemSaved?: () => void;
		onCancel?: () => void;
		/** Keep digital receipt guide expanded (e.g. onboarding first receipt path). */
		prominentGuide?: boolean;
		shelfLifeEstimatesInReceipt?: boolean;
		importSource?: ReceiptImportSource;
		/** Pre-parsed result (e.g. PWA share) — skip upload step. */
		initialParseResult?: ReceiptParseResult | null;
		/** Open file picker on mount (one-tap entry). */
		autopick?: boolean;
		/** Pending share-target file key from POST /scan/share. */
		shareKey?: string | null;
		shareError?: string | null;
	}

	let {
		returnTo,
		embedded = false,
		formAction,
		onItemSaved,
		onCancel,
		prominentGuide = false,
		shelfLifeEstimatesInReceipt = false,
		importSource = 'scan_hub',
		initialParseResult = null,
		autopick = false,
		shareKey = null,
		shareError = null
	}: Props = $props();

	const bulkFormAction = $derived(formAction ?? '?/bulkCreate');
	const LOW_CONFIDENCE_THRESHOLD = 0.4;

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
	let mergeCandidates = $state<Array<MergeCandidateMatch | null>>([]);
	let mergeSelected = $state<Record<number, boolean>>({});
	let parsedStoreLabel = $state<string | null>(null);
	let parsedPurchasedAt = $state<string | null>(null);
	let shelfLifePredictions = $state<Array<ReceiptShelfLifePrediction | null>>([]);
	let locationPredictions = $state<Array<ReceiptLocationPrediction | null>>([]);
	let lineExpiresOn = $state<Record<number, string>>({});
	let mergedAwayCount = $state(0);
	let expandedGrouped = $state<Set<number>>(new Set());
	let expiryClearedByUser = $state<Set<number>>(new Set());
	let quickConfirmUsed = $state(false);

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
		storeLabel?: string;
		purchasedAt?: string;
		mergedAwayCount?: number;
		shelfLifePredictions?: Array<ReceiptShelfLifePrediction | null>;
		locationPredictions?: Array<ReceiptLocationPrediction | null>;
	}> {
		const contentType = response.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) {
			return {};
		}
		try {
			return (await response.json()) as {
				lines?: ReceiptLine[];
				error?: string;
				storeLabel?: string;
				purchasedAt?: string;
				mergedAwayCount?: number;
				shelfLifePredictions?: Array<ReceiptShelfLifePrediction | null>;
				locationPredictions?: Array<ReceiptLocationPrediction | null>;
			};
		} catch {
			return {};
		}
	}

	function receiptTelemetryMetadata(extra: Record<string, unknown> = {}) {
		return { source: importSource, ...extra };
	}

	function applyParseResult(data: ReceiptParseResult) {
		if (!data.lines?.length) {
			parseError = t('errors.api.receiptNoItems');
			return;
		}

		lines = data.lines;
		parsedStoreLabel = data.storeLabel ?? null;
		parsedPurchasedAt = data.purchasedAt ?? null;
		mergedAwayCount = data.mergedAwayCount ?? 0;
		shelfLifePredictions = data.shelfLifePredictions ?? [];
		locationPredictions = data.locationPredictions ?? [];
		expiryClearedByUser = new Set();
		expandedGrouped = new Set();
		lineExpiresOn = Object.fromEntries(
			data.lines.map((_, index) => [
				index,
				data.shelfLifePredictions?.[index]?.expiresOn ?? ''
			])
		);
		selected = Object.fromEntries(data.lines.map((_, i) => [i, true]));
		lineLocations = Object.fromEntries(
			data.lines.map((line, i) => [
				i,
				data.locationPredictions?.[i]?.location ?? line.location
			])
		);
		bulkLocation = modeLocation(data.lines.map((l) => l.location)) ?? data.lines[0]?.location ?? 'cupboard';
		locationOverrides = new Set();
		step = 'review';
		void loadMergeCandidates();
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

		void trackProductEvent('receipt_uploaded', receiptTelemetryMetadata({
			fileType: uploadFile.type || 'unknown',
			fileSize: uploadFile.size
		}));

		try {
			const formData = new FormData();
			formData.append('image', uploadFile);

			const response = await fetch('/api/receipt/parse', { method: 'POST', body: formData });
			const data = await readReceiptParseResponse(response);

			if (!response.ok || !data.lines?.length) {
				parseError =
					data.error ??
					(response.ok
						? t('errors.api.receiptNoItems')
						: receiptParseFailureMessage(response, data));
				return;
			}

			applyParseResult(data as ReceiptParseResult);
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
		void loadMergeCandidates();
	}

	async function loadMergeCandidates() {
		const candidateLines = lines.map((line, index) => ({
			name: line.name,
			location: lineLocations[index] ?? line.location
		}));
		mergeCandidates = await fetchMergeCandidates(candidateLines);
		mergeSelected = Object.fromEntries(
			mergeCandidates.map((match, index) => [index, Boolean(match)])
		);
	}

	function toggleAll(checked: boolean) {
		selected = Object.fromEntries(lines.map((_, i) => [i, checked]));
	}

	const selectedCount = $derived(lines.filter((_, i) => selected[i]).length);
	const hasLocationPredictions = $derived(locationPredictions.some((prediction) => prediction != null));

	function countSelectedLinesWithPrice(): number {
		return lines.filter((line, index) => selected[index] && line.unitPrice?.trim()).length;
	}

	function buildReceiptImportSummary() {
		return aggregateReceiptImportSummary(buildReceiptLineContexts());
	}

	function buildReceiptLineContexts() {
		return lines.map((line, index) => ({
			line,
			index,
			selected: Boolean(selected[index]),
			lineExpiresOn: lineExpiresOn[index] ?? '',
			lineLocation: lineLocations[index] ?? line.location,
			locationOverride: locationOverrides.has(index),
			shelfLifePrediction: shelfLifePredictions[index] ?? null,
			locationPrediction: locationPredictions[index] ?? null,
			shelfLifeEstimatesInReceipt
		}));
	}

	function clearReceiptLineFormFields(formData: FormData, index: number) {
		const key = String(index);
		formData.delete(`name_${key}`);
		formData.delete(`quantity_${key}`);
		formData.delete(`unit_${key}`);
		formData.delete(`unitPrice_${key}`);
		formData.delete(`lineTotal_${key}`);
		formData.delete(`currency_${key}`);
		formData.delete(`location_${key}`);
		formData.delete(`expiresOn_${key}`);
		formData.delete(`notes_${key}`);
		formData.delete(`predictedExpiresOn_${key}`);
		formData.delete(`predictedTypicalDays_${key}`);
		formData.delete(`predictedModelVersion_${key}`);
		formData.delete(`predictedExpiresOnSource_${key}`);
		formData.delete(`predictedLocation_${key}`);
		formData.delete(`predictedLocationModelVersion_${key}`);
		formData.delete(`merge_${key}`);
		formData.delete(`expiresOnDeclined_${key}`);
	}

	function syncReceiptBulkFormData(formData: FormData) {
		formData.delete('selected');
		for (let index = 0; index < lines.length; index++) {
			clearReceiptLineFormFields(formData, index);
			if (!selected[index]) continue;

			const line = lines[index];
			const key = String(index);
			formData.append('selected', key);
			formData.set(`name_${key}`, line.name);
			formData.set(`quantity_${key}`, line.quantity ?? '1');
			formData.set(`unit_${key}`, line.unit ?? '');
			formData.set(`unitPrice_${key}`, line.unitPrice ?? '');
			formData.set(`lineTotal_${key}`, line.lineTotal ?? '');
			formData.set(`currency_${key}`, line.currency ?? '');
			formData.set(`location_${key}`, lineLocations[index] ?? line.location);

			const expiresOn = lineExpiresOn[index];
			if (expiresOn) {
				formData.set(`expiresOn_${key}`, expiresOn);
			} else if (expiryClearedByUser.has(index)) {
				formData.set(`expiresOnDeclined_${key}`, '1');
			}

			const shelfPrediction = expiryClearedByUser.has(index)
				? null
				: shelfLifePredictions[index];
			if (shelfPrediction) {
				formData.set(`predictedExpiresOn_${key}`, shelfPrediction.expiresOn);
				formData.set(`predictedTypicalDays_${key}`, String(shelfPrediction.typicalDays));
				formData.set(`predictedModelVersion_${key}`, shelfPrediction.modelVersion);
				formData.set(`predictedExpiresOnSource_${key}`, shelfPrediction.expiresOnSource);
			}

			const locationPrediction = locationPredictions[index];
			if (locationPrediction) {
				formData.set(`predictedLocation_${key}`, locationPrediction.location);
				formData.set(`predictedLocationModelVersion_${key}`, locationPrediction.modelVersion);
			}

			if (mergeSelected[index] && mergeCandidates[index]) {
				formData.set(`merge_${key}`, mergeCandidates[index]!.id);
			}
		}
	}

	function formatLineAmount(line: ReceiptLine): string {
		if (!line.quantity && !line.unit) return '';
		if (line.quantity && line.unit) return `${line.quantity} ${line.unit}`;
		return line.quantity ?? line.unit ?? '';
	}

	function formatLinePrice(line: ReceiptLine): string {
		if (!line.unitPrice && !line.lineTotal) return '';
		const currency = line.currency ?? 'SEK';
		if (line.unitPrice && line.lineTotal) {
			return `${line.unitPrice} / ${line.lineTotal} ${currency}`;
		}
		if (line.unitPrice) return `${line.unitPrice} ${currency}`;
		return `${line.lineTotal} ${currency}`;
	}

	function formatReceiptMetaDate(iso: string): string {
		const [year, month, day] = iso.split('-').map(Number);
		if (!year || !month || !day) return iso;
		const date = new Date(year, month - 1, day);
		const locale = getLocale() === 'en' ? 'en-GB' : 'sv-SE';
		return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function formatLineMeta(line: ReceiptLine): string {
		const parts: string[] = [];
		if (line.brand?.trim()) parts.push(line.brand.trim());
		if (line.packageSize?.trim()) parts.push(line.packageSize.trim());
		if (line.categoryHint?.trim()) parts.push(line.categoryHint.trim());
		return parts.join(' · ');
	}

	function isLowConfidence(prediction: ReceiptShelfLifePrediction | null | undefined): boolean {
		if (!prediction) return false;
		if (prediction.confidence != null) {
			return prediction.confidence < LOW_CONFIDENCE_THRESHOLD;
		}
		return prediction.expiresOnSource === 'default_heuristic';
	}

	function handleExpiryChange(index: number, value: string) {
		lineExpiresOn[index] = value;
		const next = new Set(expiryClearedByUser);
		if (!value.trim()) {
			next.add(index);
		} else {
			next.delete(index);
		}
		expiryClearedByUser = next;
	}

	function toggleGroupedExpanded(index: number) {
		const next = new Set(expandedGrouped);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		expandedGrouped = next;
	}

	function trackReviewCompleted() {
		void trackProductEvent('receipt_review_completed', receiptTelemetryMetadata({
			selectedCount,
			totalLines: lines.length,
			lineCount: lines.length,
			quickConfirm: quickConfirmUsed
		}));
	}

	async function loadSharePending(key: string) {
		parsing = true;
		parseError = null;
		try {
			const response = await fetch(`/api/receipt/share-pending?key=${encodeURIComponent(key)}`);
			if (!response.ok) {
				parseError = t('receiptAutomation.sharePendingMissing');
				return;
			}
			const blob = await response.blob();
			const disposition = response.headers.get('content-disposition') ?? '';
			const match = disposition.match(/filename="([^"]+)"/);
			const fileName = match?.[1] ?? 'receipt';
			const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
			await handleReceiptFile(file);
		} catch {
			parseError = t('receipt.networkError');
		} finally {
			parsing = false;
		}
	}

	function triggerAutopick() {
		requestAnimationFrame(() => {
			document.querySelector<HTMLInputElement>('[data-testid="receipt-file-input"]')?.click();
		});
	}

	function handleQuickConfirm(event: MouseEvent) {
		event.preventDefault();
		quickConfirmUsed = true;
		toggleAll(true);
		const form = (event.currentTarget as HTMLElement).closest('form');
		const submit = form?.querySelector<HTMLButtonElement>('[data-testid="receipt-bulk-submit"]');
		if (submit && !submit.disabled) {
			submit.click();
		}
	}

	function shareErrorMessage(code: string | null): string | null {
		if (!code) return null;
		if (code === 'too_large') return t('receipt.formats.tooLarge');
		if (code === 'unsupported') return t('receipt.formats.unsupported');
		if (code === 'no_file') return t('receiptAutomation.shareNoFile');
		return t('receiptAutomation.shareFailed');
	}

	const resolvedShareError = $derived(shareErrorMessage(shareError));

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
		mergeCandidates = [];
		mergeSelected = {};
		parsedStoreLabel = null;
		parsedPurchasedAt = null;
		shelfLifePredictions = [];
		locationPredictions = [];
		lineExpiresOn = {};
		mergedAwayCount = 0;
		expiryClearedByUser = new Set();
		expandedGrouped = new Set();
		step = 'upload';
		parseError = null;
	}

	$effect(() => {
		if (!browser) return;
		writeReceiptBulkLocation(bulkLocation);
	});

	onMount(() => {
		saveLastScanMode('receipt');
		void trackProductEvent('receipt_import_started', receiptTelemetryMetadata());
		if (!browser) return;
		const stored = readReceiptBulkLocation();
		if (stored) {
			bulkLocation = stored;
		}

		if (initialParseResult?.lines?.length) {
			applyParseResult(initialParseResult);
		} else if (shareKey) {
			void loadSharePending(shareKey);
		} else if (autopick) {
			triggerAutopick();
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

		<ImageSourcePicker
			cameraLabel={parsing ? t('receipt.reading') : t('receiptBulk.cameraPaper')}
			fileLabel={parsing ? t('receipt.reading') : t('receipt.pickFile')}
			accept={RECEIPT_FILE_ACCEPT}
			cameraAccept={RECEIPT_CAMERA_ACCEPT}
			disabled={parsing}
			onSelect={handleReceiptFile}
		/>

		<DigitalReceiptGuide prominent={prominentGuide} />

		{#if parsing}
			<FeedbackBanner
				tone="info"
				message={t('receipt.readingStatus')}
			/>
		{/if}

		<p class="hint">{t('receipt.formats.hint')}</p>

		{#if resolvedShareError}
			<div data-testid="receipt-share-error">
				<FeedbackBanner tone="error" message={resolvedShareError} />
			</div>
		{/if}

		{#if parseError}
			<div data-testid="receipt-parse-error">
				<FeedbackBanner tone="error" message={parseError} />
			</div>
		{/if}

		{#if import.meta.env.DEV}
			<p class="hint">{t('receiptBulk.apiKeyHint')}</p>
		{/if}
	</section>

{:else}
	<section data-testid="receipt-review">
		<h2 class="title">{t('receiptBulk.selectItems', { selected: selectedCount, total: lines.length })}</h2>
		{#if parsedStoreLabel || parsedPurchasedAt}
			<p class="receipt-meta" data-testid="receipt-review-meta">
				{#if parsedStoreLabel && parsedPurchasedAt}
					{t('receiptBulk.receiptMeta', {
						store: parsedStoreLabel,
						date: formatReceiptMetaDate(parsedPurchasedAt)
					})}
				{:else if parsedStoreLabel}
					{parsedStoreLabel}
				{:else if parsedPurchasedAt}
					{t('receiptBulk.purchasedOn', { date: formatReceiptMetaDate(parsedPurchasedAt) })}
				{/if}
			</p>
		{/if}
		{#if mergedAwayCount > 0}
			<p class="hint" data-testid="receipt-merged-away">
				{t('receiptBulk.mergedAwaySummary', { count: mergedAwayCount })}
			</p>
		{/if}
		{#if shelfLifeEstimatesInReceipt}
			<p class="hint">{t('receiptBulk.estimatesHint')}</p>
		{/if}
		{#if hasLocationPredictions}
			<p class="hint">{t('receiptBulk.locationSuggestionsHint')}</p>
		{/if}

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
			action={bulkFormAction}
			use:enhance={embedded
				? bindEmbeddedScanSubmit(
						(v) => (bulkSubmitting = v),
						() => {
							showClientToast(
								scanToastMessage(getLocale(), 'added', t('receiptBulk.savedLabel', { count: selectedCount })),
								{ variant: 'success' }
							);
							trackReviewCompleted();
							onItemSaved?.();
						},
						syncReceiptBulkFormData
					)
				: bindSubmittingWithRedirect(
						(v) => (bulkSubmitting = v),
						async () => {
							trackReviewCompleted();
							markReceiptImportCompleted(
								selectedCount,
								buildReceiptImportSummary(),
								aggregateReceiptLocationCounts(buildReceiptLineContexts()),
								countSelectedLinesWithPrice(),
								importSource
							);
							recordReceiptActivation(page.data.user?.id);
						},
						syncReceiptBulkFormData
					)}
		>
			<input type="hidden" name="bulkFlow" value="receipt" />
			<input type="hidden" name="returnTo" value={returnTo} />
			<input type="hidden" name="storeLabel" value={parsedStoreLabel ?? ''} />
			<input type="hidden" name="purchasedAt" value={parsedPurchasedAt ?? ''} />
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
								{#if formatLinePrice(line)}
									<span class="line-price">{formatLinePrice(line)}</span>
								{/if}
							</label>
							<label class="line-location">
								<span class="line-location-label">
									{t('receiptBulk.locationPerItem')}
									{#if locationPredictions[index] && !locationOverrides.has(index)}
										<EstimatedBadge
											source={locationPredictions[index]!.source}
											label={t('receiptBulk.suggestedLocation')}
										/>
									{/if}
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
						{#if formatLineMeta(line)}
							<p class="line-meta">{formatLineMeta(line)}</p>
						{/if}
						{#if (line.groupedCount ?? 1) > 1 && line.groupedFrom}
							<button
								type="button"
								class="link-btn grouped-toggle"
								data-testid="receipt-line-grouped-toggle-{index}"
								aria-expanded={expandedGrouped.has(index)}
								onclick={() => toggleGroupedExpanded(index)}
							>
								{expandedGrouped.has(index)
									? t('receiptBulk.hideGroupedLines')
									: t('receiptBulk.showGroupedLines', { count: line.groupedCount ?? 1 })}
							</button>
							{#if expandedGrouped.has(index)}
								<ul class="grouped-from-list" data-testid="receipt-line-grouped-{index}">
									{#each line.groupedFrom as sourceLine, sourceIndex (sourceIndex)}
										<li>
											<span>{sourceLine.name}</span>
											{#if formatLineAmount(sourceLine)}
												<span class="line-qty">{formatLineAmount(sourceLine)}</span>
											{/if}
											{#if formatLinePrice(sourceLine)}
												<span class="line-price">{formatLinePrice(sourceLine)}</span>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						{/if}
						{#if mergeCandidates[index]}
							<label class="merge-hint">
								<input
									type="checkbox"
									checked={mergeSelected[index]}
									onchange={(e) => {
										mergeSelected[index] = (e.currentTarget as HTMLInputElement).checked;
									}}
								/>
								<span>
									{t('inventory.mergeExisting', {
										name: mergeCandidates[index]!.name,
										quantity: mergeCandidates[index]!.quantity,
										unit: mergeCandidates[index]!.unit ?? ''
									})}
								</span>
							</label>
						{/if}
						{#if shelfLifeEstimatesInReceipt && selected[index]}
							<div class="line-expiry">
								<label class="line-expiry-label" for="expiresOn-{index}">
									{t('scanFlow.expiresOptional')}
									{#if shelfLifePredictions[index] && !expiryClearedByUser.has(index)}
										<EstimatedBadge
											source={shelfLifePredictions[index]!.expiresOnSource}
											explanation={shelfLifePredictions[index]!.explanation}
											lowConfidence={isLowConfidence(shelfLifePredictions[index])}
											showSettingsLink
										/>
									{/if}
								</label>
								<input
									id="expiresOn-{index}"
									type="date"
									data-testid="receipt-line-expiry-{index}"
									value={lineExpiresOn[index] ?? ''}
									onchange={(e) => {
										handleExpiryChange(
											index,
											(e.currentTarget as HTMLInputElement).value
										);
									}}
								/>
							</div>
						{/if}
						{#if selected[index]}
							<input type="hidden" name={`name_${index}`} value={line.name} />
							<input type="hidden" name={`quantity_${index}`} value={line.quantity ?? '1'} />
							<input type="hidden" name={`unit_${index}`} value={line.unit ?? ''} />
							<input type="hidden" name={`unitPrice_${index}`} value={line.unitPrice ?? ''} />
							<input type="hidden" name={`lineTotal_${index}`} value={line.lineTotal ?? ''} />
							<input type="hidden" name={`currency_${index}`} value={line.currency ?? ''} />
							<input
								type="hidden"
								name={`location_${index}`}
								value={lineLocations[index] ?? line.location}
							/>
							{#if lineExpiresOn[index]}
								<input type="hidden" name={`expiresOn_${index}`} value={lineExpiresOn[index]} />
							{:else if expiryClearedByUser.has(index)}
								<input type="hidden" name={`expiresOnDeclined_${index}`} value="1" />
							{/if}
							{#if shelfLifePredictions[index] && !expiryClearedByUser.has(index)}
								<input
									type="hidden"
									name={`predictedExpiresOn_${index}`}
									value={shelfLifePredictions[index]!.expiresOn}
								/>
								<input
									type="hidden"
									name={`predictedTypicalDays_${index}`}
									value={String(shelfLifePredictions[index]!.typicalDays)}
								/>
								<input
									type="hidden"
									name={`predictedModelVersion_${index}`}
									value={shelfLifePredictions[index]!.modelVersion}
								/>
								<input
									type="hidden"
									name={`predictedExpiresOnSource_${index}`}
									value={shelfLifePredictions[index]!.expiresOnSource}
								/>
							{/if}
							{#if locationPredictions[index]}
								<input
									type="hidden"
									name={`predictedLocation_${index}`}
									value={locationPredictions[index]!.location}
								/>
								<input
									type="hidden"
									name={`predictedLocationModelVersion_${index}`}
									value={locationPredictions[index]!.modelVersion}
								/>
							{/if}
							{#if mergeSelected[index] && mergeCandidates[index]}
								<input type="hidden" name={`merge_${index}`} value={mergeCandidates[index]!.id} />
							{/if}
						{/if}
					</li>
				{/each}
			</ul>

			<div class="actions">
				<Button
					type="button"
					variant="primary"
					data-testid="receipt-quick-confirm"
					disabled={lines.length === 0 || bulkSubmitting}
					loading={bulkSubmitting && quickConfirmUsed}
					loadingLabel={t('receipt.saving')}
					onclick={handleQuickConfirm}
				>
					{t('receiptAutomation.quickConfirmAll')}
				</Button>
				<Button type="button" variant="secondary" onclick={requestNewImage}>{t('common.newImage')}</Button>
				<Button
					type="submit"
					variant="secondary"
					data-testid="receipt-bulk-submit"
					disabled={selectedCount === 0}
					loading={bulkSubmitting && !quickConfirmUsed}
					loadingLabel={t('receipt.saving')}
				>
					{t('receiptBulk.addCount', { count: selectedCount })}
				</Button>
			</div>
		</form>
	</section>

	{#if onCancel}
		<ScanFlowFooter
			onCancel={onCancel}
			cancelLabel={t('onboarding.backToPicker')}
			data-testid="onboarding-scan-flow-cancel"
		/>
	{/if}

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

	.receipt-meta {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.line-meta {
		margin: var(--space-xs) 0 0;
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.grouped-toggle {
		margin-top: var(--space-xs);
		min-height: auto;
		font-size: 0.8125rem;
	}

	.grouped-from-list {
		list-style: none;
		margin: var(--space-xs) 0 0;
		padding: var(--space-xs) 0 0 var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		border-left: 2px solid var(--color-border);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.grouped-from-list li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		padding: 0;
		border: none;
	}

	.merge-hint {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
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

	.line-price {
		font-size: 0.78rem;
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
		flex-direction: column;
		gap: var(--space-sm);
	}

	.actions :global(.btn) {
		flex: 1;
		min-height: 2.75rem;
	}

	.line-expiry {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}

	.line-expiry-label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
		font-size: 0.85rem;
	}
</style>
