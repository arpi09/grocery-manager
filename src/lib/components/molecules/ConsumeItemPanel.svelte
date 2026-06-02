<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
	import { t } from '$lib/i18n';

	interface Props {
		item: InventoryItem;
		action: string;
		formId?: string;
		variant?: 'menu' | 'form';
		onClose?: () => void;
	}

	let {
		item,
		action,
		formId: formIdProp,
		variant = 'menu',
		onClose
	}: Props = $props();

	const formId = $derived(formIdProp ?? `consume-${item.id}`);
	const stock = $derived(parseNumericQuantity(item.quantity));
	const unitSuffix = $derived(item.unit ? ` ${item.unit}` : '');
	const stockLabel = $derived(`${item.quantity}${unitSuffix}`.trim());

	let customAmount = $state('');
	let selectedPreset = $state<'lite' | 'half' | 'all' | ''>('');
</script>

<form
	id={formId}
	method="POST"
	{action}
	class="consume-panel"
	class:consume-panel--form={variant === 'form'}
	onsubmit={() => onClose?.()}
	use:enhance
>
	<p class="lead">{t('consume.intro', { name: item.name, stock: stockLabel })}</p>

	<div class="presets" role="group" aria-label={t('consume.presetsAria')}>
		<label class="preset">
			<input type="radio" name="consumptionPreset" value="lite" bind:group={selectedPreset} />
			<span>{t('consume.presetLite')}</span>
		</label>
		<label class="preset">
			<input type="radio" name="consumptionPreset" value="half" bind:group={selectedPreset} />
			<span>{t('consume.presetHalf')}</span>
		</label>
		<label class="preset">
			<input type="radio" name="consumptionPreset" value="all" bind:group={selectedPreset} />
			<span>{t('consume.presetAll')}</span>
		</label>
	</div>

	{#if stock !== null}
		<div class="custom">
			<label for="{formId}-amount">{t('consume.customLabel')}</label>
			<div class="custom-row">
				<Input
					id="{formId}-amount"
					name="consumptionAmount"
					type="text"
					inputmode="decimal"
					placeholder={t('consume.customPlaceholder')}
					bind:value={customAmount}
					oninput={() => {
						selectedPreset = '';
					}}
				/>
				{#if item.unit}
					<span class="unit">{item.unit}</span>
				{/if}
			</div>
		</div>
	{/if}

	<div class="actions">
		{#if onClose}
			<Button type="button" variant="ghost" onclick={onClose}>{t('common.cancel')}</Button>
		{/if}
		<Button type="submit" variant={variant === 'form' ? 'secondary' : 'primary'}>
			{t('consume.confirm')}
		</Button>
	</div>
</form>

<style>
	.consume-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: min(18rem, 100%);
		padding: var(--space-xs) 0 0;
	}

	.consume-panel--form {
		padding: var(--space-md) 0 0;
		border-top: 1px dashed var(--color-border);
		margin-top: var(--space-sm);
	}

	.lead {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.presets {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-xs);
	}

	.preset {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.5rem 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		text-align: center;
	}

	.preset:has(input:checked) {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.preset input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.custom label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 0.25rem;
	}

	.custom-row {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.unit {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.consume-panel--form .actions :global(button[type='submit']) {
		flex: 1;
	}
</style>
