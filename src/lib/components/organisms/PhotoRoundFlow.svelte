<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import ImageSourcePicker from '$lib/components/molecules/ImageSourcePicker.svelte';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import { bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import { bindEmbeddedScanSubmit } from '$lib/utils/scan-embedded-submit';
	import type { PhotoRoundConfidence, PhotoRoundDetectedItem } from '$lib/domain/photo-round';
	import { PHOTO_ROUND_MAX_IMAGES, PHOTO_ROUND_MAX_TOTAL_BYTES } from '$lib/domain/photo-round';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { guessShelfLife } from '$lib/domain/shelf-life';
	import { getLocale, t } from '$lib/i18n';
	import { manualAddHref } from '$lib/utils/scan-nav';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { fetchMergeCandidates, type MergeCandidateMatch } from '$lib/client/merge-candidates';
	import { onMount } from 'svelte';
import {
	getLastPhotoRoundLocation,
	savePhotoRoundLocations,
	savePhotoRoundLocation
} from '$lib/utils/photo-round-locations';
	import { saveLastScanMode } from '$lib/utils/last-scan-defaults';
	import { recordFirstItemActivation, shouldShowOnboarding } from '$lib/utils/onboarding';
	import { recordOnboardingScanSaveSync } from '$lib/utils/activation-scan-save';
	import {
		PhotoRoundImageError,
		resizeImageForPhotoRound
	} from '$lib/utils/resize-photo-round-image';


	interface Props {
		returnTo: string;
		/** Hint zone for AI parse (from inventory tab or URL). Skips forced zone picker. */
		initialLocation?: StorageLocation | null;
		embedded?: boolean;
		formAction?: string;
		onItemSaved?: () => void;
		onCancel?: () => void;
	}

	let {
		returnTo,
		initialLocation = null,
		embedded = false,
		formAction,
		onItemSaved,
		onCancel
	}: Props = $props();

	const bulkFormAction = $derived(formAction ?? '?/bulkCreate');

	type Step = 'capture' | 'review';

	type ReviewLine = PhotoRoundDetectedItem & {
		id: number;
		expiresOnAiInferred: boolean;
	};

	let step = $state<Step>('capture');
	const rememberedLocation = getLastPhotoRoundLocation();
	let zone = $state<StorageLocation>(initialLocation ?? rememberedLocation ?? 'fridge');
	let zoneConfidence = $state<PhotoRoundConfidence | null>(initialLocation ? 'high' : null);
	let zonePickerOpen = $state(false);
	let photos = $state<{ file: File; previewUrl: string }[]>([]);
	let parsing = $state(false);
	let parseError = $state<string | null>(null);
	let lines = $state<ReviewLine[]>([]);
	let selected = $state<Record<number, boolean>>({});
	let bulkSubmitting = $state(false);
	let discardReviewOpen = $state(false);
	let nextLineId = $state(0);
	let mergeCandidates = $state<Record<number, MergeCandidateMatch | null>>({});
	let mergeSelected = $state<Record<number, boolean>>({});
	let sameAsLastTime = $state(Boolean(rememberedLocation && !initialLocation));
	let showFewItemsHint = $state(false);

	const manualAddLink = $derived(
		manualAddHref(returnTo, initialLocation ? { location: initialLocation } : undefined)
	);
	const canAddPhoto = $derived(photos.length < PHOTO_ROUND_MAX_IMAGES);

	function confidenceLabel(confidence: PhotoRoundDetectedItem['confidence']): string {
		if (confidence === 'high') return t('photoRound.confidenceHigh');
		if (confidence === 'medium') return t('photoRound.confidenceMedium');
		return t('photoRound.confidenceLow');
	}

	const showZonePicker = $derived(
		!initialLocation && zoneConfidence !== 'high'
	);

	const captureLead = $derived(
		initialLocation
			? t('photoRound.captureLead', {
					zone: locationLabel(getLocale(), zone),
					count: photos.length,
					max: PHOTO_ROUND_MAX_IMAGES
				})
			: zoneConfidence === 'high'
				? t('photoRound.captureLeadDetected', {
						zone: locationLabel(getLocale(), zone),
						count: photos.length,
						max: PHOTO_ROUND_MAX_IMAGES
					})
				: t('photoRound.captureLeadGeneric', {
						count: photos.length,
						max: PHOTO_ROUND_MAX_IMAGES
					})
	);

	function selectZone(next: StorageLocation) {
		zone = next;
		savePhotoRoundLocation(next);
		parseError = null;
		zonePickerOpen = false;
	}

	function revokePreviews() {
		for (const photo of photos) {
			URL.revokeObjectURL(photo.previewUrl);
		}
	}

	async function handlePhotoFile(file: File) {
		if (!canAddPhoto) return;
		const previewUrl = URL.createObjectURL(file);
		photos = [...photos, { file, previewUrl }];
	}

	function removePhoto(index: number) {
		const removed = photos[index];
		if (removed) {
			URL.revokeObjectURL(removed.previewUrl);
		}
		photos = photos.filter((_, i) => i !== index);
	}

	function parseFailureMessage(response: Response, data: { error?: string }): string {
		if (data.error) return data.error;
		if (response.status === 413) {
			return t('photoRound.uploadTooLarge');
		}
		if (response.status >= 500) {
			return t('photoRound.serverError');
		}
		return t('photoRound.parseFailed');
	}

	async function readPhotoRoundParseResponse(response: Response): Promise<{
		items?: PhotoRoundDetectedItem[];
		detectedZone?: StorageLocation;
		zoneConfidence?: PhotoRoundConfidence;
		error?: string;
	}> {
		const contentType = response.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) {
			return {};
		}
		try {
			return (await response.json()) as {
				items?: PhotoRoundDetectedItem[];
				detectedZone?: StorageLocation;
				zoneConfidence?: PhotoRoundConfidence;
				error?: string;
			};
		} catch {
			return {};
		}
	}

	function reviewLineFromDetected(item: PhotoRoundDetectedItem): ReviewLine {
		const id = nextLineId++;
		let expiresOn = item.expiresOn ?? '';
		let expiresOnAiInferred = false;
		if (!expiresOn) {
			const inferred = guessShelfLife(item.name, item.location);
			if (inferred) {
				expiresOn = inferred.expiresOn;
				expiresOnAiInferred = true;
			}
		}
		return {
			...item,
			id,
			expiresOn: expiresOn || null,
			notes: item.notes ?? null,
			expiresOnAiInferred
		};
	}

	function imagePrepErrorMessage(err: unknown): string {
		if (err instanceof PhotoRoundImageError) {
			if (err.code === 'invalid_type') return t('photoRound.imageInvalidType');
			if (err.code === 'too_large') return t('photoRound.uploadTooLarge');
		}
		return t('photoRound.imagePrepFailed');
	}

	async function analyzePhotos() {
		if (photos.length === 0) return;

		parsing = true;
		parseError = null;

		let preparedFiles: File[];
		try {
			preparedFiles = await Promise.all(photos.map((photo) => resizeImageForPhotoRound(photo.file)));
		} catch (err) {
			parseError = imagePrepErrorMessage(err);
			parsing = false;
			return;
		}

		const totalBytes = preparedFiles.reduce((sum, file) => sum + file.size, 0);
		if (totalBytes > PHOTO_ROUND_MAX_TOTAL_BYTES) {
			parseError = t('photoRound.uploadTooLarge');
			parsing = false;
			return;
		}

		const formData = new FormData();
		if (initialLocation) {
			formData.append('zone', initialLocation);
		} else if (showZonePicker) {
			formData.append('zone', zone);
		} else {
			formData.append('zone', 'auto');
		}
		for (const file of preparedFiles) {
			formData.append('images', file);
		}

		try {
			const response = await fetch('/api/inventory/photo-scan', { method: 'POST', body: formData });
			const data = await readPhotoRoundParseResponse(response);

			if (!response.ok || !data.items) {
				parseError = parseFailureMessage(response, data);
				return;
			}

			if (data.items.length === 0) {
				parseError = t('photoRound.noItems');
				return;
			}

			if (!initialLocation && data.detectedZone) {
				zone = data.detectedZone;
				savePhotoRoundLocation(data.detectedZone);
				zoneConfidence = data.zoneConfidence ?? 'medium';
			}

			const photoCount = photos.length;
			showFewItemsHint = photoCount === 1 && data.items.length < 5;
			lines = data.items.map((item) => reviewLineFromDetected(item));
			selected = Object.fromEntries(lines.map((line) => [line.id, true]));
			revokePreviews();
			photos = [];
			step = 'review';
			void loadMergeCandidates();
		} catch {
			parseError = t('photoRound.networkError');
		} finally {
			parsing = false;
		}
	}

	async function loadMergeCandidates() {
		const matches = await fetchMergeCandidates(
			lines.map((line) => ({ name: line.name, location: line.location }))
		);
		mergeCandidates = Object.fromEntries(
			lines.map((line, index) => [line.id, matches[index] ?? null])
		);
		mergeSelected = Object.fromEntries(
			lines.map((line) => [line.id, Boolean(mergeCandidates[line.id])])
		);
	}

	function removeLine(id: number) {
		lines = lines.filter((line) => line.id !== id);
		const next = { ...selected };
		delete next[id];
		selected = next;
	}

	function toggleAll(checked: boolean) {
		selected = Object.fromEntries(lines.map((line) => [line.id, checked]));
	}

	function updateLine(id: number, patch: Partial<ReviewLine>) {
		lines = lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
		if (patch.location || patch.name) {
			void loadMergeCandidates();
		}
	}

	function requestNewRound() {
		if (lines.length > 0) {
			discardReviewOpen = true;
			return;
		}
		resetReview();
	}

	function resetReview() {
		discardReviewOpen = false;
		lines = [];
		selected = {};
		mergeCandidates = {};
		mergeSelected = {};
		parseError = null;
		showFewItemsHint = false;
		step = 'capture';
		zone = initialLocation ?? 'fridge';
		if (!initialLocation) {
			const remembered = getLastPhotoRoundLocation();
			if (remembered) zone = remembered;
		}
		zoneConfidence = initialLocation ? 'high' : null;
	}

	const selectedCount = $derived(lines.filter((line) => selected[line.id]).length);

	function syncPhotoRoundFormData(formData: FormData) {
		formData.delete('selected');
		for (const line of lines) {
			const key = String(line.id);
			formData.delete(`name_${key}`);
			formData.delete(`quantity_${key}`);
			formData.delete(`unit_${key}`);
			formData.delete(`location_${key}`);
			formData.delete(`expiresOn_${key}`);
			formData.delete(`notes_${key}`);
			if (!selected[line.id]) continue;
			formData.append('selected', key);
			formData.set(`name_${key}`, line.name);
			formData.set(`quantity_${key}`, line.quantity);
			formData.set(`unit_${key}`, line.unit ?? '');
			formData.set(`location_${key}`, line.location);
			formData.set(`expiresOn_${key}`, line.expiresOn ?? '');
			formData.set(`notes_${key}`, line.notes ?? '');
		}
		savePhotoRoundLocations(
			lines.filter((line) => selected[line.id]).map((line) => ({ name: line.name, location: line.location }))
		);
	}

	onMount(() => {
		saveLastScanMode('photo');
		return () => revokePreviews();
	});
