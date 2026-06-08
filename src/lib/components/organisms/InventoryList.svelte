<script lang="ts">

	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';

	import Button from '$lib/components/atoms/Button.svelte';

	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';

	import ConsumeItemPanel from '$lib/components/molecules/ConsumeItemPanel.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';

	import InventoryCompactRow from '$lib/components/molecules/InventoryCompactRow.svelte';

	import InventoryDataTable from '$lib/components/molecules/InventoryDataTable.svelte';

	import Modal from '$lib/components/molecules/Modal.svelte';

	import EmptyState from '$lib/components/molecules/EmptyState.svelte';

	import SearchInput from '$lib/components/molecules/SearchInput.svelte';

	import type { FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';

	import {

		fetchInventoryActivePage,

		fetchInventoryAutoExpired,

		fetchInventoryFinished,

		fetchInventorySearch

	} from '$lib/client/inventory-data';

	import { getLocale, t } from '$lib/i18n';

	import { locationLabel } from '$lib/i18n/domain-labels';

	import type { InventoryItem } from '$lib/domain/inventory-item';

	import type { StorageLocation } from '$lib/domain/location';

	import { scanModeHref } from '$lib/utils/scan-nav';

	import { subscribeCompactInventoryViewport } from '$lib/utils/inventory-viewport';

	import {

		DEFAULT_INVENTORY_SORT,

		DEFAULT_INVENTORY_SORT_DIRECTION,

		filterAndSortInventoryItems,

		type InventoryExpiryFilter,

		type InventorySortDirection,

		type InventorySortKey

	} from '$lib/utils/inventory-list-filters';
	import { TOAST_UNDO_DURATION_MS } from '$lib/utils/action-toast';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		dismissAutoExpiredIntro,
		isAutoExpiredIntroDismissed
	} from '$lib/utils/auto-expired-intro-dismiss';

	interface Props {
		items: InventoryItem[];
		activeTotal: number;
		autoExpiredTotal: number;
		finishedTotal: number;
		autoExpiredGraceDays: number;
		location: StorageLocation;
		canWrite?: boolean;
		hasInventory?: boolean;
		initialShowAutoExpired?: boolean;
		initialExpiryFilter?: InventoryExpiryFilter;
	}



	let {

		items,

		activeTotal,

		autoExpiredTotal,

		finishedTotal,

		autoExpiredGraceDays,

		location,

		canWrite = false,
		hasInventory = true,
		initialShowAutoExpired = false,
		initialExpiryFilter = 'all'
	}: Props = $props();



	const inventoryPath = $derived(`/inventory/${location}`);

	const scanHref = $derived(scanModeHref('photo', inventoryPath, { location }));

	const manualAddHref = $derived(

		`/item/new?location=${location}&from=${encodeURIComponent(inventoryPath)}`

	);



	let query = $state('');

	let debouncedQuery = $state('');

	let sortKey = $state<InventorySortKey>(DEFAULT_INVENTORY_SORT);

	let sortDirection = $state<InventorySortDirection>(DEFAULT_INVENTORY_SORT_DIRECTION);

	let showAutoExpired = $state(false);

	let showFinished = $state(false);

	let loadedItems = $state<InventoryItem[]>([]);

	let autoExpiredItems = $state<InventoryItem[]>([]);

	let finishedItems = $state<InventoryItem[]>([]);

	let searchResults = $state<InventoryItem[]>([]);

	let loadingMore = $state(false);

	let loadingAutoExpired = $state(false);

	let loadingFinished = $state(false);

	let searching = $state(false);

	let autoExpiredLoaded = $state(false);

	let finishedLoaded = $state(false);

	let isCompact = $state(false);

	let consumeItem = $state<InventoryItem | null>(null);
	let finishingIds = $state(new Set<string>());
	let undoPayload = $state<{
		id: string;
		name: string;
		quantity: string;
	} | null>(null);
	let undoSubmitting = $state(false);
	let showAutoExpiredIntro = $state(false);

	const undoMessage = $derived(
		undoPayload
			? t('consume.undoToastNamed', { name: undoPayload.name })
			: t('consume.undoToast')
	);



	const trimmedQuery = $derived(query.trim());

	const isServerSearch = $derived(trimmedQuery.length >= 2);



	$effect.pre(() => {

		loadedItems = items;

		autoExpiredItems = [];

		finishedItems = [];

		searchResults = [];

		autoExpiredLoaded = false;

		finishedLoaded = false;

		showAutoExpired = false;

		showFinished = false;

		consumeItem = null;
		finishingIds = new Set();
		undoPayload = null;
	});

	$effect(() => {
		if (!browser || !initialShowAutoExpired || autoExpiredTotal === 0 || autoExpiredLoaded) {
			return;
		}

		showAutoExpired = true;
		loadingAutoExpired = true;

		void fetchInventoryAutoExpired(location)
			.then((page) => {
				autoExpiredItems = page.items;
				autoExpiredLoaded = true;
				if (!isAutoExpiredIntroDismissed()) {
					showAutoExpiredIntro = true;
				}
			})
			.finally(() => {
				loadingAutoExpired = false;
			});
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

		if (!browser) return;

		return subscribeCompactInventoryViewport((compact) => {

			isCompact = compact;

		});

	});



	$effect(() => {

		const q = debouncedQuery.trim();

		const loc = location;



		if (!browser || q.length < 2) {

			searchResults = [];

			searching = false;

			return;

		}



		let cancelled = false;

		searching = true;



		void fetchInventorySearch(loc, q)

			.then((page) => {

				if (!cancelled) {

					searchResults = page.items;

				}

			})

			.finally(() => {

				if (!cancelled) {

					searching = false;

				}

			});



		return () => {

			cancelled = true;

		};

	});



	const activeItems = $derived(

		isServerSearch

			? filterAndSortInventoryItems(searchResults, '', initialExpiryFilter, sortKey, sortDirection)

			: filterAndSortInventoryItems(loadedItems, query, initialExpiryFilter, sortKey, sortDirection)

	);



	const filteredAutoExpired = $derived(

		showAutoExpired

			? filterAndSortInventoryItems(autoExpiredItems, query, 'all', sortKey, sortDirection)

			: []

	);



	const filteredFinished = $derived(

		showFinished

			? filterAndSortInventoryItems(finishedItems, query, 'all', sortKey, sortDirection)

			: []

	);



	function handleHeaderSort(key: InventorySortKey) {

		if (sortKey === key) {

			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

			return;

		}

		sortKey = key;

		sortDirection = 'asc';

	}



	function toggleMobileSortChip() {

		if (sortKey === 'name') {

			sortKey = 'expiry';

			sortDirection = 'asc';

			return;

		}

		sortKey = 'name';

		sortDirection = 'asc';

	}



	function mobileSortChipLabel(): string {

		return sortKey === 'expiry' ? t('inventory.columnExpiry') : t('inventory.columnName');

	}



	function openPartialConsumeSheet(item: InventoryItem) {
		consumeItem = item;
	}

	function closeConsumeSheet() {
		consumeItem = null;
	}

	async function finishOneTap(item: InventoryItem) {
		if (!browser || finishingIds.has(item.id)) {
			return;
		}

		const snapshot = { id: item.id, name: item.name, quantity: item.quantity };
		finishingIds = new Set([...finishingIds, item.id]);

		const formData = new FormData();
		formData.set('itemId', item.id);
		formData.set('consumptionPreset', 'all');
		formData.set('oneTap', '1');

		try {
			const response = await fetch('?/consumeItem', { method: 'POST', body: formData });
			if (response.ok) {
				undoPayload = snapshot;
				await invalidateAll();
			} else {
				showClientToast(t('consume.finishFailed'), { variant: 'error' });
			}
		} catch {
			showClientToast(t('consume.finishFailed'), { variant: 'error' });
		} finally {
			const next = new Set(finishingIds);
			next.delete(item.id);
			finishingIds = next;
		}
	}

	async function undoConsume() {
		if (!browser || !undoPayload) {
			return;
		}

		undoSubmitting = true;
		const formData = new FormData();
		formData.set('itemId', undoPayload.id);
		formData.set('quantity', undoPayload.quantity);

		try {
			const response = await fetch('?/undoConsume', { method: 'POST', body: formData });
			if (response.ok) {
				undoPayload = null;
				await invalidateAll();
			}
		} finally {
			undoSubmitting = false;
		}
	}

	function dismissUndo() {
		undoPayload = null;
	}



	const hasMoreActive = $derived(!isServerSearch && loadedItems.length < activeTotal);

	const hasVisibleItems = $derived(

		activeItems.length > 0 || filteredAutoExpired.length > 0 || filteredFinished.length > 0

	);

	const isSearchEmpty = $derived(trimmedQuery.length > 0 && !searching && !hasVisibleItems);



	const locationName = $derived(locationLabel(getLocale(), location).toLowerCase());

	const emptyTitle = $derived(

		isSearchEmpty

			? t('inventory.noResults')

			: t('inventory.emptyTitle', { location: locationName })

	);

	const emptyDescription = $derived(

		isSearchEmpty

			? t('inventory.tryOtherSearch')

			: canWrite

				? t('inventory.emptyCanWriteShort', { location: locationName })

				: t('inventory.emptyReadonly', { location: locationName })

	);



	const locationIcons: Record<StorageLocation, FeatureIconId> = {

		fridge: 'fridge',

		freezer: 'freezer',

		cupboard: 'cupboard'

	};



	async function loadMoreActive() {

		if (!browser || loadingMore || !hasMoreActive) {

			return;

		}



		loadingMore = true;

		try {

			const page = await fetchInventoryActivePage(location, loadedItems.length);

			loadedItems = [...loadedItems, ...page.items];

		} finally {

			loadingMore = false;

		}

	}



	async function toggleAutoExpired() {

		const next = !showAutoExpired;

		showAutoExpired = next;

		if (!next || autoExpiredLoaded || autoExpiredTotal === 0 || !browser) return;

		loadingAutoExpired = true;

		try {

			autoExpiredItems = (await fetchInventoryAutoExpired(location)).items;

			autoExpiredLoaded = true;
			if (!isAutoExpiredIntroDismissed()) {
				showAutoExpiredIntro = true;
			}
		} finally {
			loadingAutoExpired = false;
		}
	}

	function dismissAutoExpiredIntroBanner() {
		dismissAutoExpiredIntro();
		showAutoExpiredIntro = false;
	}



	async function toggleFinished() {

		const next = !showFinished;

		showFinished = next;



		if (!next || finishedLoaded || finishedTotal === 0 || !browser) {

			return;

		}



		loadingFinished = true;

		try {

			const page = await fetchInventoryFinished(location);

			finishedItems = page.items;

			finishedLoaded = true;

		} finally {

			loadingFinished = false;

		}

	}

