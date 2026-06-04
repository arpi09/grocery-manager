<script lang="ts">
	import InventoryTableRow from '$lib/components/molecules/InventoryTableRow.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { t } from '$lib/i18n';
	import type { InventorySortKey } from '$lib/utils/inventory-list-filters';

	interface Props {
		items: InventoryItem[];
		sortKey: InventorySortKey;
		onSortChange: (key: InventorySortKey) => void;
		canWrite?: boolean;
		finished?: boolean;
		autoExpired?: boolean;
		ariaLabel: string;
	}

	let {
		items,
		sortKey,
		onSortChange,
		canWrite = false,
		finished = false,
		autoExpired = false,
		ariaLabel
	}: Props = $props();

	function sortDirection(key: InventorySortKey): 'ascending' | 'descending' | 'none' {
		return sortKey === key ? 'ascending' : 'none';
	}

	function toggleSort(key: InventorySortKey) {
		onSortChange(key);
	}
</script>

<div class="table-scroll" data-testid="inventory-table">
	<table aria-label={ariaLabel}>
		<thead>
			<tr>
				<th scope="col" class="col-name" aria-sort={sortDirection('name')}>
					<button type="button" class="sort-btn" onclick={() => toggleSort('name')}>
						{t('inventory.columnName')}
					</button>
				</th>
				<th scope="col" class="col-qty" aria-sort={sortDirection('quantity')}>
					<button type="button" class="sort-btn" onclick={() => toggleSort('quantity')}>
						{t('inventory.columnQuantity')}
					</button>
				</th>
				<th scope="col" class="col-expiry" aria-sort={sortDirection('expiry')}>
					<button type="button" class="sort-btn" onclick={() => toggleSort('expiry')}>
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
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	table {
		width: 100%;
		min-width: 20rem;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	thead th {
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		text-align: left;
		vertical-align: middle;
		white-space: nowrap;
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
		gap: 0.2rem;
		border: none;
		background: transparent;
		padding: 0;
		font: inherit;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.sort-btn:hover {
		color: var(--color-primary);
	}

	th[aria-sort='ascending'] .sort-btn {
		color: var(--color-primary);
	}

	th[aria-sort='ascending'] .sort-btn::after {
		content: '▴';
		font-size: 0.65rem;
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
		}
	}
</style>
