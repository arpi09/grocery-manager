<script lang="ts">
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import { t } from '$lib/i18n';
	import type { InventoryExpiryFilter } from '$lib/utils/inventory-list-filters';

	interface FilterOption {
		value: InventoryExpiryFilter;
		label: string;
	}

	interface SectionChip {
		label: string;
		pressed: boolean;
		loading?: boolean;
		count?: number;
		onClick: () => void;
	}

	interface Props {
		query?: string;
		expiryFilter: InventoryExpiryFilter;
		onExpiryFilterChange: (filter: InventoryExpiryFilter) => void;
		sortChipLabel?: string;
		onSortChipClick?: () => void;
		/** Mobile inventory: collapse expiry chips into one row. */
		compact?: boolean;
		/** Auto-expired / finished toggles merged into compact chip row. */
		sectionChips?: SectionChip[];
	}

	let {
		query = $bindable(''),
		expiryFilter,
		onExpiryFilterChange,
		sortChipLabel,
		onSortChipClick,
		compact = false,
		sectionChips = []
	}: Props = $props();

	const filterOptions: FilterOption[] = [
		{ value: 'all', label: t('inventory.expiryFilterAll') },
		{ value: 'expiring', label: t('inventory.expiryFilterSoon') },
		{ value: 'dated', label: t('inventory.expiryFilterDated') },
		{ value: 'noExpiry', label: t('inventory.expiryFilterNoExpiry') }
	];

	let filtersOpen = $state(false);

	const activeFilterLabel = $derived(
		filterOptions.find((option) => option.value === expiryFilter)?.label ?? t('inventory.toolbarFilter')
	);

	const filterChipLabel = $derived(
		expiryFilter === 'all' ? t('inventory.toolbarFilter') : activeFilterLabel
	);

	function selectFilter(value: InventoryExpiryFilter) {
		onExpiryFilterChange(value);
		filtersOpen = false;
	}

	function toggleFilters() {
		filtersOpen = !filtersOpen;
	}
</script>

<div class="list-toolbar" class:list-toolbar--compact={compact} data-testid="inventory-list-toolbar">
	<div class="toolbar-row" class:toolbar-row--primary={compact}>
		<div class="search-wrap">
			<SearchInput bind:value={query} placeholder={t('inventory.searchPlaceholder')} />
		</div>

		{#if compact}
			<div class="chip-row">
				<button
					type="button"
					class="filter-chip filter-chip--toggle"
					aria-expanded={filtersOpen}
					aria-controls="inventory-expiry-filter-panel"
					data-testid="inventory-filter-toggle"
					onclick={toggleFilters}
				>
					{filterChipLabel}
				</button>

				{#if sortChipLabel && onSortChipClick}
					<button type="button" class="sort-chip" onclick={onSortChipClick}>
						{sortChipLabel}
					</button>
				{/if}

				{#each sectionChips as chip, index (index)}
					<button
						type="button"
						class="section-chip"
						aria-pressed={chip.pressed}
						disabled={chip.loading}
						onclick={chip.onClick}
					>
						{chip.label}
						{#if chip.count !== undefined}
							<span class="section-count">{chip.count}</span>
						{/if}
					</button>
				{/each}
			</div>
		{:else if sortChipLabel && onSortChipClick}
			<button type="button" class="sort-chip" onclick={onSortChipClick}>
				{sortChipLabel}
			</button>
		{/if}
	</div>

	{#if compact && filtersOpen}
		<div
			id="inventory-expiry-filter-panel"
			class="filter-chips filter-chips--panel"
			role="group"
			aria-label={t('inventory.expiryFilterLabel')}
			data-testid="inventory-expiry-filter"
		>
			{#each filterOptions as option (option.value)}
				<button
					type="button"
					class="filter-chip"
					aria-pressed={expiryFilter === option.value}
					onclick={() => selectFilter(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{:else if !compact}
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
	{/if}
</div>

<style>
	.list-toolbar {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.list-toolbar--compact {
		gap: var(--space-xs);
	}

	.toolbar-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: 0;
	}

	.toolbar-row--primary {
		flex-wrap: wrap;
	}

	.search-wrap {
		flex: 1 1 8rem;
		min-width: 0;
	}

	.chip-row {
		display: flex;
		flex: 1 1 auto;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
		min-width: 0;
	}

	.filter-chips {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.filter-chips--panel {
		flex-wrap: wrap;
		padding-top: var(--space-xs);
	}

	.filter-chip {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: var(--space-xs) var(--space-sm);
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

	.filter-chip--toggle[aria-expanded='true'] {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-primary);
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
		padding: var(--space-xs) var(--space-sm);
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

	.section-chip {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		min-height: var(--touch-target-min);
		padding: var(--space-xs) var(--space-sm);
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

	.section-chip:hover:not(:disabled) {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.section-chip:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.section-chip[aria-pressed='true'] {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-primary);
	}

	.section-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		padding: 0 var(--space-xs);
		font-size: 0.6875rem;
		font-weight: 700;
		border-radius: 999px;
		background: var(--color-surface-muted);
		color: inherit;
	}

	.section-chip[aria-pressed='true'] .section-count {
		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
	}
</style>
