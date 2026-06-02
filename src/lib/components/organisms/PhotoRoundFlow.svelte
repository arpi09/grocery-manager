<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import ImageSourcePicker from '$lib/components/molecules/ImageSourcePicker.svelte';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import { bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import type { PhotoRoundDetectedItem } from '$lib/domain/photo-round';
	import { PHOTO_ROUND_MAX_IMAGES } from '$lib/domain/photo-round';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { onMount } from 'svelte';

	interface Props {
		returnTo: string;
	}

	let { returnTo }: Props = $props();

	type Step = 'zone' | 'capture' | 'review';

	type ReviewLine = PhotoRoundDetectedItem & { id: number };

	let step = $state<Step>('zone');
	let zone = $state<StorageLocation | null>(null);
	let photos = $state<{ file: File; previewUrl: string }[]>([]);
	let parsing = $state(false);
	let parseError = $state<string | null>(null);
	let lines = $state<ReviewLine[]>([]);
	let selected = $state<Record<number, boolean>>({});
	let bulkSubmitting = $state(false);
	let discardReviewOpen = $state(false);
	let nextLineId = $state(0);

	const cancelHref = $derived(returnTo);
	const canAddPhoto = $derived(photos.length < PHOTO_ROUND_MAX_IMAGES);

	function confidenceLabel(confidence: PhotoRoundDetectedItem['confidence']): string {
		if (confidence === 'high') return t('photoRound.confidenceHigh');
		if (confidence === 'medium') return t('photoRound.confidenceMedium');
		return t('photoRound.confidenceLow');
	}

	function selectZone(next: StorageLocation) {
		zone = next;
		step = 'capture';
		parseError = null;
	}

	function revokePreviews() {
		for (const photo of photos) {
			URL.revokeObjectURL(photo.previewUrl);
		}
	}

	function resetCapture() {
		revokePreviews();
		photos = [];
		parseError = null;
	}

	function backToZone() {
		resetCapture();
		step = 'zone';
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
		if (response.status >= 500) {
			return t('errors.api.openAiNotConfigured');
		}
		return t('photoRound.parseFailed');
	}

	async function analyzePhotos() {
		if (!zone || photos.length === 0) return;
		parsing = true;
		parseError = null;

		const formData = new FormData();
		formData.append('zone', zone);
		for (const photo of photos) {
			formData.append('images', photo.file);
		}

		try {
			const response = await fetch('/api/inventory/photo-scan', { method: 'POST', body: formData });
			const contentType = response.headers.get('content-type') ?? '';
			const data: { items?: PhotoRoundDetectedItem[]; error?: string } = contentType.includes(
				'application/json'
			)
				? await response.json()
				: {};

			if (!response.ok || !data.items) {
				parseError = parseFailureMessage(response, data);
				return;
			}

			if (data.items.length === 0) {
				parseError = t('photoRound.noItems');
				return;
			}

			lines = data.items.map((item) => {
				const id = nextLineId++;
				return { ...item, id };
			});
			selected = Object.fromEntries(lines.map((line) => [line.id, true]));
			revokePreviews();
			photos = [];
			step = 'review';
		} catch {
			parseError = t('photoRound.networkError');
		} finally {
			parsing = false;
		}
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
		parseError = null;
		step = 'zone';
		zone = null;
	}

	const selectedCount = $derived(lines.filter((line) => selected[line.id]).length);

	onMount(() => {
		return () => revokePreviews();
	});
</script>

{#if step === 'zone'}
	<section>
		<p class="lead">{t('photoRound.zoneLead')}</p>
		<div class="zone-grid" role="group" aria-label={t('photoRound.zoneAria')}>
			{#each LOCATIONS as loc (loc)}
				<Button type="button" variant="secondary" fullWidth onclick={() => selectZone(loc)}>
					{locationLabel(getLocale(), loc)}
				</Button>
			{/each}
		</div>
	</section>
	<ScanFlowFooter {cancelHref} cancelLabel={t('common.cancel')} />
{:else if step === 'capture' && zone}
	<section>
		<p class="lead">
			{t('photoRound.captureLead', { zone: locationLabel(getLocale(), zone), count: photos.length, max: PHOTO_ROUND_MAX_IMAGES })}
		</p>
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

		<div class="capture-actions">
			<Button type="button" variant="secondary" onclick={backToZone} disabled={parsing}>
				{t('photoRound.changeZone')}
			</Button>
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
	<ScanFlowFooter {cancelHref} cancelLabel={t('common.cancel')} />
{:else}
	<section data-testid="photo-round-review">
		<h2 class="title">
			{t('photoRound.reviewTitle', { selected: selectedCount, total: lines.length })}
		</h2>
		<p class="hint">{t('photoRound.reviewHint')}</p>

		<div class="select-actions">
			<button type="button" class="link-btn" onclick={() => toggleAll(true)}>{t('common.selectAll')}</button>
			<button type="button" class="link-btn" onclick={() => toggleAll(false)}>{t('common.deselectAll')}</button>
		</div>

		<form
			method="POST"
			action="?/bulkCreate"
			use:enhance={bindSubmittingWithRedirect(
				(v) => (bulkSubmitting = v),
				async () => {}
			)}
		>
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
						</div>
						{#if selected[line.id]}
							<input type="hidden" name={`name_${line.id}`} value={line.name} />
							<input type="hidden" name={`quantity_${line.id}`} value={line.quantity} />
							<input type="hidden" name={`unit_${line.id}`} value={line.unit ?? ''} />
							<input type="hidden" name={`location_${line.id}`} value={line.location} />
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
	<ScanFlowFooter {cancelHref} cancelLabel={t('common.cancel')} />

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

	.zone-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
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
		top: 0.25rem;
		right: 0.25rem;
		border: none;
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		font-size: 0.7rem;
		padding: 0.15rem 0.35rem;
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

	.actions {
		display: flex;
		gap: var(--space-sm);
	}

	.actions :global(.btn) {
		flex: 1;
		min-height: 2.75rem;
	}
</style>
