<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import type { DataGridSortDirection } from '$lib/domain/data-grid-state';
	import { t } from '$lib/i18n';

	interface FilterOption {
		value: string;
		label: string;
	}

	interface SortOption {
		key: string;
		label: string;
	}

	interface Props {
		open: boolean;
		query: string;
		filter: string;
		sortKey: string;
		sortDirection: DataGridSortDirection;
		filterOptions: FilterOption[];
		sortOptions: SortOption[];
		filterLegend?: string;
		onFilterChange: (filter: string) => void;
		onSortChange: (key: string, direction: DataGridSortDirection) => void;
		onClose: () => void;
	}

	let {
		open,
		query = $bindable(''),
		filter,
		sortKey,
		sortDirection,
		filterOptions,
		sortOptions,
		filterLegend = t('dataGrid.filterLegend'),
		onFilterChange,
		onSortChange,
		onClose
	}: Props = $props();
</script>

<Modal
	{open}
	onClose={onClose}
	variant="sheet"
	title={t('dataGrid.filterSheetTitle')}
	data-testid="data-grid-filter-sheet"
>
	<div class="sheet-body">
		<div class="search-group">
			<label class="search-label" for="data-grid-filter-search">{t('dataGrid.searchLabel')}</label>
			<SearchInput
				id="data-grid-filter-search"
				bind:value={query}
				placeholder={t('dataGrid.searchPlaceholder')}
			/>
		</div>

		<fieldset class="group">
			<legend>{filterLegend}</legend>
			<div class="chip-grid">
				{#each filterOptions as option (option.value)}
					<button
						type="button"
						class="chip"
						aria-pressed={filter === option.value}
						onclick={() => onFilterChange(option.value)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</fieldset>

		<fieldset class="group">
			<legend>{t('dataGrid.sortLegend')}</legend>
			<div class="chip-grid">
				{#each sortOptions as option (option.key)}
					<button
						type="button"
						class="chip"
						aria-pressed={sortKey === option.key}
						onclick={() =>
							onSortChange(
								option.key,
								sortKey === option.key && sortDirection === 'asc' ? 'desc' : 'asc'
							)}
					>
						{option.label}
						{#if sortKey === option.key}
							<span class="dir" aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
				{/each}
			</div>
		</fieldset>
	</div>

	<div class="sheet-footer">
		<Button type="button" fullWidth onclick={onClose}>{t('dataGrid.filterApply')}</Button>
	</div>
</Modal>

<style>
	.sheet-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.search-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.search-label {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.group {
		margin: 0;
		padding: 0;
		border: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	legend {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-text-muted);
		padding: 0;
	}

	.chip-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		min-height: var(--touch-target-min);
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: inherit;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.chip[aria-pressed='true'] {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-primary);
	}

	.dir {
		font-size: 0.75rem;
	}

	.sheet-footer {
		margin-top: var(--space-md);
	}
</style>
