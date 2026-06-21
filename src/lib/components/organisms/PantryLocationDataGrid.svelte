<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import LocationColorDot from '$lib/components/atoms/LocationColorDot.svelte';
	import ProductAvatar from '$lib/components/atoms/ProductAvatar.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import InventoryListMeta from '$lib/components/molecules/InventoryListMeta.svelte';
	import LocationTab from '$lib/components/molecules/LocationTab.svelte';
	import SkaffuDataGrid from '$lib/components/organisms/SkaffuDataGrid.svelte';
	import {
		fetchInventoryActivePage,
		fetchInventorySearch
	} from '$lib/client/inventory-data';
	import type { DataGridPageSize, DataGridSortDirection } from '$lib/domain/data-grid-state';
	import { runDataGridPipeline } from '$lib/domain/data-grid-state';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import type { StorageLocation } from '$lib/domain/location';
	import { daysUntilExpiry, formatExpiryDate, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { buildPantryTile } from '$lib/domain/pantry-shelf';
	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { buildDataGridUrl, parseDataGridStateFromSearchParams } from '$lib/utils/data-grid-url';
	import {
		DEFAULT_INVENTORY_SORT,
		DEFAULT_INVENTORY_SORT_DIRECTION,
		pantryLocationGridAdapters,
		parseInventoryExpiryFilter,
		parseInventorySortKey,
		type InventoryExpiryFilter,
		type InventorySortKey
	} from '$lib/utils/inventory-list-filters';
	import { Cell, Row } from '@smui/data-table';
	import type { FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';

	interface Props {
		items: InventoryItem[];
		activeTotal: number;
		location?: StorageLocation;
		allLocations?: boolean;
		canWrite?: boolean;
		canConsume?: boolean;
		hasInventory?: boolean;
		onAddClick?: () => void;
		onItemNavigate?: (itemId: string, location?: StorageLocation) => void;
	}

	let {
		items,
		activeTotal,
		location,
		allLocations = false,
		canWrite = false,
		canConsume = false,
		hasInventory = true,
		onAddClick,
		onItemNavigate
	}: Props = $props();

	const canConsumeItems = $derived(canWrite || canConsume);
	const inventoryPath = $derived(allLocations ? '/inventory/all' : `/inventory/${location}`);
	const locationName = $derived(
		location ? locationLabel(getLocale(), location).toLowerCase() : ''
	);

	const gridDefaults = {
		filter: 'all' as InventoryExpiryFilter,
		sort: DEFAULT_INVENTORY_SORT,
		dir: DEFAULT_INVENTORY_SORT_DIRECTION as DataGridSortDirection
	};

	let loadedItems = $state<InventoryItem[]>([]);
	let searchResults = $state<InventoryItem[]>([]);
	let searching = $state(false);
	let loadingMore = $state(false);
	let selectedIds = $state(new Set<string>());
	let bulkSubmitting = $state(false);

	let query = $state('');
	let debouncedQuery = $state('');

	const gridState = $derived(
		parseDataGridStateFromSearchParams(
			page.url.searchParams,
			parseInventoryExpiryFilter,
			parseInventorySortKey,
			gridDefaults
		)
	);

	$effect.pre(() => {
		loadedItems = items;
		searchResults = [];
		selectedIds = new Set();
	});

	$effect(() => {
		query = gridState.q;
	});

	$effect(() => {
		if (!browser) return;
		const current = query;
		const timer = window.setTimeout(() => {
			debouncedQuery = current;
		}, 200);
		return () => window.clearTimeout(timer);
	});

	$effect(() => {
		const trimmed = debouncedQuery.trim();
		const loc = location;
		if (!browser || allLocations || trimmed.length < 2 || !loc) {
			searchResults = [];
			searching = false;
			return;
		}

		let cancelled = false;
		searching = true;
		void fetchInventorySearch(loc, trimmed)
			.then((result) => {
				if (!cancelled) searchResults = result.items;
			})
			.finally(() => {
				if (!cancelled) searching = false;
			});

		return () => {
			cancelled = true;
		};
	});

	const isServerSearch = $derived(!allLocations && debouncedQuery.trim().length >= 2);
	const sourceRows = $derived(isServerSearch ? searchResults : loadedItems);

	const pipeline = $derived(
		runDataGridPipeline(sourceRows, gridState, pantryLocationGridAdapters)
	);

	const pageRowIds = $derived(pipeline.pageRows.map((item) => item.id));
	const selectedCount = $derived(selectedIds.size);
	const selectAllChecked = $derived(
		pageRowIds.length > 0 && pageRowIds.every((id) => selectedIds.has(id))
	);
	const selectAllIndeterminate = $derived(
		pageRowIds.some((id) => selectedIds.has(id)) && !selectAllChecked
	);

	const hasMoreActive = $derived(!allLocations && !isServerSearch && loadedItems.length < activeTotal);

	const trimmedQuery = $derived(query.trim());
	const isSearchEmpty = $derived(trimmedQuery.length > 0 && !searching && pipeline.totalCount === 0);
	const isFilterEmpty = $derived(
		gridState.filter !== 'all' && trimmedQuery.length === 0 && !searching && pipeline.totalCount === 0
	);

	const emptyTitle = $derived(
		isSearchEmpty
			? t('inventory.noResults')
			: isFilterEmpty
				? t('inventory.filterEmptyTitle')
				: allLocations
					? t('inventory.allEmptyTitle')
					: t('inventory.emptyTitle', { location: locationName })
	);

	const emptyDescription = $derived(
		isSearchEmpty
			? t('inventory.tryOtherSearch')
			: isFilterEmpty
				? t('inventory.filterEmptyDescription')
				: allLocations
					? canWrite
						? t('inventory.allEmptyCanWriteShort')
						: t('inventory.allEmptyReadonly')
					: canWrite
						? t('inventory.emptyCanWriteShort', { location: locationName })
						: t('inventory.emptyReadonly', { location: locationName })
	);

	const locationIcons: Record<StorageLocation, FeatureIconId> = {
		fridge: 'fridge',
		freezer: 'freezer',
		cupboard: 'cupboard'
	};

	$effect(() => {
		if (!browser) return;
		const next = debouncedQuery;
		if (next === gridState.q) return;
		navigateGridState({ q: next, resetPage: true });
	});

	const filterOptions = $derived([
		{ value: 'all', label: t('inventory.expiryFilterAll') },
		{ value: 'expiring', label: t('inventory.expiryFilterSoon') },
		{ value: 'dated', label: t('inventory.expiryFilterDated') },
		{ value: 'noExpiry', label: t('inventory.expiryFilterNoExpiry') }
	]);

	const sortOptions = $derived([
		{ key: 'name', label: t('dataGrid.sort.name') },
		{ key: 'quantity', label: t('dataGrid.sort.quantity') },
		{ key: 'expiry', label: t('dataGrid.sort.expiry') }
	]);

	function navigateGridState(
		patch: Partial<typeof gridState> & { resetPage?: boolean }
	) {
		if (!browser) return;
		const { resetPage, ...rest } = patch;
		const next = {
			...gridState,
			...rest,
			page: resetPage ? 1 : (rest.page ?? gridState.page)
		};
		void goto(buildDataGridUrl(inventoryPath, next, gridDefaults, page.url.searchParams), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleQueryChange(nextQuery: string) {
		void nextQuery;
	}

	function handleFilterChange(filter: string) {
		navigateGridState({ filter: filter as InventoryExpiryFilter, resetPage: true });
	}

	function handleSortChange(key: string, direction: DataGridSortDirection) {
		navigateGridState({
			sort: key as InventorySortKey,
			dir: direction,
			resetPage: true
		});
	}

	function handleHeaderSort(key: InventorySortKey) {
		if (gridState.sort === key) {
			handleSortChange(key, gridState.dir === 'asc' ? 'desc' : 'asc');
			return;
		}
		handleSortChange(key, 'asc');
	}

	function handlePageChange(nextPage: number) {
		navigateGridState({ page: nextPage });
	}

	function handlePageSizeChange(pageSize: DataGridPageSize) {
		navigateGridState({ pageSize, resetPage: true });
	}

	function toggleRowSelection(itemId: string, checked: boolean) {
		const next = new Set(selectedIds);
		if (checked) {
			next.add(itemId);
		} else {
			next.delete(itemId);
		}
		selectedIds = next;
	}

	function handleSelectAllChange(checked: boolean) {
		const next = new Set(selectedIds);
		for (const id of pageRowIds) {
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
		}
		selectedIds = next;
	}

	function sortHint(key: InventorySortKey): string {
		if (gridState.sort !== key) {
			return t('inventory.sortColumnInactive', { column: columnLabel(key) });
		}
		return gridState.dir === 'asc'
			? t('inventory.sortColumnAsc', { column: columnLabel(key) })
			: t('inventory.sortColumnDesc', { column: columnLabel(key) });
	}

	function columnLabel(key: InventorySortKey): string {
		if (key === 'name') return t('inventory.columnName');
		if (key === 'quantity') return t('inventory.columnQuantity');
		return t('inventory.columnExpiry');
	}

	function formatQuantityCell(item: InventoryItem): string {
		const unitSuffix = item.unit ? ` ${item.unit}` : '';
		const amount = `${item.quantity}${unitSuffix}`.trim();
		const stock = parseNumericQuantity(item.quantity);
		if (stock !== null && stock > 0) {
			return t('inventory.quantityLeft', { amount });
		}
		return amount;
	}

	function expiryTone(date: string) {
		const days = daysUntilExpiry(date);
		return days >= 0 && days <= EXPIRING_SOON_DAYS ? 'warning' : 'default';
	}

	function navigateToItem(itemId: string, itemLocation?: StorageLocation) {
		onItemNavigate?.(itemId, itemLocation);
		void goto(`/item/${itemId}/edit`);
	}

	async function loadMoreActive() {
		if (!browser || allLocations || !location || loadingMore || !hasMoreActive) return;
		loadingMore = true;
		try {
			const nextPage = await fetchInventoryActivePage(location, loadedItems.length);
			loadedItems = [...loadedItems, ...nextPage.items];
		} finally {
			loadingMore = false;
		}
	}

	function clearBulkSelection() {
		selectedIds = new Set();
	}

	const bulkEnhance = () => {
		bulkSubmitting = true;
		return async ({ result }: { result: { type: string } }) => {
			bulkSubmitting = false;
			if (result.type === 'success') {
				clearBulkSelection();
				await invalidateAll();
			}
		};
	};
</script>

<div class="pantry-location-grid" data-testid="pantry-location-grid">
	{#if !allLocations && location}
		<div class="location-band">
			<LocationTab active={location} />
			{#if canWrite && onAddClick}
				<div class="add-row">
					<Button type="button" variant="primary" data-testid="inventory-add-goods" onclick={onAddClick}>
						{t('inventory.add')}
					</Button>
				</div>
			{/if}
		</div>
	{/if}

	{#if hasInventory}
		<SkaffuDataGrid
			title={allLocations ? t('inventory.allTitle') : locationLabel(getLocale(), location!)}
			tableAriaLabel={allLocations ? t('inventory.allListAria') : t('inventory.listAria')}
			bind:query
			filter={gridState.filter}
			sortKey={gridState.sort}
			sortDirection={gridState.dir}
			page={pipeline.page}
			pageSize={gridState.pageSize}
			totalCount={pipeline.totalCount}
			rangeStart={pipeline.rangeStart}
			rangeEnd={pipeline.rangeEnd}
			pageCount={pipeline.pageCount}
			{filterOptions}
			{sortOptions}
			filterLegend={t('inventory.expiryFilterLabel')}
			{selectedCount}
			selectionEnabled={canConsumeItems}
			{selectAllChecked}
			{selectAllIndeterminate}
			onQueryChange={handleQueryChange}
			onFilterChange={handleFilterChange}
			onSortChange={handleSortChange}
			onPageChange={handlePageChange}
			onPageSizeChange={handlePageSizeChange}
			onSelectAllChange={handleSelectAllChange}
			dataTestId="inventory"
		>
			{#snippet tableHead()}
				{#if allLocations}
					<Cell class="col-location">
						<span class="sr-only">{t('inventory.columnLocation')}</span>
					</Cell>
				{/if}
				<Cell class="col-thumb" />
				<Cell class="col-name">
					<button
						type="button"
						class="sort-header-btn"
						class:sort-header-btn--active={gridState.sort === 'name'}
						aria-label={sortHint('name')}
						onclick={() => handleHeaderSort('name')}
					>
						{t('inventory.columnName')}
						{#if gridState.sort === 'name'}
							<span class="sort-dir" aria-hidden="true">{gridState.dir === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
				</Cell>
				<Cell class="col-qty">
					<button
						type="button"
						class="sort-header-btn"
						class:sort-header-btn--active={gridState.sort === 'quantity'}
						aria-label={sortHint('quantity')}
						onclick={() => handleHeaderSort('quantity')}
					>
						{t('inventory.columnQuantity')}
						{#if gridState.sort === 'quantity'}
							<span class="sort-dir" aria-hidden="true">{gridState.dir === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
				</Cell>
				<Cell class="col-expiry">
					<button
						type="button"
						class="sort-header-btn"
						class:sort-header-btn--active={gridState.sort === 'expiry'}
						aria-label={sortHint('expiry')}
						onclick={() => handleHeaderSort('expiry')}
					>
						{t('inventory.columnExpiry')}
						{#if gridState.sort === 'expiry'}
							<span class="sort-dir" aria-hidden="true">{gridState.dir === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</button>
				</Cell>
			{/snippet}

			{#snippet tableBody()}
				{#each pipeline.pageRows as item (item.id)}
					<Row
						class="pantry-row"
						data-testid="inventory-row-{item.id}"
						onclick={() => navigateToItem(item.id, item.location)}
					>
						{#if canConsumeItems}
							<Cell class="col-checkbox">
								<label class="row-select" onclick={(event) => event.stopPropagation()}>
									<input
										type="checkbox"
										checked={selectedIds.has(item.id)}
										aria-label={item.name}
										onchange={(event) =>
											toggleRowSelection(item.id, event.currentTarget.checked)}
									/>
								</label>
							</Cell>
						{/if}
						{#if allLocations}
							<Cell class="col-location">
								<LocationColorDot location={item.location} itemId={item.id} />
							</Cell>
						{/if}
						<Cell class="col-thumb">
							{@const tile = buildPantryTile(item)}
							<ProductAvatar name={item.name} warn={tile.warn} size="sm" />
						</Cell>
						<Cell class="col-name">
							<div class="name-stack">
								<span class="item-name">{item.name}</span>
								<InventoryListMeta {item} />
							</div>
						</Cell>
						<Cell class="col-qty">
							<span class="item-qty">{formatQuantityCell(item)}</span>
						</Cell>
						<Cell class="col-expiry">
							{#if item.expiresOn}
								<Badge tone={expiryTone(item.expiresOn)}>
									{formatExpiryDate(item.expiresOn, getLocale())}
								</Badge>
							{/if}
						</Cell>
					</Row>
				{/each}
			{/snippet}

			{#snippet bulkActions()}
				{#if canConsumeItems}
					<form method="POST" action="?/bulkConsumeItems" use:enhance={bulkEnhance}>
						{#each [...selectedIds] as itemId (itemId)}
							<input type="hidden" name="itemIds" value={itemId} />
						{/each}
						<Button type="submit" variant="secondary" loading={bulkSubmitting}>
							{t('dataGrid.bulkConsume')}
						</Button>
					</form>
				{/if}
				{#if canWrite}
					<DeleteConfirmButton
						tier={1}
						context="inventoryItem"
						copyOptions={{ count: selectedCount }}
						action="?/bulkDeleteItems"
						variant="danger"
						label={t('dataGrid.bulkDelete')}
						submitEnhance={bulkEnhance}
					>
						{#each [...selectedIds] as itemId (itemId)}
							<input type="hidden" name="itemIds" value={itemId} />
						{/each}
					</DeleteConfirmButton>
				{/if}
			{/snippet}
		</SkaffuDataGrid>

		{#if hasMoreActive}
			<div class="load-more-row">
				<Button type="button" variant="secondary" loading={loadingMore} onclick={loadMoreActive}>
					{t('common.loadMore')}
				</Button>
			</div>
		{/if}
	{:else}
		<EmptyState
			title={emptyTitle}
			description={emptyDescription}
			iconId={allLocations ? 'cupboard' : locationIcons[location!]}
		/>
		{#if canWrite && onAddClick}
			<div class="empty-add-row">
				<Button type="button" variant="primary" onclick={onAddClick}>{t('inventory.add')}</Button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.pantry-location-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-width: 0;
	}

	.location-band {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.add-row,
	.empty-add-row,
	.load-more-row {
		display: flex;
		justify-content: flex-start;
	}

	.sort-header-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: 0 var(--space-xs);
		border: none;
		background: transparent;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.sort-header-btn:hover,
	.sort-header-btn--active {
		color: var(--color-text);
	}

	.sort-dir {
		font-size: 0.75rem;
	}

	:global(.pantry-row) {
		cursor: pointer;
	}

	.row-select {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
	}

	.row-select input {
		width: 1.125rem;
		height: 1.125rem;
	}

	.item-name {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.name-stack {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.item-qty {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	:global(.col-location) {
		width: 1.5rem;
		padding-inline: var(--space-xs) !important;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
