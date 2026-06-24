<script lang="ts">
	import FilterListIcon from '$lib/components/atoms/FilterListIcon.svelte';
	import DataGridBulkBar from '$lib/components/molecules/DataGridBulkBar.svelte';
	import DataGridFilterSheet from '$lib/components/molecules/DataGridFilterSheet.svelte';
	import DataGridPagination from '$lib/components/molecules/DataGridPagination.svelte';
	import SkaffuDataTable from '$lib/components/molecules/SkaffuDataTable.svelte';
	import type { DataGridPageSize, DataGridSortDirection } from '$lib/domain/data-grid-state';
	import { t } from '$lib/i18n';
	import { Body, Cell, Head, Row } from '@smui/data-table';
	import type { Snippet } from 'svelte';

	interface FilterOption {
		value: string;
		label: string;
	}

	interface SortOption {
		key: string;
		label: string;
	}

	interface Props {
		title: string;
		tableAriaLabel: string;
		query: string;
		filter: string;
		sortKey: string;
		sortDirection: DataGridSortDirection;
		page: number;
		pageSize: DataGridPageSize;
		totalCount: number;
		rangeStart: number;
		rangeEnd: number;
		pageCount: number;
		filterOptions: FilterOption[];
		sortOptions: SortOption[];
		filterLegend?: string;
		selectedCount?: number;
		selectionEnabled?: boolean;
		selectAllChecked?: boolean;
		selectAllIndeterminate?: boolean;
		onQueryChange: (query: string) => void;
		onFilterChange: (filter: string) => void;
		onSortChange: (key: string, direction: DataGridSortDirection) => void;
		onPageChange: (page: number) => void;
		onPageSizeChange: (pageSize: DataGridPageSize) => void;
		onSelectAllChange?: (checked: boolean) => void;
		tableHead?: Snippet;
		tableBody: Snippet;
		bulkActions?: Snippet;
		class?: string;
		dataTestId?: string;
	}

	let {
		title,
		tableAriaLabel,
		query = $bindable(''),
		filter,
		sortKey,
		sortDirection,
		page,
		pageSize,
		totalCount,
		rangeStart,
		rangeEnd,
		pageCount,
		filterOptions,
		sortOptions,
		filterLegend,
		selectedCount = 0,
		selectionEnabled = false,
		selectAllChecked = false,
		selectAllIndeterminate = false,
		onQueryChange,
		onFilterChange,
		onSortChange,
		onPageChange,
		onPageSizeChange,
		onSelectAllChange,
		tableHead,
		tableBody,
		bulkActions,
		class: className = '',
		dataTestId = 'data-grid'
	}: Props = $props();

	let filterSheetOpen = $state(false);
	let selectAllInput = $state<HTMLInputElement | null>(null);
	let lastSyncedQuery = $state(query);

	$effect(() => {
		if (query === lastSyncedQuery) {
			return;
		}
		lastSyncedQuery = query;
		onQueryChange(query);
	});

	$effect(() => {
		if (selectAllInput) {
			selectAllInput.indeterminate = selectAllIndeterminate;
		}
	});

	function openFilterSheet() {
		filterSheetOpen = true;
	}

	function closeFilterSheet() {
		filterSheetOpen = false;
	}
</script>

<section class="skaffu-data-grid {className}" data-testid={dataTestId}>
	<header class="grid-header">
		<h2 class="grid-title">{title}</h2>
		<button
			type="button"
			class="filter-btn"
			aria-label={t('dataGrid.openFilter')}
			data-testid="data-grid-filter-button"
			onclick={openFilterSheet}
		>
			<FilterListIcon />
		</button>
	</header>

	<DataGridBulkBar {selectedCount} actions={bulkActions} />

	<div class="table-scroll">
		<SkaffuDataTable ariaLabel={tableAriaLabel} stickyHeader data-testid={`${dataTestId}-table`}>
			{#snippet head()}
				<Head>
					<Row>
						{#if selectionEnabled}
							<Cell class="col-checkbox">
								<label class="select-all">
									<input
										bind:this={selectAllInput}
										type="checkbox"
										checked={selectAllChecked}
										aria-label={t('dataGrid.selectAll')}
										onchange={(event) => onSelectAllChange?.(event.currentTarget.checked)}
									/>
								</label>
							</Cell>
						{/if}
						{#if tableHead}
							{@render tableHead()}
						{/if}
					</Row>
				</Head>
			{/snippet}
			{#snippet body()}
				<Body>
					{@render tableBody()}
				</Body>
			{/snippet}
		</SkaffuDataTable>
	</div>

	<DataGridPagination
		{page}
		{pageSize}
		{totalCount}
		{rangeStart}
		{rangeEnd}
		{pageCount}
		{onPageChange}
		{onPageSizeChange}
	/>
</section>

<DataGridFilterSheet
	open={filterSheetOpen}
	bind:query
	{filter}
	{sortKey}
	{sortDirection}
	{filterOptions}
	{sortOptions}
	{filterLegend}
	{onFilterChange}
	{onSortChange}
	onClose={closeFilterSheet}
/>

<style>
	.skaffu-data-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		min-width: 0;
	}

	.grid-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-width: 0;
	}

	.grid-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.filter-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.table-scroll {
		overflow-x: auto;
		min-width: 0;
	}

	.select-all {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
	}

	.select-all input {
		width: 1.125rem;
		height: 1.125rem;
	}

	@media (max-width: 640px) {
		.skaffu-data-grid {
			padding: var(--space-sm);
		}
	}
</style>
