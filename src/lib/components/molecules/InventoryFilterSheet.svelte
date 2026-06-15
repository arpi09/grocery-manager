<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { t } from '$lib/i18n';
	import type { InventoryExpiryFilter, InventorySortDirection, InventorySortKey } from '$lib/utils/inventory-list-filters';

	interface SectionChip {
		label: string;
		pressed: boolean;
		loading?: boolean;
		count?: number;
		onClick: () => void;
	}

	interface Props {
		open: boolean;
		expiryFilter: InventoryExpiryFilter;
		sortKey: InventorySortKey;
		sortDirection: InventorySortDirection;
		sectionChips?: SectionChip[];
		onExpiryFilterChange: (filter: InventoryExpiryFilter) => void;
		onSortChange: (key: InventorySortKey, direction: InventorySortDirection) => void;
		onClose: () => void;
	}

	let {
		open,
		expiryFilter,
		sortKey,
		sortDirection,
		sectionChips = [],
		onExpiryFilterChange,
		onSortChange,
		onClose
	}: Props = $props();

	const filterOptions: { value: InventoryExpiryFilter; label: string }[] = [
		{ value: 'all', label: t('inventory.expiryFilterAll') },
		{ value: 'expiring', label: t('inventory.expiryFilterSoon') },
		{ value: 'dated', label: t('inventory.expiryFilterDated') },
		{ value: 'noExpiry', label: t('inventory.expiryFilterNoExpiry') }
	];

	const sortOptions: { key: InventorySortKey; label: string }[] = [
		{ key: 'name', label: t('inventory.sortName') },
		{ key: 'expiry', label: t('inventory.sortExpiry') },
		{ key: 'quantity', label: t('inventory.sortQuantity') }
	];
</script>

<Modal
	{open}
	onClose={onClose}
	variant="sheet"
	title={t('inventory.filterSheet.title')}
	data-testid="inventory-filter-sheet"
>
	<div class="sheet-body">
		<fieldset class="group">
			<legend>{t('inventory.expiryFilterLabel')}</legend>
			<div class="chip-grid">
				{#each filterOptions as option (option.value)}
					<button
						type="button"
						class="chip"
						aria-pressed={expiryFilter === option.value}
						onclick={() => onExpiryFilterChange(option.value)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</fieldset>

		<fieldset class="group">
			<legend>{t('inventory.sortLabel')}</legend>
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

		{#if sectionChips.length > 0}
			<fieldset class="group">
				<legend>{t('inventory.filterSheet.sections')}</legend>
				<div class="chip-grid">
					{#each sectionChips as chip, index (index)}
						<button
							type="button"
							class="chip"
							aria-pressed={chip.pressed}
							disabled={chip.loading}
							onclick={chip.onClick}
						>
							{chip.label}
							{#if chip.count !== undefined}
								<span class="count">{chip.count}</span>
							{/if}
						</button>
					{/each}
				</div>
			</fieldset>
		{/if}
	</div>

	<div class="sheet-footer">
		<Button type="button" fullWidth onclick={onClose}>{t('inventory.filterSheet.apply')}</Button>
	</div>
</Modal>

<style>
	.sheet-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
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

	.count {
		font-size: 0.6875rem;
		font-weight: 700;
	}

	.dir {
		font-size: 0.75rem;
	}

	.sheet-footer {
		margin-top: var(--space-md);
	}
</style>
