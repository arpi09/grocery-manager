<script lang="ts">
	import { page } from '$app/state';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import PhotoRoundFlow from '$lib/components/organisms/PhotoRoundFlow.svelte';
	import ReceiptBulkAddFlow from '$lib/components/organisms/ReceiptBulkAddFlow.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';
	import { INKOP_PATH } from '$lib/navigation/app-home';
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
		/** When set, limits picker and can auto-open a single flow (binary onboarding). */
		allowedModes?: ScanPick[];
		/** Receipt review expiry estimates — defaults to app layout flag. */
		shelfLifeEstimatesInReceipt?: boolean;
	}

	let {
		open,
		onClose,
		onItemSaved,
		defaultLocation = 'fridge',
		allowedModes,
		shelfLifeEstimatesInReceipt: shelfLifeEstimatesInReceiptProp
	}: Props = $props();

	const shelfLifeEstimatesInReceipt = $derived(
		shelfLifeEstimatesInReceiptProp ?? page.data.shelfLifeEstimatesInReceipt ?? false
	);

	let activeFlow = $state<ScanPick | null>(null);

	const userId = $derived(page.data.user?.id ?? null);
	const returnTo = INKOP_PATH;

	function closeFlow() {
		if (visibleModes.length === 1) {
			closePicker();
			return;
		}
		activeFlow = null;
	}

	function closePicker() {
		activeFlow = null;
		onClose();
	}

	const visibleModes = $derived(
		allowedModes && allowedModes.length > 0
			? allowedModes
			: (['photo', 'barcode', 'receipt'] as ScanPick[])
	);

	const showPicker = $derived(open && activeFlow === null && visibleModes.length > 1);

	$effect(() => {
		if (!open || activeFlow !== null || visibleModes.length !== 1) {
			return;
		}
		pickMode(visibleModes[0]!);
	});

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
	open={showPicker}
	onClose={closePicker}
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
		{#if visibleModes.includes('photo')}
		<button
			type="button"
			class="picker-tile picker-tile-primary"
			data-testid="onboarding-scan-photo"
			data-analytics-id="onboarding.scan_photo"
			onclick={() => pickMode('photo')}
		>
			<span class="picker-icon" aria-hidden="true">
				<FeatureIcon id="photo" size={24} />
			</span>
			<span class="picker-label">{t('photoRound.title')}</span>
		</button>
		{/if}

		{#if visibleModes.includes('barcode')}
		<button
			type="button"
			class="picker-tile"
			data-testid="onboarding-scan-barcode"
			data-analytics-id="onboarding.scan_barcode"
			onclick={() => pickMode('barcode')}
		>
			<span class="picker-icon" aria-hidden="true">
				<FeatureIcon id="barcode" size={22} />
			</span>
			<span class="picker-label">{t('scan.modes.barcode')}</span>
		</button>
		{/if}

		{#if visibleModes.includes('receipt')}
		<button
			type="button"
			class="picker-tile"
			data-testid="onboarding-scan-receipt"
			data-analytics-id="onboarding.scan_receipt"
			onclick={() => pickMode('receipt')}
		>
			<span class="picker-icon" aria-hidden="true">
				<FeatureIcon id="receipt" size={22} />
			</span>
			<span class="picker-label">{t('scan.modes.receipt')}</span>
		</button>
		{/if}
	</div>

	{#snippet footer()}
		<div class="picker-footer">
			<button
				type="button"
				class="picker-dismiss"
				data-testid="onboarding-scan-cancel"
				onclick={closePicker}
			>
				{t('onboarding.backToGuide')}
			</button>
		</div>
	{/snippet}
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
			onCancel={closeFlow}
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
		<ReceiptBulkAddFlow
			{returnTo}
			embedded
			prominentGuide
			formAction="/scan?/bulkCreate"
			shelfLifeEstimatesInReceipt={shelfLifeEstimatesInReceipt}
			onItemSaved={handleReceiptSaved}
			onCancel={closeFlow}
		/>
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

	:global(.onboarding-scan-picker-panel .modal-footer) {
		padding: var(--space-md) var(--space-md) 0;
		border-top: 1px solid var(--color-border);
	}

	.picker-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.picker-footer {
		display: flex;
		justify-content: center;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.picker-dismiss {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.5rem 1.25rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		font: inherit;
		font-weight: 600;
		font-size: var(--font-size-body-sm);
		text-decoration: none;
		cursor: pointer;
	}

	.picker-dismiss:hover {
		color: var(--color-text);
		background: var(--color-surface-muted);
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
