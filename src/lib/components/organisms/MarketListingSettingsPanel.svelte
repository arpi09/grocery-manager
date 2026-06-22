<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import MarketListingPricingControls from '$lib/components/molecules/MarketListingPricingControls.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { calculateReferencePriceSek, DEFAULT_PORTION_PERCENT } from '$lib/domain/market-pricing';
	import { fetchPurchaseMemorySummary } from '$lib/client/price-memory';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface PreviewItem {
		id: string;
		name: string;
		quantity: string;
		unit: string | null;
	}

	interface Props {
		previewItem?: PreviewItem | null;
		autoNearbyListingEnabled?: boolean;
	}

	let { previewItem = null, autoNearbyListingEnabled = false }: Props = $props();

	let loading = $state(true);
	let saving = $state(false);
	let pricingEnabled = $state(false);
	let portionPercent = $state(DEFAULT_PORTION_PERCENT);
	let pricePercent = $state(50);
	let swishNumber = $state('');
	let referencePriceSek = $state<number | null>(null);

	async function loadSettings() {
		loading = true;
		try {
			const [settingsResponse, summary] = await Promise.all([
				fetch('/api/market/listing-settings'),
				previewItem
					? fetchPurchaseMemorySummary({
							inventoryItemId: previewItem.id,
							entryPoint: 'market_listing_publish'
						})
					: Promise.resolve(null)
			]);

			if (settingsResponse.ok) {
				const settings = (await settingsResponse.json()) as {
					marketDefaultPricePercent?: number | null;
					marketSwishNumber?: string | null;
				};
				const defaultPercent = settings.marketDefaultPricePercent;
				pricingEnabled = defaultPercent != null;
				pricePercent = defaultPercent ?? 50;
				swishNumber = settings.marketSwishNumber ?? '';
			}

			if (previewItem && summary?.lastPaid?.unitPrice) {
				referencePriceSek = calculateReferencePriceSek(
					summary.lastPaid.unitPrice,
					previewItem.quantity
				);
			} else {
				referencePriceSek = null;
			}
		} catch {
			referencePriceSek = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void previewItem?.id;
		void loadSettings();
	});

	async function saveSettings() {
		saving = true;
		try {
			const response = await fetch('/api/market/listing-settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					marketDefaultPricePercent: pricingEnabled ? pricePercent : null,
					marketSwishNumber: swishNumber.trim() || null
				})
			});
			const payload = (await response.json()) as { ok?: boolean; error?: string };
			if (!response.ok || !payload.ok) {
				showClientToast(payload.error ?? t('marketV04.settingsSaveFailed'), { variant: 'error' });
				return;
			}

			if (autoNearbyListingEnabled) {
				await fetch('/api/market/auto-listing-settings', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ enabled: true })
				});
			}

			await invalidateAll();
			showClientToast(t('marketV04.settingsSaved'), { variant: 'success' });
		} catch {
			showClientToast(t('marketV04.settingsSaveFailed'), { variant: 'error' });
		} finally {
			saving = false;
		}
	}
</script>

<SettingsSection
	id="market-listing-settings"
	title={t('marketV04.settingsTitle')}
	description={t('marketV04.settingsDescription')}
>
	{#if loading}
		<p class="status">{t('common.loading')}</p>
	{:else}
		<MarketListingPricingControls
			{pricingEnabled}
			{portionPercent}
			{pricePercent}
			{referencePriceSek}
			disabled={saving}
			onPricingEnabledChange={(enabled) => {
				pricingEnabled = enabled;
			}}
			onPortionPercentChange={(value) => {
				portionPercent = value;
			}}
			onPricePercentChange={(value) => {
				pricePercent = value;
			}}
		/>

		<p class="portion-save-note">{t('marketV04.portionPreviewOnlyNote')}</p>

		<form
			class="settings-form"
			onsubmit={(event) => {
				event.preventDefault();
				void saveSettings();
			}}
		>
			<FormField
				label={t('marketV04.swishNumberLabel')}
				name="marketSwishNumber"
				type="tel"
				autocomplete="tel"
				inputmode="tel"
				bind:value={swishNumber}
				placeholder={t('marketV04.swishNumberPlaceholder')}
			/>
			<p class="field-note">{t('marketV04.swishNumberNote')}</p>

			<div class="actions">
				<Button type="submit" loading={saving} loadingLabel={t('common.saving')}>
					{t('marketV04.settingsSaveBtn')}
				</Button>
			</div>
		</form>
	{/if}
</SettingsSection>

<style>
	.status,
	.field-note,
	.portion-save-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		max-width: 42ch;
	}

	.settings-form {
		display: grid;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
