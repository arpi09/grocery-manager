<script lang="ts">
	import type { MarketPriceFilter } from '$lib/domain/market-pricing-display';
	import { t } from '$lib/i18n';

	interface Props {
		value?: MarketPriceFilter;
		onChange?: (value: MarketPriceFilter) => void;
		variant?: 'default' | 'compact';
	}

	let { value = 'all', onChange, variant = 'default' }: Props = $props();
</script>

<section
	class={['filter-bar', variant === 'compact' ? 'filter-bar-compact' : ''].filter(Boolean).join(' ')}
	aria-labelledby={variant === 'default' ? 'market-price-filter-heading' : undefined}
	data-testid="market-price-filter"
>
	{#if variant === 'default'}
		<h2 id="market-price-filter-heading">{t('marketV04.filterTitle')}</h2>
	{/if}
	<div class="filter-row" role="group" aria-label={t('marketV04.filterAria')}>
		<button
			type="button"
			class="filter-chip"
			class:filter-chip-active={value === 'all'}
			aria-pressed={value === 'all'}
			onclick={() => onChange?.('all')}
		>
			{t('marketV04.filterAll')}
		</button>
		<button
			type="button"
			class="filter-chip"
			class:filter-chip-active={value === 'free'}
			aria-pressed={value === 'free'}
			onclick={() => onChange?.('free')}
		>
			{t('marketV04.filterFree')}
		</button>
		<button
			type="button"
			class="filter-chip"
			class:filter-chip-active={value === 'under50'}
			aria-pressed={value === 'under50'}
			onclick={() => onChange?.('under50')}
		>
			{t('marketV04.filterUnder50')}
		</button>
	</div>
	{#if variant === 'default'}
		<p class="admin-note">{t('marketV04.filterAdminNote')}</p>
	{/if}
</section>

<style>
	.filter-bar {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	h2 {
		margin: 0;
		font-size: 0.95rem;
	}

	.filter-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.filter-chip {
		min-height: var(--touch-target-min, 2.75rem);
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.filter-chip-active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-primary);
	}

	.filter-bar-compact {
		margin-bottom: 0;
		gap: 0;
	}

	.filter-bar-compact .filter-chip {
		min-height: 2.25rem;
		padding: 0.35rem 0.75rem;
		font-size: 0.8125rem;
		background: color-mix(in srgb, var(--color-surface) 92%, transparent);
		backdrop-filter: blur(8px);
	}

	.admin-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}
</style>
