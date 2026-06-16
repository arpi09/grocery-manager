<script lang="ts">
	import InventoryTableRow from '$lib/components/molecules/InventoryTableRow.svelte';
	import SkaffuDataTable from '$lib/components/molecules/SkaffuDataTable.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { t } from '$lib/i18n';
	import type { InventorySortDirection, InventorySortKey } from '$lib/utils/inventory-list-filters';
	import { Body, Cell, Head, Row } from '@smui/data-table';

	interface Props {
		items: InventoryItem[];
		sortKey: InventorySortKey;
		sortDirection: InventorySortDirection;
		onSortChange: (key: InventorySortKey) => void;
		canWrite?: boolean;
		finished?: boolean;
		autoExpired?: boolean;
		autoExpiredGraceDays?: number;
		finishingIds?: Set<string>;
		ariaLabel: string;
		onFinishOneTap?: (item: InventoryItem) => void;
		onPartialConsume?: (item: InventoryItem) => void;
	}

	let {
		items,
		sortKey,
		sortDirection,
		onSortChange,
		canWrite = false,
		finished = false,
		autoExpired = false,
		autoExpiredGraceDays = 7,
		finishingIds = new Set<string>(),
		ariaLabel,
		onFinishOneTap,
		onPartialConsume
	}: Props = $props();

	function sortHint(key: InventorySortKey): string {
		if (sortKey !== key) {
			return t('inventory.sortColumnInactive', { column: columnLabel(key) });
		}
		return sortDirection === 'asc'
			? t('inventory.sortColumnAsc', { column: columnLabel(key) })
			: t('inventory.sortColumnDesc', { column: columnLabel(key) });
	}

	function columnLabel(key: InventorySortKey): string {
		if (key === 'name') return t('inventory.columnName');
		if (key === 'quantity') return t('inventory.columnQuantity');
		return t('inventory.columnExpiry');
	}
</script>

<div class="inventory-table-wrap">
	<SkaffuDataTable {ariaLabel} data-testid="inventory-table">
		{#snippet head()}
			<Head>
				<Row>
					<Cell class="col-name">
						<button
							type="button"
							class="sort-header-btn"
							class:sort-header-btn--active={sortKey === 'name'}
							aria-label={sortHint('name')}
							onclick={() => onSortChange('name')}
						>
							{t('inventory.columnName')}
							{#if sortKey === 'name'}
								<span class="sort-dir" aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</button>
					</Cell>
					<Cell class="col-qty">
						<button
							type="button"
							class="sort-header-btn"
							class:sort-header-btn--active={sortKey === 'quantity'}
							aria-label={sortHint('quantity')}
							onclick={() => onSortChange('quantity')}
						>
							{t('inventory.columnQuantity')}
							{#if sortKey === 'quantity'}
								<span class="sort-dir" aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</button>
					</Cell>
					<Cell class="col-expiry">
						<button
							type="button"
							class="sort-header-btn"
							class:sort-header-btn--active={sortKey === 'expiry'}
							aria-label={sortHint('expiry')}
							onclick={() => onSortChange('expiry')}
						>
							{t('inventory.columnExpiry')}
							{#if sortKey === 'expiry'}
								<span class="sort-dir" aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</button>
					</Cell>
					<Cell class="actions-col"></Cell>
				</Row>
			</Head>
		{/snippet}
		{#snippet body()}
			<Body>
				{#each items as item (item.id)}
					<InventoryTableRow
						{item}
						{canWrite}
						{finished}
						{autoExpired}
						{autoExpiredGraceDays}
						finishing={finishingIds.has(item.id)}
						{onFinishOneTap}
						{onPartialConsume}
					/>
				{/each}
			</Body>
		{/snippet}
	</SkaffuDataTable>
</div>

<style>
	.inventory-table-wrap {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.sort-header-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		min-height: var(--touch-target-min);
		padding: 0;
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
		color: var(--color-primary);
	}

	.sort-dir {
		font-size: 0.6875rem;
	}

	:global(.actions-col) {
		width: 3rem;
	}
</style>
