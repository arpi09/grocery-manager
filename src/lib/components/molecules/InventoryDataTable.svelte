<script lang="ts">
	import InventoryTableRow from '$lib/components/molecules/InventoryTableRow.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { t } from '$lib/i18n';
	import type { InventorySortDirection, InventorySortKey } from '$lib/utils/inventory-list-filters';

	interface Props {
		items: InventoryItem[];
		sortKey: InventorySortKey;
		sortDirection: InventorySortDirection;
		onSortChange: (key: InventorySortKey) => void;
		canWrite?: boolean;
		finished?: boolean;
		autoExpired?: boolean;
		ariaLabel: string;
	}

	let {
		items,
		sortKey,
		sortDirection,
		onSortChange,
		canWrite = false,
		finished = false,
		autoExpired = false,
		ariaLabel
	}: Props = $props();

	function headerAriaSort(key: InventorySortKey): 'ascending' | 'descending' | 'none' {
		if (sortKey !== key) {
			return 'none';
		}
		return sortDirection === 'asc' ? 'ascending' : 'descending';
	}

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

<div class="table-scroll" data-testid="inventory-table">
	<table aria-label={ariaLabel}>
		<thead>
			<tr>
				<th scope="col" class="col-name" aria-sort={headerAriaSort('name')}>
					<button
						type="button"
						class="sort-btn"
						aria-label={sortHint('name')}
						onclick={() => onSortChange('name')}
					>
						{t('inventory.columnName')}
					</button>
				</th>
				<th scope="col" class="col-qty" aria-sort={headerAriaSort('quantity')}>
					<button
						type="button"
						class="sort-btn"
						aria-label={sortHint('quantity')}
						onclick={() => onSortChange('quantity')}
					>
						{t('inventory.columnQuantity')}
					</button>
				</th>
				<th scope="col" class="col-expiry" aria-sort={headerAriaSort('expiry')}>
					<button
						type="button"
						class="sort-btn"
						aria-label={sortHint('expiry')}
						onclick={() => onSortChange('expiry')}
					>
						{t('inventory.columnExpiry')}
					</button>
				</th>
				<th scope="col" class="col-actions">
					<span class="sr-only">{t('inventory.columnActions')}</span>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each items as item (item.id)}
				<InventoryTableRow {item} {canWrite} {finished} {autoExpired} />
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		max-width: 100%;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: 0 1px 2px color-mix(in srgb, var(--color-text) 4%, transparent);
	}

	table {
		width: 100%;
		min-width: 20rem;
		border-collapse: collapse;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	thead th {
		position: sticky;
		top: 0;
		z-index: 2;
		padding: 0.45rem 0.55rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		text-align: left;
		vertical-align: middle;
		white-space: nowrap;
		box-shadow: 0 1px 0 var(--color-border);
	}

	.col-name {
		width: 42%;
	}

	.col-qty {
		width: 18%;
	}

	.col-expiry {
		width: 22%;
	}

	.col-actions {
		width: 2.75rem;
	}

	.sort-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: none;
		background: transparent;
		padding: 0.1rem 0;
		min-height: var(--touch-target-min);
		font: inherit;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.sort-btn:hover {
		color: var(--color-primary);
	}

	th[aria-sort='ascending'] .sort-btn,
	th[aria-sort='descending'] .sort-btn {
		color: var(--color-primary);
	}

	th[aria-sort='ascending'] .sort-btn::after,
	th[aria-sort='descending'] .sort-btn::after {
		font-size: 0.6rem;
		line-height: 1;
	}

	th[aria-sort='ascending'] .sort-btn::after {
		content: '▲';
	}

	th[aria-sort='descending'] .sort-btn::after {
		content: '▼';
	}

	tbody :global(tr.data-row:nth-child(4n + 1)),
	tbody :global(tr.data-row:nth-child(4n + 3)) {
		background: color-mix(in srgb, var(--color-surface-muted) 35%, var(--color-surface));
	}

	tbody :global(tr.data-row:hover) {
		background: var(--color-surface-muted);
	}

	@media (max-width: 559px) {
		thead {
			display: none;
		}

		table {
			min-width: 0;
		}

		.table-scroll {
			border: none;
			background: transparent;
			box-shadow: none;
		}

		tbody :global(tr.data-row:nth-child(4n + 1)),
		tbody :global(tr.data-row:nth-child(4n + 3)) {
			background: transparent;
		}
	}
</style>
