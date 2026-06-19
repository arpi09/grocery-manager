<script lang="ts">
	import {
		DATA_GRID_PAGE_SIZE_OPTIONS,
		type DataGridPageSize
	} from '$lib/domain/data-grid-state';
	import { t } from '$lib/i18n';

	interface Props {
		page: number;
		pageSize: DataGridPageSize;
		totalCount: number;
		rangeStart: number;
		rangeEnd: number;
		pageCount: number;
		onPageChange: (page: number) => void;
		onPageSizeChange: (pageSize: DataGridPageSize) => void;
	}

	let {
		page,
		pageSize,
		totalCount,
		rangeStart,
		rangeEnd,
		pageCount,
		onPageChange,
		onPageSizeChange
	}: Props = $props();

	const prevDisabled = $derived(page <= 1);
	const nextDisabled = $derived(page >= pageCount || totalCount === 0);
</script>

<nav class="data-grid-pagination" aria-label={t('dataGrid.paginationAria')} data-testid="data-grid-pagination">
	<label class="page-size">
		<span class="page-size-label">{t('dataGrid.rowsPerPage')}</span>
		<select
			class="page-size-select"
			value={String(pageSize)}
			aria-label={t('dataGrid.rowsPerPage')}
			onchange={(event) => onPageSizeChange(Number(event.currentTarget.value) as DataGridPageSize)}
		>
			{#each DATA_GRID_PAGE_SIZE_OPTIONS as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>

	<p class="range" aria-live="polite">
		{t('dataGrid.range', { start: rangeStart, end: rangeEnd, total: totalCount })}
	</p>

	<div class="nav-buttons">
		<button
			type="button"
			class="nav-btn"
			disabled={prevDisabled}
			aria-label={t('dataGrid.previousPage')}
			data-testid="data-grid-pagination-prev"
			onclick={() => onPageChange(page - 1)}
		>
			<span aria-hidden="true">‹</span>
		</button>
		<button
			type="button"
			class="nav-btn"
			disabled={nextDisabled}
			aria-label={t('dataGrid.nextPage')}
			data-testid="data-grid-pagination-next"
			onclick={() => onPageChange(page + 1)}
		>
			<span aria-hidden="true">›</span>
		</button>
	</div>
</nav>

<style>
	.data-grid-pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--color-border);
	}

	.page-size {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.page-size-select {
		min-height: var(--touch-target-min);
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font: inherit;
		color: var(--color-text);
	}

	.range {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.nav-buttons {
		display: inline-flex;
		gap: var(--space-xs);
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 1.25rem;
		line-height: 1;
		color: var(--color-text);
		cursor: pointer;
	}

	.nav-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
