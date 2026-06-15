<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import type { PantryBridgePreview } from '$lib/application/shopping-to-pantry.service';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import {
		SHOPPING_TO_PANTRY_MODES,
		type ShoppingToPantryMode
	} from '$lib/domain/shopping-to-pantry';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	interface Props {
		open: boolean;
		item: ShoppingListItem | null;
		preview: PantryBridgePreview | null;
		mode: ShoppingToPantryMode;
		onClose: () => void;
		onSkip: () => void;
		onAdded?: (message: string) => void;
	}

	let {
		open,
		item,
		preview,
		mode,
		onClose,
		onSkip,
		onAdded
	}: Props = $props();

	let location = $state<StorageLocation>('cupboard');
	let merge = $state(true);
	let submitting = $state(false);
	let modeLocal = $state<ShoppingToPantryMode>(mode);
	let adjustOpen = $state(false);

	$effect(() => {
		if (preview) {
			location = preview.location;
			merge = Boolean(preview.mergeCandidate);
		}
		modeLocal = mode;
		if (!open) {
			adjustOpen = false;
		}
	});

	const amountLabel = $derived.by(() => {
		if (!item || !preview) return '';
		const qty = preview.quantity;
		const unit = preview.unit;
		if (unit) return `${qty} ${unit}`;
		return qty;
	});

	const primaryLabel = $derived(
		preview
			? t('shopping.pantryBridge.yesLocation', {
					location: locationLabel(getLocale(), location),
					amount: amountLabel
				})
			: t('shopping.pantryBridge.yes', { amount: amountLabel })
	);

	function modeLabel(value: ShoppingToPantryMode): string {
		return t(`shopping.pantryBridge.mode.${value}`);
	}
</script>

<Modal
	{open}
	variant="sheet"
	title={t('shopping.pantryBridge.title')}
	subtitle={item ? t('shopping.pantryBridge.subtitle', { name: item.name }) : undefined}
	onClose={onClose}
	data-testid="shopping-to-pantry-sheet"
>
	{#if item && preview}
		<div class="actions">
			<form
				method="POST"
				action="?/addToPantry"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						await update();
						submitting = false;
						if (result.type === 'success' && result.data && 'pantryAdded' in result.data) {
							const data = result.data as { pantryAdded?: { message?: string } };
							onAdded?.(data.pantryAdded?.message ?? t('shopping.pantryBridge.added'));
							onClose();
						}
					};
				}}
			>
				<input type="hidden" name="shoppingItemId" value={item.id} />
				<input type="hidden" name="location" value={location} />
				<input type="hidden" name="quantity" value={preview.quantity} />
				<input type="hidden" name="unit" value={preview.unit ?? ''} />
				<input type="hidden" name="merge" value={merge ? '1' : '0'} />
				<input type="hidden" name="shoppingToPantryMode" value={modeLocal} />
				<Button type="submit" fullWidth loading={submitting} loadingLabel={t('common.saving')}>
					{primaryLabel}
				</Button>
			</form>
			<Button type="button" variant="ghost" fullWidth onclick={onSkip}>
				{t('shopping.pantryBridge.no')}
			</Button>
		</div>

		<details class="adjust" bind:open={adjustOpen}>
			<summary>{t('shopping.pantryBridge.adjust')}</summary>
			<label class="field">
				<span>{t('common.place')}</span>
				<select bind:value={location}>
					{#each LOCATIONS as loc (loc)}
						<option value={loc}>{locationLabel(getLocale(), loc)}</option>
					{/each}
				</select>
			</label>

			{#if preview.mergeCandidate}
				<label class="merge-check">
					<input type="checkbox" bind:checked={merge} />
					<span>
						{t('inventory.mergeExisting', {
							name: preview.mergeCandidate.name,
							quantity: preview.mergeCandidate.quantity,
							unit: preview.mergeCandidate.unit ?? ''
						})}
					</span>
				</label>
			{/if}

			<label class="field">
				<span>{t('shopping.pantryBridge.modeLabel')}</span>
				<select bind:value={modeLocal}>
					{#each SHOPPING_TO_PANTRY_MODES as value (value)}
						<option {value}>{modeLabel(value)}</option>
					{/each}
				</select>
			</label>
		</details>
	{/if}
</Modal>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.field select {
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font: inherit;
	}

	.merge-check {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.loop-hint {
		margin: 0 0 var(--space-md);
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
		line-height: 1.45;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.adjust {
		margin-top: var(--space-md);
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-sm);
	}

	.adjust summary {
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary);
		list-style: none;
	}

	.adjust summary::-webkit-details-marker {
		display: none;
	}

	.adjust[open] summary {
		margin-bottom: var(--space-md);
	}
</style>
