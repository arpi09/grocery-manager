<script lang="ts">
	import { browser } from '$app/environment';
	import { deserialize, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from '$lib/components/atoms/Button.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import ShoppingToPantrySheet from '$lib/components/molecules/ShoppingToPantrySheet.svelte';
	import SkaffuDataGrid from '$lib/components/organisms/SkaffuDataGrid.svelte';
	import type { PantryBridgePreview } from '$lib/application/shopping-to-pantry.service';
	import { fetchCheckedShoppingItems } from '$lib/client/shopping-data';
	import {
		DEFAULT_DATA_GRID_PAGE,
		DEFAULT_DATA_GRID_PAGE_SIZE,
		DEFAULT_DATA_GRID_SORT_DIRECTION,
		runDataGridPipeline,
		type DataGridPageSize
	} from '$lib/domain/data-grid-state';
	import type { StorageLocation } from '$lib/domain/location';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
	import {
		DEFAULT_SHOPPING_LIST_FACET,
		DEFAULT_SHOPPING_LIST_SORT,
		parseShoppingListFacetFilter,
		parseShoppingListSortKey,
		shoppingListGridAdapters,
		type ShoppingListFacetFilter,
		type ShoppingListSortKey
	} from '$lib/domain/shopping-list-grid';
	import { t } from '$lib/i18n';
	import { INKOP_PATH } from '$lib/navigation/app-home';
	import {
		getPantryBridgeYesCountForUser,
		markFirstCheckoffCoachSeen,
		PANTRY_BRIDGE_ALWAYS_THRESHOLD,
		recordPantryBridgeYes,
		shouldShowFirstCheckoffCoach
	} from '$lib/utils/pantry-bridge-nudge';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		buildDataGridUrl,
		parseDataGridStateFromSearchParams
	} from '$lib/utils/data-grid-url';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import { Cell, Row } from '@smui/data-table';

	interface Props {
		uncheckedItems: ShoppingListItem[];
		checkedCount: number;
		canEdit: boolean;
		shoppingToPantryMode: ShoppingToPantryMode;
	}

	let { uncheckedItems, checkedCount, canEdit, shoppingToPantryMode }: Props = $props();

	const GRID_DEFAULTS = {
		filter: DEFAULT_SHOPPING_LIST_FACET,
		sort: DEFAULT_SHOPPING_LIST_SORT,
		dir: DEFAULT_DATA_GRID_SORT_DIRECTION,
		page: DEFAULT_DATA_GRID_PAGE,
		pageSize: DEFAULT_DATA_GRID_PAGE_SIZE
	};

	const shoppingEmptyScanHref = scanModeHref('receipt', INKOP_PATH);

	let checkedRows = $state<ShoppingListItem[]>([]);
	let checkedLoaded = $state(false);
	let loadingChecked = $state(false);
	let selectedIds = $state(new Set<string>());
	let bulkSubmitting = $state(false);
	let pantrySheetOpen = $state(false);
	let pantryBridgeItem = $state<ShoppingListItem | null>(null);
	let pantryBridgePreview = $state<PantryBridgePreview | null>(null);
	let pantryBridgeMode = $state<ShoppingToPantryMode>(shoppingToPantryMode);
	let showFirstPantryCoach = $state(false);

	const gridState = $derived(
		parseDataGridStateFromSearchParams<ShoppingListFacetFilter, ShoppingListSortKey>(
			page.url.searchParams,
			parseShoppingListFacetFilter,
			parseShoppingListSortKey,
			GRID_DEFAULTS
		)
	);

	const filterOptions = $derived([
		{ value: 'unchecked', label: t('dataGrid.facet.unchecked') },
		{ value: 'checked', label: t('dataGrid.facet.checked') },
		{ value: 'all', label: t('dataGrid.facet.all') }
	]);

	const sortOptions = $derived([
		{ key: 'name', label: t('dataGrid.sort.name') },
		{ key: 'added', label: t('dataGrid.sort.added') }
	]);

	const allRows = $derived.by(() => {
		if (gridState.filter === 'unchecked') {
			return uncheckedItems;
		}
		if (gridState.filter === 'checked') {
			return checkedLoaded ? checkedRows : [];
		}
		return [...uncheckedItems, ...(checkedLoaded ? checkedRows : [])];
	});

	const pipeline = $derived(runDataGridPipeline(allRows, gridState, shoppingListGridAdapters));

	const selectablePageRows = $derived(pipeline.pageRows.filter((row) => !row.checked && canEdit));
	const selectedCount = $derived(
		[...selectedIds].filter((id) => selectablePageRows.some((row) => row.id === id)).length
	);
	const selectAllChecked = $derived(
		selectablePageRows.length > 0 && selectablePageRows.every((row) => selectedIds.has(row.id))
	);
	const selectAllIndeterminate = $derived(
		selectablePageRows.some((row) => selectedIds.has(row.id)) && !selectAllChecked
	);

	const listEmpty = $derived(uncheckedItems.length === 0 && checkedCount === 0);
	const gridEmpty = $derived(!listEmpty && pipeline.totalCount === 0 && !loadingChecked);
	const columnCount = $derived((canEdit ? 1 : 0) + 3);

	$effect.pre(() => {
		void uncheckedItems.length;
		void checkedCount;
		checkedRows = [];
		checkedLoaded = false;
		selectedIds = new Set();
	});

	$effect(() => {
		pantryBridgeMode = shoppingToPantryMode;
	});

	$effect(() => {
		void gridState.page;
		void gridState.filter;
		void gridState.q;
		selectedIds = new Set();
	});

	$effect(() => {
		if (
			!browser ||
			checkedLoaded ||
			checkedCount === 0 ||
			(gridState.filter !== 'checked' && gridState.filter !== 'all')
		) {
			return;
		}
		void ensureCheckedLoaded();
	});

	function parseApiItem(raw: ShoppingListItem & { createdAt: string | Date; updatedAt: string | Date }) {
		return {
			...raw,
			createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt),
			updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt : new Date(raw.updatedAt)
		};
	}

	async function ensureCheckedLoaded() {
		if (checkedLoaded || checkedCount === 0 || !browser) {
			return;
		}

		loadingChecked = true;
		try {
			const checkedPage = await fetchCheckedShoppingItems();
			checkedRows = checkedPage.items.map((item) => parseApiItem(item as never));
			checkedLoaded = true;
		} finally {
			loadingChecked = false;
		}
	}

	function syncGridUrl(patch: Partial<typeof gridState>) {
		const next = { ...gridState, ...patch };
		const href = buildDataGridUrl(page.url.pathname, next, GRID_DEFAULTS, page.url.searchParams);
		void goto(href, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function formatQty(item: ShoppingListItem): string {
		if (item.quantity && item.unit) {
			return `${item.quantity} ${item.unit}`;
		}
		if (item.quantity) {
			return item.quantity;
		}
		return '';
	}

	function toggleSort(key: ShoppingListSortKey) {
		if (gridState.sort === key) {
			syncGridUrl({
				sort: key,
				dir: gridState.dir === 'asc' ? 'desc' : 'asc',
				page: DEFAULT_DATA_GRID_PAGE
			});
			return;
		}
		syncGridUrl({ sort: key, dir: 'asc', page: DEFAULT_DATA_GRID_PAGE });
	}

	function sortAria(key: ShoppingListSortKey): 'ascending' | 'descending' | 'none' {
		if (gridState.sort !== key) {
			return 'none';
		}
		return gridState.dir === 'asc' ? 'ascending' : 'descending';
	}

	function toggleSelected(id: string, checked: boolean) {
		const next = new Set(selectedIds);
		if (checked) {
			next.add(id);
		} else {
			next.delete(id);
		}
		selectedIds = next;
	}

	function handleSelectAllChange(checked: boolean) {
		if (!checked) {
			selectedIds = new Set();
			return;
		}
		selectedIds = new Set(selectablePageRows.map((row) => row.id));
	}

	function showSuccessToast(message: string) {
		showClientToast(message, { variant: 'success' });
	}

	function handlePantryAdded(message: string, location?: StorageLocation) {
		showSuccessToast(message);
		const userId = page.data.user?.id;
		if (!location || pantryBridgeMode === 'always' || !userId) {
			return;
		}
		recordPantryBridgeYes(userId, location);
	}

	function closePantrySheet() {
		pantrySheetOpen = false;
		pantryBridgeItem = null;
		pantryBridgePreview = null;
		showFirstPantryCoach = false;
	}

	function dismissFirstPantryCoach() {
		const userId = page.data.user?.id;
		if (userId) {
			markFirstCheckoffCoachSeen(userId);
		}
		showFirstPantryCoach = false;
	}

	async function autoAddPantryBridge(bridge: {
		item: ShoppingListItem;
		preview: PantryBridgePreview;
		mode: ShoppingToPantryMode;
	}): Promise<boolean> {
		const formData = new FormData();
		formData.set('shoppingItemId', bridge.item.id);
		formData.set('location', bridge.preview.location);
		formData.set('quantity', bridge.preview.quantity);
		formData.set('unit', bridge.preview.unit ?? '');
		formData.set('merge', bridge.preview.mergeCandidate ? '1' : '0');
		formData.set('shoppingToPantryMode', bridge.mode);

		try {
			const response = await fetch('?/addToPantry', {
				method: 'POST',
				body: formData,
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await response.text()) as {
				type: string;
				data?: { pantryAdded?: { message?: string; location?: StorageLocation } };
			};

			if (result.type === 'success' && result.data?.pantryAdded?.message) {
				handlePantryAdded(result.data.pantryAdded.message, result.data.pantryAdded.location);
				return true;
			}
		} catch {
			// Fall back to the sheet when auto-add fails.
		}

		return false;
	}

	function shouldAutoAddPantryBridge(userId: string | undefined): boolean {
		if (!userId || pantryBridgeMode !== 'ask') {
			return false;
		}
		return getPantryBridgeYesCountForUser(userId) >= PANTRY_BRIDGE_ALWAYS_THRESHOLD - 1;
	}

	function createToggleEnhance(item: ShoppingListItem): SubmitFunction {
		return () => async ({ result, update }) => {
			const isCheckingOff = !item.checked;
			await update();
			if (result.type === 'success') {
				const data = result.data as
					| {
							pantryBridge?: {
								item: ShoppingListItem;
								preview: PantryBridgePreview;
								mode: ShoppingToPantryMode;
							};
							pantryAdded?: {
								message?: string;
								auto?: boolean;
								location?: StorageLocation;
							};
					  }
					| undefined;

				if (isCheckingOff) {
					const pantryAutoAdded = Boolean(data?.pantryAdded?.message && data.pantryAdded.auto);
					if (!pantryAutoAdded) {
						showSuccessToast(t('actionToast.shoppingChecked', { label: item.name }));
					}
				}

				if (data?.pantryAdded?.message) {
					handlePantryAdded(data.pantryAdded.message, data.pantryAdded.location);
				} else if (data?.pantryBridge) {
					const userId = page.data.user?.id;
					if (shouldAutoAddPantryBridge(userId)) {
						const autoAdded = await autoAddPantryBridge(data.pantryBridge);
						if (autoAdded) {
							await invalidateAll();
							return;
						}
					}

					pantryBridgeItem = data.pantryBridge.item;
					pantryBridgePreview = data.pantryBridge.preview;
					pantryBridgeMode = data.pantryBridge.mode;
					showFirstPantryCoach = Boolean(userId && shouldShowFirstCheckoffCoach(userId));
					pantrySheetOpen = true;
				}

				await invalidateAll();
			} else if (result.type === 'failure') {
				showClientToast(
					(result.data as { message?: string } | undefined)?.message ??
						t('actionToast.shoppingCheckoffFailed'),
					{ variant: 'error' }
				);
			}
		};
	}

	async function submitBulkCheckOff() {
		if (!canEdit || bulkSubmitting || selectedCount === 0) {
			return;
		}

		bulkSubmitting = true;
		const formData = new FormData();
		for (const id of selectedIds) {
			formData.append('ids', id);
		}

		try {
			const response = await fetch('?/bulkToggleChecked', {
				method: 'POST',
				body: formData,
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await response.text()) as {
				type: string;
				data?: { checkedCount?: number; message?: string };
			};

			if (result.type !== 'success') {
				showClientToast(
					(result.data as { message?: string } | undefined)?.message ??
						t('actionToast.shoppingCheckoffFailed'),
					{ variant: 'error' }
				);
				return;
			}

			const count = result.data?.checkedCount ?? selectedCount;
			selectedIds = new Set();
			showSuccessToast(t('dataGrid.bulkCheckOffSuccess', { count }));
			await invalidateAll();
		} finally {
			bulkSubmitting = false;
		}
	}
</script>

{#if listEmpty}
	<EmptyState
		iconId="box"
		title={t('shopping.emptyList')}
		description={t('shopping.emptyDescription')}
		actionLabel={t('shopping.emptyAction')}
		actionHref={shoppingEmptyScanHref}
		primaryAnalyticsId="shopping.empty_scan_receipt"
	/>
{:else}
	<SkaffuDataGrid
		title={t('shopping.listAria')}
		tableAriaLabel={t('shopping.listAria')}
		query={gridState.q}
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
		selectedCount={selectedCount}
		selectionEnabled={canEdit}
		{selectAllChecked}
		{selectAllIndeterminate}
		onQueryChange={(value) => syncGridUrl({ q: value, page: DEFAULT_DATA_GRID_PAGE })}
		onFilterChange={(value) =>
			syncGridUrl({
				filter: parseShoppingListFacetFilter(value),
				page: DEFAULT_DATA_GRID_PAGE
			})}
		onSortChange={(key, direction) =>
			syncGridUrl({
				sort: parseShoppingListSortKey(key),
				dir: direction,
				page: DEFAULT_DATA_GRID_PAGE
			})}
		onPageChange={(nextPage) => syncGridUrl({ page: nextPage })}
		onPageSizeChange={(nextPageSize: DataGridPageSize) =>
			syncGridUrl({ pageSize: nextPageSize, page: DEFAULT_DATA_GRID_PAGE })}
		onSelectAllChange={handleSelectAllChange}
		dataTestId="shopping-checklist-grid"
	>
		{#snippet tableHead()}
			<Cell class="col-checkoff" />
			<Cell class="col-name" aria-sort={sortAria('name')}>
				<button type="button" class="sort-header" onclick={() => toggleSort('name')}>
					{t('inventory.columnName')}
				</button>
			</Cell>
			<Cell class="col-qty">{t('inventory.columnQuantity')}</Cell>
		{/snippet}

		{#snippet tableBody()}
			{#if loadingChecked && (gridState.filter === 'checked' || gridState.filter === 'all')}
				<Row>
					<Cell colspan={columnCount}>{t('common.loading')}</Cell>
				</Row>
			{:else if gridEmpty}
				<Row>
					<Cell colspan={columnCount}>{t('inventory.noResults')}</Cell>
				</Row>
			{:else}
				{#each pipeline.pageRows as item (item.id)}
					<Row data-testid="shopping-grid-row-{item.id}">
						{#if canEdit}
							<Cell class="col-checkbox">
								{#if !item.checked}
									<label class="row-select">
										<input
											type="checkbox"
											checked={selectedIds.has(item.id)}
											aria-label={t('dataGrid.selectRow', { name: item.name })}
											onchange={(event) => toggleSelected(item.id, event.currentTarget.checked)}
										/>
									</label>
								{/if}
							</Cell>
						{/if}
						<Cell class="col-checkoff">
							{#if canEdit}
								<form method="POST" action="?/toggle" use:enhance={createToggleEnhance(item)}>
									<input type="hidden" name="id" value={item.id} />
									<label class="checkoff-label">
										<input
											type="checkbox"
											checked={item.checked}
											aria-label={t('dataGrid.checkOffRow', { name: item.name })}
											onchange={(event) => event.currentTarget.form?.requestSubmit()}
										/>
									</label>
								</form>
							{:else}
								<input type="checkbox" checked={item.checked} disabled aria-label={item.name} />
							{/if}
						</Cell>
						<Cell class="col-name{item.checked ? ' done' : ''}">{item.name}</Cell>
						<Cell class="col-qty{item.checked ? ' done' : ''}">{formatQty(item) || '—'}</Cell>
					</Row>
				{/each}
			{/if}
		{/snippet}

		{#snippet bulkActions()}
			<Button
				type="button"
				variant="primary"
				loading={bulkSubmitting}
				loadingLabel={t('common.saving')}
				disabled={selectedCount === 0}
				onclick={submitBulkCheckOff}
			>
				{t('dataGrid.bulkCheckOff')}
			</Button>
		{/snippet}
	</SkaffuDataGrid>
{/if}

<ShoppingToPantrySheet
	open={pantrySheetOpen}
	item={pantryBridgeItem}
	preview={pantryBridgePreview}
	mode={pantryBridgeMode}
	onClose={closePantrySheet}
	onSkip={closePantrySheet}
	onAdded={(message) => {
		handlePantryAdded(message);
		closePantrySheet();
		void invalidateAll();
	}}
	showFirstCoach={showFirstPantryCoach}
	onFirstCoachDismiss={dismissFirstPantryCoach}
/>

<style>
	.sort-header {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 600;
		color: inherit;
		cursor: pointer;
	}

	.row-select,
	.checkoff-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
	}

	.row-select input,
	.checkoff-label input {
		width: 1.125rem;
		height: 1.125rem;
	}

	:global(.done) {
		opacity: 0.65;
		text-decoration: line-through;
	}
</style>
