<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import PhotoRoundFlow from '$lib/components/organisms/PhotoRoundFlow.svelte';
	import ReceiptBulkAddFlow from '$lib/components/organisms/ReceiptBulkAddFlow.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t } from '$lib/i18n';
	import type { StorageLocation } from '$lib/domain/location';
	import {
		recordBarcodeActivation,
		recordFirstItemActivation,
		recordReceiptActivation,
		setActivationPath
	} from '$lib/utils/onboarding';

	type ScanPick = 'barcode' | 'photo' | 'receipt';

	interface Props {
		open: boolean;
		onClose: () => void;
		onItemSaved: () => void;
		defaultLocation?: StorageLocation;
	}

	let { open, onClose, onItemSaved, defaultLocation = 'fridge' }: Props = $props();

	let activeFlow = $state<ScanPick | null>(null);

	const userId = $derived(page.data.user?.id ?? null);
	const returnTo = APP_HOME_PATH;

	function closeFlow() {
		activeFlow = null;
	}

	function closeAll() {
		activeFlow = null;
		onClose();
	}

	function pickMode(mode: ScanPick) {
		if (userId) {
			setActivationPath(mode === 'photo' ? 'photo' : mode, userId);
		}
		activeFlow = mode;
	}

	function handleBarcodeSaved() {
		recordBarcodeActivation(userId);
		onItemSaved();
		closeFlow();
	}

	function handlePhotoSaved() {
		recordFirstItemActivation(userId);
		onItemSaved();
		closeFlow();
	}

	function handleReceiptSaved() {
		recordReceiptActivation(userId);
		onItemSaved();
		closeFlow();
	}
</script>

<Modal
	open={open && activeFlow === null}
	onClose={closeAll}
	variant="sheet"
	nested
	dismissible={true}
	panelClass="onboarding-scan-picker-panel"
	title={t('onboarding.scanModalTitle')}
	label={t('onboarding.scanModalAria')}
	data-testid="onboarding-scan-picker"
>
	<p class="picker-lead">{t('onboarding.scanModalBody')}</p>

	<div class="picker-grid">
		<button
			type="button"
			class="picker-tile picker-tile-primary"
			data-testid="onboarding-scan-photo"
			onclick={() => pickMode('photo')}
		>
			<span class="picker-icon" aria-hidden="true">
				<FeatureIcon id="photo" size={24} />
			</span>
			<span class="picker-label">{t('photoRound.title')}</span>
		</button>

		<button
			type="button"
			class="picker-tile"
			data-testid="onboarding-scan-barcode"
			onclick={() => pickMode('barcode')}
		>
			<span class="picker-icon" aria-hidden="true">
				<FeatureIcon id="barcode" size={22} />
			</span>
			<span class="picker-label">{t('scan.modes.barcode')}</span>
		</button>

		<button
			type="button"
			class="picker-tile"
			data-testid="onboarding-scan-receipt"
			onclick={() => pickMode('receipt')}
		>
			<span class="picker-icon" aria-hidden="true">
				<FeatureIcon id="receipt" size={22} />
			</span>
			<span class="picker-label">{t('scan.modes.receipt')}</span>
		</button>
	</div>

	<Button type="button" variant="ghost" fullWidth onclick={closeAll}>{t('common.cancel')}</Button>
</Modal>

{#if activeFlow === 'barcode'}
	<Modal
		open
		onClose={closeFlow}
		variant="sheet"
		nested
		dismissible={true}
		panelClass="onboarding-scan-flow-panel"
		title={t('scan.barcodeTitle')}
		subtitle={t('scan.barcodeSubtitle')}
	>
		<ScanToAddFlow
			{defaultLocation}
			{returnTo}
			embedded
			formAction="/scan?/create"
			onItemSaved={handleBarcodeSaved}
		/>
	</Modal>
{/if}

{#if activeFlow === 'photo'}
	<Modal
		open
		onClose={closeFlow}
		variant="sheet"
		nested
		dismissible={true}
		panelClass="onboarding-scan-flow-panel"
		title={t('photoRound.title')}
		subtitle={t('photoRound.subtitle')}
	>
		<PhotoRoundFlow
			{returnTo}
			initialLocation={defaultLocation}
			embedded
			formAction="/scan?/bulkCreate"
			onItemSaved={handlePhotoSaved}
		/>
	</Modal>
{/if}

{#if activeFlow === 'receipt'}
	<Modal
		open
		onClose={closeFlow}
		variant="sheet"
		nested
		dismissible={true}
		panelClass="onboarding-scan-flow-panel"
		title={t('scan.receiptPage.title')}
		subtitle={t('scan.receiptPage.subtitle')}
	>
		<ReceiptBulkAddFlow {returnTo} embedded formAction="/scan?/bulkCreate" onItemSaved={handleReceiptSaved} />
	</Modal>
{/if}

<style>
	:global(.onboarding-scan-picker-panel) {
		width: min(420px, calc(100vw - 2 * var(--space-md)));
	}

	:global(.onboarding-scan-flow-panel) {
		width: min(520px, calc(100vw - 2 * var(--space-md)));
		max-height: min(92dvh, 40rem);
	}

	:global(.onboarding-scan-flow-panel .modal-body) {
		overflow-y: auto;
	}

	.picker-lead {
		margin: 0 0 var(--space-md);
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.picker-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.picker-tile {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		width: 100%;
		min-height: var(--touch-target-min);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		cursor: pointer;
		text-align: left;
	}

	.picker-tile-primary {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.picker-tile:hover {
		border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
	}

	.picker-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.picker-label {
		font-size: 1rem;
		font-weight: 600;
	}
</style>
