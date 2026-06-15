<script lang="ts">
	import { onMount } from 'svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Label from '$lib/components/atoms/Label.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import UnitSelect from '$lib/components/molecules/UnitSelect.svelte';
	import { guessShelfLife } from '$lib/domain/shelf-life';
	import ConsumeItemPanel from '$lib/components/molecules/ConsumeItemPanel.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';

	import { getLocale, t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import type { InventoryItem } from '$lib/domain/inventory-item';

	interface Props {
		item?: InventoryItem;
		defaultLocation?: StorageLocation;
		returnTo?: string;
		errors?: Record<string, string[]>;
		consumeErrors?: Record<string, string[]>;
	}

	let { item, defaultLocation = 'fridge', returnTo, errors = {}, consumeErrors = {} }: Props = $props();

	const isEdit = !!item;
	const scanInsteadHref = $derived(returnTo ? scanHubHref(returnTo) : '/scan');

	let name = $state(item?.name ?? '');
	let quantity = $state(item?.quantity ?? '1');
	let unit = $state(item?.unit ?? '');
	let notes = $state(item?.notes ?? '');
	let expiresOn = $state(item?.expiresOn ?? '');
	let expiresOnAiInferred = $state(item?.expiresOnSource === 'ai_inferred');
	let location = $state<StorageLocation>(item?.location ?? defaultLocation);

	onMount(() => {
		name = item?.name ?? '';
		quantity = item?.quantity ?? '1';
		unit = item?.unit ?? '';
		notes = item?.notes ?? '';
		expiresOn = item?.expiresOn ?? '';
		expiresOnAiInferred = item?.expiresOnSource === 'ai_inferred';
		location = item?.location ?? defaultLocation;
	});

	function applyShelfLifeGuess() {
		const inferred = guessShelfLife(name, location);
		if (inferred) {
			expiresOn = inferred.expiresOn;
			expiresOnAiInferred = true;
		}
	}

	function handleNameOrLocationChange() {
		if (!isEdit && !expiresOn) {
			applyShelfLifeGuess();
		}
	}
</script>

<form
	method="POST"
	action={isEdit ? '?/save' : '?/create'}
	class="form"
>
	{#if !isEdit && returnTo}
		<input type="hidden" name="returnTo" value={returnTo} />
	{/if}
	{#if !isEdit && returnTo}
		<p class="scan-link-row">
			<a href={scanInsteadHref} class="scan-instead-link" data-analytics-id="item.scan_instead_link">{t('item.scanInsteadLink')}</a>
		</p>
	{/if}

	<div class="field name-field">
		<Label for="name">{t('common.name')}</Label>
		<Input
			id="name"
			name="name"
			bind:value={name}
			error={!!errors.name}
			required
			onchange={handleNameOrLocationChange}
		/>
		{#if errors.name}
			<p class="error">{errors.name[0]}</p>
		{/if}
	</div>

	<div class="field">
		<Label for="location">{t('common.place')}</Label>
		<select
			id="location"
			name="location"
			class="select"
			bind:value={location}
			onchange={handleNameOrLocationChange}
		>
			{#each LOCATIONS as loc}
				<option value={loc}>{locationLabel(getLocale(), loc)}</option>
			{/each}
		</select>
		{#if errors.location}
			<p class="error">{errors.location[0]}</p>
		{/if}
	</div>

	<div class="row">
		<div class="field">
			<Label for="quantity">{t('common.quantity')}</Label>
			<Input
				id="quantity"
				name="quantity"
				type="text"
				inputmode="decimal"
				bind:value={quantity}
				error={!!errors.quantity}
				required
			/>
			{#if errors.quantity}
				<p class="error">{errors.quantity[0]}</p>
			{/if}
		</div>
		<div class="field">
			<UnitSelect id="unit" name="unit" bind:value={unit} productName={name} />
		</div>
	</div>

	<div class="field">
		<div class="expiry-label-row">
			<Label for="expiresOn">{t('item.bestBefore')}</Label>
			{#if expiresOnAiInferred && expiresOn}
				<Badge tone="default">{t('learning.estimatedExpiry')}</Badge>
			{/if}
		</div>
		<Input
			id="expiresOn"
			name="expiresOn"
			type="date"
			bind:value={expiresOn}
			onchange={() => {
				expiresOnAiInferred = false;
			}}
		/>
	</div>

	<div class="field">
		<Label for="notes">{t('item.notesOptional')}</Label>
		<textarea id="notes" name="notes" class="textarea" rows="3" bind:value={notes}></textarea>
	</div>


	<div class="actions">
		<Button type="submit" fullWidth>{isEdit ? t('item.saveChanges') : t('item.addSubmit')}</Button>
	</div>
</form>

{#if isEdit}
	<div class="secondary-actions">
		{#if item}
			<section class="consumption-section" aria-labelledby="consumption-section-title">
				<h2 id="consumption-section-title" class="section-title">{t('consume.sectionTitle')}</h2>
				<p class="section-help">{t('consume.sectionHelp')}</p>
				<ConsumeItemPanel
					{item}
					action="?/markAsFinished"
					variant="form"
					{consumeErrors}
				/>
			</section>
		{/if}
		<DeleteConfirmButton
			tier={2}
			context="inventoryItem"
			copyOptions={{ itemName: name || item?.name }}
			action="?/delete"
			fullWidth
			label={t('item.deleteItem')}
			ariaLabel={t('item.deleteItemNamed', {
				name: name || item?.name || t('common.unknownProduct')
			})}
		/>
	</div>
{/if}

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.scan-instead-link {
		margin: 0 0 var(--space-sm);
		text-align: right;
		font-size: var(--font-size-body-sm);
	}

	.scan-instead-link a {
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.scan-instead-link a:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.field {
		margin-bottom: var(--space-md);
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	.select,
	.textarea {
		width: 100%;
		box-sizing: border-box;
		min-height: max(2.8125rem, var(--touch-target-min));
		line-height: 1.4;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
	}

	.select {
		height: max(2.8125rem, var(--touch-target-min));
	}

	@media (max-width: 899px) {
		.textarea,
		.barcode-row :global(input) {
			min-height: max(2.8125rem, var(--touch-target-min));
		}
	}

	.expiry-label-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.expiry-prompt {
		margin-top: var(--space-sm);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.expiry-prompt p {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.expiry-prompt-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.error {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-danger);
	}

	.actions,
	.secondary-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	.consumption-section {
		margin: var(--space-md) 0;
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.section-title {
		margin: 0 0 var(--space-xs);
		font-size: 0.95rem;
		font-weight: 700;
	}

	.section-help {
		margin: 0 0 var(--space-sm);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
