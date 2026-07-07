<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { sortUncheckedItems } from '$lib/domain/shopping-trip';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';

	// Resolved member name is a view concern layered on the domain item by the
	// page load; optional so the plain domain array stays assignable here.
	type SummaryItem = ShoppingListItem & { addedByName?: string | null };

	interface Props {
		items: SummaryItem[];
		canEdit: boolean;
		onStartShop: () => void;
		onAddItem: () => void;
		/** Per-row remove with undo receipt — trust contract: nothing leaves the list silently. */
		onRemoveItem?: (item: SummaryItem) => void;
		removingId?: string | null;
	}

	let {
		items,
		canEdit,
		onStartShop,
		onAddItem,
		onRemoveItem,
		removingId = null
	}: Props = $props();

	const unchecked = $derived(sortUncheckedItems(items));
	const hasItems = $derived(unchecked.length > 0);

	function amountLabel(item: ShoppingListItem): string {
		if (!item.quantity && !item.unit) {
			return '';
		}
		return `${item.quantity ?? ''}${item.unit ? ` ${item.unit}` : ''}`.trim();
	}
</script>

<section class="summary" aria-labelledby="shopping-v2-summary-heading">
	<div class="summary-head">
		<h2 id="shopping-v2-summary-heading" class="summary-title">{t('shopping.v2.summary.title')}</h2>
		{#if hasItems}
			<span class="count-badge">{t('shopping.v2.summary.countPill', { count: unchecked.length })}</span>
		{/if}
	</div>

	<!-- Whole list visible inline — no extra tap into a drawer just to see what's on it. -->
	<div class="list-block" data-testid="shopping-v2-summary-pills">
		{#if hasItems}
			<ul class="item-rows">
				{#each unchecked as item (item.id)}
					<li class="item-row">
						<span class="item-main">
							<span class="item-name">{item.name}</span>
							{#if item.addedByName}
								<span class="item-provenance"
									>{t('shopping.v2.summary.addedBy', { name: item.addedByName })}</span
								>
							{/if}
						</span>
						{#if amountLabel(item)}
							<span class="item-amount">{amountLabel(item)}</span>
						{/if}
						{#if canEdit && onRemoveItem}
							<button
								type="button"
								class="item-remove"
								disabled={removingId === item.id}
								aria-label={t('shopping.v2.remove.aria', { name: item.name })}
								data-testid="shopping-v2-remove-item"
								onclick={() => onRemoveItem(item)}
							>
								<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
									<path
										d="M4 4l8 8M12 4l-8 8"
										stroke="currentColor"
										stroke-width="1.75"
										stroke-linecap="round"
									/>
								</svg>
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty-line">{t('shopping.v2.summary.empty')}</p>
		{/if}
	</div>

	<div class="summary-actions">
		{#if canEdit && hasItems}
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

	.summary-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.summary-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}

	.count-badge {
		flex-shrink: 0;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		color: var(--color-primary);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.list-block {
		min-width: 0;
	}

	.item-rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.item-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: 0.25rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
	}

	.item-remove {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min, 2.75rem);
		min-height: var(--touch-target-min, 2.75rem);
		margin: 0;
		padding: 0;
		border: none;
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
	}

	.item-remove svg {
		width: 1rem;
		height: 1rem;
	}

	.item-remove:hover {
		color: var(--color-danger, #b3261e);
	}

	.item-remove:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.item-remove:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.item-row:last-child {
		border-bottom: none;
	}

	.item-main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.item-name {
		min-width: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.item-provenance {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-muted);
		overflow-wrap: anywhere;
	}

	.item-amount {
		flex-shrink: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.empty-line {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.summary-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
