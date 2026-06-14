<script lang="ts">
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import { t } from '$lib/i18n';
	import type { InventoryExpiryFilter } from '$lib/utils/inventory-list-filters';

	interface FilterOption {
		value: InventoryExpiryFilter;
		label: string;
	}

	interface Props {
		query?: string;
		expiryFilter: InventoryExpiryFilter;
		onExpiryFilterChange: (filter: InventoryExpiryFilter) => void;
		sortChipLabel?: string;
		onSortChipClick?: () => void;
	}

	let {
		query = $bindable(''),
		expiryFilter,
		onExpiryFilterChange,
		sortChipLabel,
		onSortChipClick
	}: Props = $props();

	const filterOptions: FilterOption[] = [
		{ value: 'all', label: t('inventory.expiryFilterAll') },
		{ value: 'expiring', label: t('inventory.expiryFilterSoon') },
		{ value: 'dated', label: t('inventory.expiryFilterDated') },
		{ value: 'noExpiry', label: t('inventory.expiryFilterNoExpiry') }
	];
</script>

<div class="list-toolbar" data-testid="inventory-list-toolbar">
	<SearchInput bind:value={query} placeholder={t('inventory.searchPlaceholder')} />

	<div class="toolbar-row">
		<div
			class="filter-chips"
			role="group"
			aria-label={t('inventory.expiryFilterLabel')}
			data-testid="inventory-expiry-filter"
		>
			{#each filterOptions as option (option.value)}
				<button
					type="button"
					class="filter-chip"
					aria-pressed={expiryFilter === option.value}
					onclick={() => onExpiryFilterChange(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>

		{#if sortChipLabel && onSortChipClick}
			<button type="button" class="sort-chip" onclick={onSortChipClick}>
				{sortChipLabel}
			</button>
		{/if}
	</div>
</div>

<style>
	.list-toolbar {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.toolbar-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: 0;
	}

	.filter-chips {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.filter-chip {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.75rem;
		font-weight: 600;
		font-family: inherit;
		color: var(--color-text-muted);
		cursor: pointer;
		white-space: nowrap;
	}

	.filter-chip:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.filter-chip[aria-pressed='true'] {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-primary);
	}

	.sort-chip {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.75rem;
		font-weight: 600;
		font-family: inherit;
		color: var(--color-text-muted);
		cursor: pointer;
		white-space: nowrap;
	}

	.sort-chip:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
</style>
