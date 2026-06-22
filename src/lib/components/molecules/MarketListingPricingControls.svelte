<script lang="ts">
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import SkaffuSettingsToggleRow from '$lib/components/molecules/SkaffuSettingsToggleRow.svelte';
	import { calculateAskingPriceSek, DEFAULT_PORTION_PERCENT } from '$lib/domain/market-pricing';
	import { t } from '$lib/i18n';

	interface Props {
		pricingEnabled?: boolean;
		portionPercent?: number;
		pricePercent?: number;
		referencePriceSek?: number | null;
		disabled?: boolean;
		onPricingEnabledChange?: (enabled: boolean) => void;
		onPortionPercentChange?: (value: number) => void;
		onPricePercentChange?: (value: number) => void;
	}

	let {
		pricingEnabled = false,
		portionPercent = DEFAULT_PORTION_PERCENT,
		pricePercent = 50,
		referencePriceSek = null,
		disabled = false,
		onPricingEnabledChange,
		onPortionPercentChange,
		onPricePercentChange
	}: Props = $props();

	const portionOptions = [100, 75, 50, 25] as const;

	const previewPriceSek = $derived.by(() => {
		if (!pricingEnabled || referencePriceSek == null || referencePriceSek <= 0) {
			return null;
		}
		return calculateAskingPriceSek(referencePriceSek, portionPercent, pricePercent);
	});

	const previewLabel = $derived(
		previewPriceSek == null
			? t('marketV04.pricePreviewUnavailable')
			: t('marketV04.pricePreview', { amount: previewPriceSek })
	);
</script>

<div class="pricing-controls" data-testid="market-listing-pricing-controls">
	<SkaffuSettingsToggleRow
		title={t('marketV04.pricingEnableTitle')}
		note={t('marketV04.pricingEnableNote')}
		last={false}
	>
		{#snippet control()}
			<Toggle
				checked={pricingEnabled}
				label={t('marketV04.pricingEnableLabel')}
				disabled={disabled}
				toggleNotify={(enabled) => onPricingEnabledChange?.(enabled)}
			/>
		{/snippet}
	</SkaffuSettingsToggleRow>

	{#if pricingEnabled}
		<fieldset class="control-block" disabled={disabled}>
			<legend>{t('marketV04.portionLabel')}</legend>
			<div class="chip-row" role="group" aria-label={t('marketV04.portionLabel')}>
				{#each portionOptions as option (option)}
					<button
						type="button"
						class="chip"
						class:chip-active={portionPercent === option}
						aria-pressed={portionPercent === option}
						onclick={() => onPortionPercentChange?.(option)}
					>
						{t('marketV04.portionOption', { percent: option })}
					</button>
				{/each}
			</div>
		</fieldset>

		<div class="control-block">
			<label class="slider-label" for="market-price-percent">
				<span>{t('marketV04.pricePercentLabel')}</span>
				<span class="slider-value">{t('marketV04.pricePercentValue', { percent: pricePercent })}</span>
			</label>
			<input
				id="market-price-percent"
				class="slider"
				type="range"
				min="1"
				max="100"
				step="1"
				value={pricePercent}
				disabled={disabled}
				oninput={(event) => {
					const value = Number((event.currentTarget as HTMLInputElement).value);
					onPricePercentChange?.(value);
				}}
			/>
		</div>

		<p class="preview" data-testid="market-price-preview">{previewLabel}</p>
		{#if referencePriceSek != null && referencePriceSek > 0}
			<p class="reference-note">
				{t('marketV04.referencePriceNote', {
					amount: Math.round(referencePriceSek)
				})}
			</p>
		{:else if pricingEnabled}
			<p class="reference-note muted">{t('marketV04.referencePriceMissing')}</p>
		{/if}
	{:else}
		<p class="free-note">{t('marketV04.pricingFreeDefaultNote')}</p>
	{/if}
</div>

<style>
	.pricing-controls {
		display: grid;
		gap: var(--space-md);
	}

	.control-block {
		margin: 0;
		padding: 0;
		border: 0;
		display: grid;
		gap: var(--space-sm);
	}

	.control-block legend,
	.slider-label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.slider-label {
		display: flex;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.slider-value {
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.chip {
		min-height: var(--touch-target-min, 2.75rem);
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.chip-active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-primary);
	}

	.chip:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.slider {
		width: 100%;
		accent-color: var(--color-primary);
	}

	.preview {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
	}

	.reference-note,
	.free-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		max-width: 42ch;
	}

	.reference-note.muted {
		font-style: italic;
	}
</style>
