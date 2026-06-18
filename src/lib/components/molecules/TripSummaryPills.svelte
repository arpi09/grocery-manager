<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { getSummaryNamePills, sortUncheckedItems } from '$lib/domain/shopping-trip';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';

	interface Props {
		items: ShoppingListItem[];
		canEdit: boolean;
		onStartShop: () => void;
		onAddItem: () => void;
	}

	let { items, canEdit, onStartShop, onAddItem }: Props = $props();

	const unchecked = $derived(sortUncheckedItems(items));
	const summary = $derived(getSummaryNamePills(items));
	const hasItems = $derived(unchecked.length > 0);
</script>

<section class="summary" aria-labelledby="shopping-v2-summary-heading">
	<h2 id="shopping-v2-summary-heading" class="summary-title">{t('shopping.v2.summary.title')}</h2>

	<div class="pill-row" data-testid="shopping-v2-summary-pills">
		{#if hasItems}
			<span class="pill pill-count">{t('shopping.v2.summary.countPill', { count: unchecked.length })}</span>
			{#each summary.names as name (name)}
				<span class="pill">{name}</span>
			{/each}
			{#if summary.overflow > 0}
				<span class="pill pill-muted">{t('shopping.v2.summary.morePill', { count: summary.overflow })}</span>
			{/if}
		{:else}
			<span class="pill pill-muted">{t('shopping.v2.summary.empty')}</span>
		{/if}
	</div>

	<div class="summary-actions">
		{#if canEdit}
			<Button
				fullWidth
				disabled={!hasItems}
				data-testid="shopping-v2-start-shop"
				onclick={onStartShop}
				aria-label={t('shopping.v2.summary.startShopCtaAria', { count: unchecked.length })}
			>
				{t('shopping.v2.summary.startShopCta')}
			</Button>
			<Button variant="secondary" fullWidth onclick={onAddItem}>
				{t('shopping.v2.summary.addItemCta')}
			</Button>
		{/if}
	</div>
</section>

<style>
	.summary {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.summary-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}

	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.pill {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font-size: 0.8125rem;
		font-weight: 600;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pill-count {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		color: var(--color-primary);
	}

	.pill-muted {
		color: var(--color-text-muted);
		background: var(--color-surface-muted);
	}

	.summary-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
