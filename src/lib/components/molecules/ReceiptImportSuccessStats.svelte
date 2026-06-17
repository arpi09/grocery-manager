<script lang="ts">
	import type { ReceiptLocationCounts } from '$lib/utils/receipt-import-session';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { t } from '$lib/i18n';

	interface Props {
		counts: ReceiptLocationCounts;
	}

	let { counts }: Props = $props();

	const statKeys: Record<
		StorageLocation,
		'receiptImport.success.statCupboard' | 'receiptImport.success.statFridge' | 'receiptImport.success.statFreezer'
	> = {
		cupboard: 'receiptImport.success.statCupboard',
		fridge: 'receiptImport.success.statFridge',
		freezer: 'receiptImport.success.statFreezer'
	};
</script>

<div class="stats-row" role="list" aria-label={t('receiptImport.success.ariaLabel')}>
	{#each LOCATIONS as location (location)}
		{#if counts[location] > 0}
			<div class="stat-chip" role="listitem" data-testid="receipt-success-stat-{location}">
				<span class="stat-count" aria-hidden="true">{counts[location]}</span>
				<span class="stat-label">{t(statKeys[location], { count: counts[location] })}</span>
			</div>
		{/if}
	{/each}
</div>

<style>
	.stats-row { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-sm); }
	.stat-chip { display: flex; flex-direction: column; align-items: center; gap: 0.125rem; min-width: 5.5rem; padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md); background: var(--color-surface-muted); border: 1px solid var(--color-border); }
	.stat-count { font-size: 1.25rem; font-weight: 700; line-height: 1.1; }
	.stat-label { font-size: 0.8125rem; color: var(--color-text-muted); text-align: center; line-height: 1.3; }
</style>
