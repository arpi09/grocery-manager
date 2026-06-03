<script lang="ts">
	import Label from '$lib/components/atoms/Label.svelte';
	import {
		INVENTORY_UNITS,
		isKnownUnit,
		normalizeUnitInput,
		suggestUnitForName
	} from '$lib/domain/inventory-units';
	import { t } from '$lib/i18n';

	interface Props {
		id?: string;
		name?: string;
		value?: string;
		productName?: string;
		error?: boolean;
	}

	let {
		id = 'unit',
		name = 'unit',
		value = $bindable(''),
		productName = '',
		error = false
	}: Props = $props();

	const options = $derived(INVENTORY_UNITS);

	$effect(() => {
		if (value.trim() || !productName.trim()) return;
		value = suggestUnitForName(productName);
	});
</script>

<Label for={id}>{t('common.unit')}</Label>
<select
	{id}
	{name}
	class="select"
	class:error
	bind:value
	onchange={(e) => {
		value = normalizeUnitInput((e.currentTarget as HTMLSelectElement).value);
	}}
	aria-invalid={error || undefined}
>
	<option value="">{t('item.unitNone')}</option>
	{#if value.trim() && !isKnownUnit(value)}
		<option value={value}>{value}</option>
	{/if}
	{#each options as unit (unit)}
		<option value={unit}>{unit}</option>
	{/each}
</select>

<style>
	.select {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font: inherit;
	}

	.select.error {
		border-color: var(--color-danger);
	}
</style>
