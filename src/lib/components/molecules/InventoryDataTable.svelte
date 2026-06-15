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

	const sortKeys: InventorySortKey[] = ['name', 'quantity', 'expiry'];

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

<div class="card-stack" data-testid="inventory-table" aria-label={ariaLabel}>
	<div class="sort-bar" role="group" aria-label={t('inventory.sortLabel')}>
		{#each sortKeys as key (key)}
			<button
				type="button"
				class="sort-chip"
				class:sort-chip--active={sortKey === key}
				aria-pressed={sortKey === key}
				aria-label={sortHint(key)}
				onclick={() => onSortChange(key)}
			>
				{columnLabel(key)}
				{#if sortKey === key}
					<span class="sort-dir" aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="card-list">
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
	</div>
</div>

<style>
	.card-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.sort-bar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.sort-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		min-height: var(--touch-target-min);
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font: inherit;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.sort-chip:hover,
	.sort-chip--active {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.sort-chip--active {
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.sort-dir {
		font-size: 0.6875rem;
	}

	.card-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
</style>