</script>



<div class="list">

	{#if hasInventory}

		<div class="sticky-chrome">

			<div class="filter-row">

				<SearchInput bind:value={query} placeholder={t('inventory.searchPlaceholder')} />

				{#if isCompact}

					<button type="button" class="sort-chip" onclick={toggleMobileSortChip}>

						{mobileSortChipLabel()}

					</button>

				{/if}

			</div>

			{#if autoExpiredTotal > 0 || finishedTotal > 0}

				<div class="filter-meta">

					{#if autoExpiredTotal > 0}

						<button

							type="button"

							class="section-chip"

							aria-pressed={showAutoExpired}

							disabled={loadingAutoExpired}

							onclick={toggleAutoExpired}

						>

							{loadingAutoExpired

								? t('common.loading')

								: showAutoExpired

									? t('inventory.hideAutoExpired')

									: t('inventory.showAutoExpired')}

							<span class="section-count">{autoExpiredTotal}</span>

						</button>

					{/if}

					{#if finishedTotal > 0}

						<button

							type="button"

							class="section-chip"

							aria-pressed={showFinished}

							disabled={loadingFinished}

							onclick={toggleFinished}

						>

							{loadingFinished

								? t('common.loading')

								: showFinished

									? t('inventory.hideFinished')

									: t('inventory.showFinished')}

							<span class="section-count">{finishedTotal}</span>

						</button>

					{/if}

				</div>

			{/if}

		</div>

	{/if}



	{#if searching}

		<p class="search-status" aria-live="polite">{t('common.loading')}</p>

	{/if}



	{#if !hasVisibleItems && !searching}

		<EmptyState

			iconId={isSearchEmpty ? undefined : locationIcons[location]}

			title={emptyTitle}

			description={emptyDescription}

			actionLabel={isSearchEmpty

				? undefined

				: canWrite

					? t('photoRound.title')

					: t('inventory.backHome')}

			actionHref={isSearchEmpty ? undefined : canWrite ? scanHref : '/'}

			secondaryActionLabel={!isSearchEmpty && canWrite && !hasInventory

				? t('inventory.addManual')

				: undefined}

			secondaryActionHref={!isSearchEmpty && canWrite && !hasInventory ? manualAddHref : undefined}

		/>

	{:else if activeItems.length > 0}

		{#if isCompact}

			<div class="compact-list" data-testid="inventory-compact-list" aria-label={t('inventory.listAria')}>

				{#each activeItems as item (item.id)}

					<InventoryCompactRow
						{item}
						{canWrite}
						autoExpiredGraceDays={autoExpiredGraceDays}
						finishing={finishingIds.has(item.id)}
						onFinishOneTap={finishOneTap}
						onPartialConsume={openPartialConsumeSheet}
					/>

				{/each}

			</div>

		{:else}

			<InventoryDataTable

				items={activeItems}

				{sortKey}

				{sortDirection}

				onSortChange={handleHeaderSort}

				{canWrite}

				autoExpiredGraceDays={autoExpiredGraceDays}
				finishingIds={finishingIds}
				onFinishOneTap={finishOneTap}
				onPartialConsume={openPartialConsumeSheet}
				ariaLabel={t('inventory.listAria')}

			/>

		{/if}



		{#if hasMoreActive && trimmedQuery.length === 0}

			<div class="load-more-row">

				<Button

					type="button"

					variant="secondary"

					loading={loadingMore}

					loadingLabel={t('common.loading')}

					onclick={loadMoreActive}

				>

					{t('common.loadMore')}

				</Button>

			</div>

		{/if}

	{/if}



	{#if filteredAutoExpired.length > 0}

		<div class="secondary-section-head">

			<div>

				<h2 class="secondary-heading">{t('inventory.autoExpiredSection')}</h2>

				<p class="secondary-note">{t('inventory.autoExpiredSectionLead')}</p>

				<p class="secondary-note subtle">

					{t('inventory.autoExpiredNote', { days: autoExpiredGraceDays })}

				</p>

			</div>

			{#if canWrite}

				<DeleteConfirmButton

					tier={3}

					context="inventoryAutoExpiredBulk"

					copyOptions={{ count: filteredAutoExpired.length }}

					action="?/bulkDiscardAutoExpired"

					variant="ghost"

					label={t('inventory.clearAutoExpired')}

					class="clear-auto-expired-action"

					ariaLabel={t('inventory.clearAutoExpiredAria', {

						count: filteredAutoExpired.length

					})}

				/>

			{/if}

		</div>

		{#if showAutoExpiredIntro}

			<div class="auto-expired-intro" role="status">

				<p>{t('inventory.autoExpiredIntro')}</p>

				<button type="button" class="intro-dismiss" onclick={dismissAutoExpiredIntroBanner}>

					{t('inventory.autoExpiredIntroDismiss')}

				</button>

			</div>

		{/if}

		{#if isCompact}

			<div class="compact-list" aria-label={t('inventory.autoExpiredSection')}>

				{#each filteredAutoExpired as item (item.id)}

					<InventoryCompactRow

						{item}

						{canWrite}

						autoExpired={true}

						autoExpiredGraceDays={autoExpiredGraceDays}

						finishing={finishingIds.has(item.id)}

						onFinishOneTap={finishOneTap}

						onPartialConsume={openPartialConsumeSheet}

					/>

				{/each}

			</div>

		{:else}

			<InventoryDataTable

				items={filteredAutoExpired}

				{sortKey}

				{sortDirection}

				onSortChange={handleHeaderSort}

				{canWrite}

				autoExpired={true}

				autoExpiredGraceDays={autoExpiredGraceDays}

				finishingIds={finishingIds}

				onFinishOneTap={finishOneTap}

				onPartialConsume={openPartialConsumeSheet}

				ariaLabel={t('inventory.autoExpiredSection')}

			/>

		{/if}

	{/if}



	{#if filteredFinished.length > 0}

		<h2 class="secondary-heading">{t('inventory.finishedSection')}</h2>

		{#if isCompact}

			<div class="compact-list" aria-label={t('inventory.finishedSection')}>

				{#each filteredFinished as item (item.id)}

					<InventoryCompactRow {item} {canWrite} finished={true} />

				{/each}

			</div>

		{:else}

			<InventoryDataTable

				items={filteredFinished}

				{sortKey}

				{sortDirection}

				onSortChange={handleHeaderSort}

				{canWrite}

				finished={true}

				ariaLabel={t('inventory.finishedSection')}

			/>

		{/if}

	{/if}

</div>



{#if consumeItem && canWrite}

	<Modal

		open={true}

		onClose={closeConsumeSheet}

		variant="sheet"

		title={consumeItem.name}

		data-testid="inventory-consume-sheet"

	>

		<ConsumeItemPanel

			item={consumeItem}

			action="/item/{consumeItem.id}/edit?/markAsFinished"

			onClose={closeConsumeSheet}

		/>

	</Modal>

{/if}

{#if undoPayload}
	<div class="undo-toast-wrap">
		<Toast
			message={undoMessage}
			visible={true}
			variant="success"
			size="action"
			durationMs={TOAST_UNDO_DURATION_MS}
			tapToDismiss={true}
			onDismiss={dismissUndo}
		/>
		<button
			type="button"
			class="undo-btn"
			disabled={undoSubmitting}
			onclick={undoConsume}
			aria-label={t('common.undo')}
		>
			{t('common.undo')}
		</button>
	</div>
{/if}

<style>

	.list {

		display: flex;

		flex-direction: column;

		gap: var(--space-md);

		min-width: 0;

	}



	.sticky-chrome {

		position: sticky;

		top: 0;

		z-index: 5;

		display: flex;

		flex-direction: column;

		gap: var(--space-sm);

		padding-bottom: var(--space-xs);

		background: var(--color-bg);

	}



	.filter-row {

		display: flex;

		align-items: center;

		gap: var(--space-sm);

	}



	.filter-row :global(.search) {

		flex: 1;

		min-width: 0;

	}



	.sort-chip {

		flex-shrink: 0;

		display: inline-flex;

		align-items: center;

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



	.filter-meta {

		display: flex;

		flex-wrap: wrap;

		align-items: center;

		gap: var(--space-xs);

	}



	.search-status {

		margin: 0;

		font-size: 0.8125rem;

		color: var(--color-text-muted);

	}



	.compact-list {

		border: 1px solid var(--color-border);

		border-radius: var(--radius-md);

		overflow: hidden;

		background: var(--color-surface);

		box-shadow: 0 1px 2px color-mix(in srgb, var(--color-text) 4%, transparent);

	}



	.section-chip {

		display: inline-flex;

		align-items: center;

		gap: 0.35rem;

		border: none;

		background: transparent;

		border-radius: var(--radius-sm);

		padding: 0.15rem 0.35rem;

		font-size: 0.8125rem;

		font-weight: 600;

		color: var(--color-text-muted);

		cursor: pointer;

		text-decoration: underline;

		text-underline-offset: 0.15em;

		text-decoration-color: color-mix(in srgb, var(--color-text-muted) 45%, transparent);

	}



	.section-chip:hover:not(:disabled) {

		color: var(--color-primary);

		text-decoration-color: color-mix(in srgb, var(--color-primary) 45%, transparent);

	}



	.section-chip:disabled {

		opacity: 0.7;

		cursor: wait;

	}



	.section-chip[aria-pressed='true'] {

		color: var(--color-primary);

		text-decoration: none;

		background: color-mix(in srgb, var(--color-primary) 10%, transparent);

		padding: 0.2rem 0.5rem;

	}



	.section-count {

		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-width: 1.25rem;

		padding: 0 0.3rem;

		font-size: 0.75rem;

		font-weight: 700;

		border-radius: 999px;

		background: var(--color-surface-muted);

		color: var(--color-text-muted);

		text-decoration: none;

	}



	.section-chip[aria-pressed='true'] .section-count {

		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));

		color: var(--color-primary);

	}



	.load-more-row {

		display: flex;

		justify-content: center;

	}



	.secondary-section-head {

		display: flex;

		align-items: flex-start;

		justify-content: space-between;

		gap: var(--space-sm);

		margin-top: var(--space-xs);

		padding-top: var(--space-sm);

	}



	.secondary-heading {

		margin: 0;

		font-size: 0.8125rem;

		font-weight: 700;

		letter-spacing: 0.04em;

		text-transform: uppercase;

		color: var(--color-text-muted);

	}



	.secondary-note {

		margin: 0.25rem 0 0;

		font-size: 0.8125rem;

		color: var(--color-text-muted);

		line-height: 1.4;

	}

	.secondary-note.subtle {
		font-size: 0.75rem;
	}

	.auto-expired-intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-warning) 28%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-warning) 6%, var(--color-surface));
	}

	.auto-expired-intro p {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-text);
	}

	.intro-dismiss {
		align-self: flex-start;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: inherit;
		color: var(--color-primary);
		cursor: pointer;
	}

	.intro-dismiss:hover {
		border-color: var(--color-primary);
	}

	.undo-toast-wrap {
		position: fixed;
		left: 50%;
		bottom: calc(var(--content-bottom-safe) + var(--space-sm));
		transform: translateX(-50%);
		z-index: var(--z-toast);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		max-width: calc(100vw - 2 * var(--page-padding-x));
	}

	.undo-btn {
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.75rem;
		font-weight: 600;
		font-size: 0.85rem;
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		box-shadow: var(--shadow-md);
	}

	.undo-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	:global(.clear-auto-expired-action) {

		flex-shrink: 0;

	}

</style>