</script>

{#if step === 'capture'}
	<section data-testid="photo-round-capture">
		<p class="lead" data-testid="photo-round-lead">{captureLead}</p>
		{#if zone === 'fridge' && canAddPhoto}
			<p class="hint" data-testid="photo-round-multi-photo-hint">{t('photoRound.multiPhotoFridgeHint')}</p>
		{:else if canAddPhoto && photos.length < PHOTO_ROUND_MAX_IMAGES}
			<p class="hint" data-testid="photo-round-multi-photo-hint">{t('photoRound.multiPhotoHint')}</p>
		{/if}
		<p class="privacy">{t('photoRound.privacyNote')}</p>

		{#if photos.length > 0}
			<ul class="photo-list" data-testid="photo-round-thumbnails">
				{#each photos as photo, index (photo.previewUrl)}
					<li>
						<img src={photo.previewUrl} alt="" />
						<button type="button" class="remove-photo" onclick={() => removePhoto(index)}>
							{t('common.delete')}
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if parsing}
			<FeedbackBanner tone="info" message={t('photoRound.analyzing')} />
		{/if}

		{#if canAddPhoto}
			<ImageSourcePicker
				cameraLabel={parsing ? t('photoRound.analyzing') : t('photoRound.addPhoto')}
				fileLabel={parsing ? t('photoRound.analyzing') : t('photoRound.pickFile')}
				accept="image/*"
				cameraAccept="image/*"
				disabled={parsing}
				onSelect={handlePhotoFile}
			/>
		{/if}

		{#if showZonePicker}
			<details class="zone-optional" bind:open={zonePickerOpen}>
				<summary data-testid="photo-round-zone-toggle">{t('photoRound.zoneOptional')}</summary>
				<label class="same-as-last">
					<input
						type="checkbox"
						checked={sameAsLastTime}
						onchange={(e) => {
							sameAsLastTime = (e.currentTarget as HTMLInputElement).checked;
							if (sameAsLastTime) {
								const remembered = getLastPhotoRoundLocation();
								if (remembered) selectZone(remembered);
							}
						}}
					/>
					<span>{t('photoRound.sameAsLastTime')}</span>
				</label>
				<div class="zone-grid" role="group" aria-label={t('photoRound.zoneAria')}>
					{#each LOCATIONS as loc (loc)}
						<Button
							type="button"
							variant="secondary"
							fullWidth
							data-testid="photo-round-zone-{loc}"
							aria-pressed={zone === loc}
							onclick={() => selectZone(loc)}
						>
							{locationLabel(getLocale(), loc)}
						</Button>
					{/each}
				</div>
			</details>
		{/if}

		<div class="capture-actions">
			<Button
				type="button"
				data-testid="photo-round-analyze"
				disabled={photos.length === 0 || parsing}
				loading={parsing}
				loadingLabel={t('photoRound.analyzing')}
				onclick={analyzePhotos}
			>
				{t('photoRound.analyze')}
			</Button>
		</div>

		{#if parseError}
			<div data-testid="photo-round-parse-error">
				<FeedbackBanner tone="error" message={parseError} />
			</div>
		{/if}
	</section>
{:else}
	<section data-testid="photo-round-review">
		<h2 class="title">
			{t('photoRound.reviewTitle', { selected: selectedCount, total: lines.length })}
		</h2>
		<p class="hint">{t('photoRound.reviewHint')}</p>
		<p class="hint"><a href={manualAddLink}>{t('photoRound.missingItemLink')}</a></p>
		{#if showFewItemsHint}
			<FeedbackBanner tone="info" message={t('photoRound.fewItemsHint')} />
		{/if}
		{#if !initialLocation && zoneConfidence && zoneConfidence !== 'high'}
			<FeedbackBanner tone="info" message={t('photoRound.zoneUncertain', { zone: locationLabel(getLocale(), zone) })} />
		{/if}

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
							onItemSaved?.();
						},
						syncPhotoRoundFormData
					)
				: bindSubmittingWithRedirect(
						(v) => (bulkSubmitting = v),
						async () => {
							const uid = page.data.user?.id;
							if (shouldShowOnboarding(uid)) {
								const selectedLines = lines.filter((line) => selected[line.id]);
								recordOnboardingScanSaveSync(
									uid,
									selectedLines.map((line) => ({
										name: line.name,
										location: line.location,
										expiresOn: line.expiresOn
									}))
								);
							} else {
								recordFirstItemActivation(uid);
							}
						},
						syncPhotoRoundFormData
					)}
		>
			<input type="hidden" name="bulkFlow" value="photo" />
			<input type="hidden" name="returnTo" value={returnTo} />
			<ul class="line-list" data-testid="photo-round-line-list">
				{#each lines as line, index (line.id)}
					<li data-testid="photo-round-line-{index}">
						<div class="line-top">
							<label class="line-check">
								<input
									type="checkbox"
									data-testid="photo-round-line-checkbox-{index}"
									name="selected"
									value={line.id}
									checked={selected[line.id]}
									onchange={(e) => {
										selected[line.id] = (e.currentTarget as HTMLInputElement).checked;
									}}
								/>
								<span class="confidence" data-confidence={line.confidence}>
									{confidenceLabel(line.confidence)}
								</span>
							</label>
							<button type="button" class="link-btn" onclick={() => removeLine(line.id)}>
								{t('common.delete')}
							</button>
						</div>
						<div class="line-fields">
							<label>
								<span>{t('photoRound.fieldName')}</span>
								<input
									type="text"
									data-testid="photo-round-line-name-{index}"
									value={line.name}
									oninput={(e) =>
										updateLine(line.id, {
											name: (e.currentTarget as HTMLInputElement).value
										})}
								/>
							</label>
							<label>
								<span>{t('photoRound.fieldQuantity')}</span>
								<input
									type="text"
									inputmode="decimal"
									value={line.quantity}
									oninput={(e) =>
										updateLine(line.id, {
											quantity: (e.currentTarget as HTMLInputElement).value
										})}
								/>
							</label>
							<label>
								<span>{t('photoRound.fieldUnit')}</span>
								<input
									type="text"
									value={line.unit ?? ''}
									oninput={(e) =>
										updateLine(line.id, {
											unit: (e.currentTarget as HTMLInputElement).value || null
										})}
								/>
							</label>
							<label>
								<span>{t('photoRound.fieldLocation')}</span>
								<select
									data-testid="photo-round-line-location-{index}"
									value={line.location}
									onchange={(e) =>
										updateLine(line.id, {
											location: (e.currentTarget as HTMLSelectElement).value as StorageLocation
										})}
								>
									{#each LOCATIONS as loc (loc)}
										<option value={loc}>{locationLabel(getLocale(), loc)}</option>
									{/each}
								</select>
							</label>
							<label>
								<div class="expiry-label-row">
									<span>{t('photoRound.fieldExpiresOn')}</span>
									{#if line.expiresOnAiInferred && line.expiresOn}
										<Badge tone="default">{t('learning.estimatedExpiry')}</Badge>
									{/if}
								</div>
								<input
									type="date"
									data-testid="photo-round-line-expires-{index}"
									value={line.expiresOn ?? ''}
									oninput={(e) =>
										updateLine(line.id, {
											expiresOn: (e.currentTarget as HTMLInputElement).value || null,
											expiresOnAiInferred: false
										})}
								/>
							</label>
							{#if line.confidence === 'low'}
								<details class="notes-details">
									<summary>{t('photoRound.fieldNotes')}</summary>
									<label>
										<span class="sr-only">{t('photoRound.fieldNotes')}</span>
										<input
											type="text"
											data-testid="photo-round-line-notes-{index}"
											value={line.notes ?? ''}
											oninput={(e) =>
												updateLine(line.id, {
													notes: (e.currentTarget as HTMLInputElement).value || null
												})}
										/>
									</label>
								</details>
							{:else}
								<label>
									<span>{t('photoRound.fieldNotes')}</span>
									<input
										type="text"
										data-testid="photo-round-line-notes-{index}"
										value={line.notes ?? ''}
										oninput={(e) =>
											updateLine(line.id, {
												notes: (e.currentTarget as HTMLInputElement).value || null
											})}
									/>
								</label>
							{/if}
						</div>
						{#if mergeCandidates[line.id]}
							<label class="merge-hint">
								<input
									type="checkbox"
									checked={mergeSelected[line.id]}
									onchange={(e) => {
										mergeSelected[line.id] = (e.currentTarget as HTMLInputElement).checked;
									}}
								/>
								<span>
									{t('inventory.mergeExisting', {
										name: mergeCandidates[line.id]!.name,
										quantity: mergeCandidates[line.id]!.quantity,
										unit: mergeCandidates[line.id]!.unit ?? ''
									})}
								</span>
							</label>
						{/if}
						{#if selected[line.id]}
							<input type="hidden" name={`name_${line.id}`} value={line.name} />
							<input type="hidden" name={`quantity_${line.id}`} value={line.quantity} />
							<input type="hidden" name={`unit_${line.id}`} value={line.unit ?? ''} />
							<input type="hidden" name={`location_${line.id}`} value={line.location} />
							<input type="hidden" name={`expiresOn_${line.id}`} value={line.expiresOn ?? ''} />
							<input type="hidden" name={`notes_${line.id}`} value={line.notes ?? ''} />
							{#if mergeSelected[line.id] && mergeCandidates[line.id]}
								<input type="hidden" name={`merge_${line.id}`} value={mergeCandidates[line.id]!.id} />
							{/if}
						{/if}
					</li>
				{/each}
			</ul>

			<div class="actions">
				<Button type="button" variant="secondary" onclick={requestNewRound}>
					{t('photoRound.newRound')}
				</Button>
				<Button
					type="submit"
					data-testid="photo-round-submit"
					disabled={selectedCount === 0}
					loading={bulkSubmitting}
					loadingLabel={t('photoRound.saving')}
				>
					{t('photoRound.addCount', { count: selectedCount })}
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
		context="photoRoundDiscardReview"
		copyOptions={{ count: lines.length }}
		onConfirm={resetReview}
	/>
{/if}

<style>
	.lead {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.privacy {
		margin: 0 0 var(--space-md);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.hint {
		margin: 0 0 var(--space-md);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.zone-optional {
		margin: 0 0 var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.zone-optional summary {
		cursor: pointer;
		padding: 0.55rem 0.75rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.zone-optional .zone-grid {
		padding: 0 0.75rem 0.75rem;
	}

	.zone-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.same-as-last {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 0 var(--space-sm) var(--space-sm);
	}

	.zone-grid :global(.btn) {
		min-height: 2.75rem;
	}

	.photo-list {
		list-style: none;
		margin: 0 0 var(--space-md);
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.photo-list li {
		position: relative;
		width: 6.5rem;
	}

	.photo-list img {
		width: 100%;
		height: 6.5rem;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.remove-photo {
		position: absolute;
		top: 0.15rem;
		right: 0.15rem;
		border: none;
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		font-size: 0.7rem;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: 0;
		cursor: pointer;
	}

	.capture-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
	}

	.capture-actions :global(.btn) {
		flex: 1;
		min-height: 2.75rem;
	}

	.title {
		margin: 0 0 var(--space-sm);
		font-size: 1.1rem;
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

	.line-list > li {
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.merge-hint {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.line-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.line-check {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.confidence {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.line-fields {
		display: grid;
		gap: var(--space-sm);
	}

	.line-fields label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.85rem;
	}

	.line-fields label span {
		color: var(--color-text-muted);
	}

	.line-fields input,
	.line-fields select {
		padding: 0.45rem 0.55rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.expiry-label-row {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.notes-details {
		font-size: 0.85rem;
	}

	.notes-details summary {
		cursor: pointer;
		color: var(--color-text-muted);
		margin-bottom: 0.2rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.actions {
		display: flex;
		gap: var(--space-sm);
	}

	.actions :global(.btn) {
		flex: 1;
		min-height: 2.75rem;
	}

	@media (max-width: 899px) {
		.actions {
			position: sticky;
			bottom: calc(var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom, 0));
			z-index: 1;
			margin-bottom: 0;
			padding-top: var(--space-sm);
			padding-bottom: var(--space-sm);
			background: linear-gradient(
				to top,
				var(--color-bg) 78%,
				color-mix(in srgb, var(--color-bg) 0%, transparent)
			);
		}
	}
</style>
