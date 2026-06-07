<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
	import {
		daysUntilExpiry,
		formatDaysLeft,
		formatExpiryDate,
		EXPIRING_SOON_DAYS
	} from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		item: InventoryItem;
		canWrite?: boolean;
		finished?: boolean;
		autoExpired?: boolean;
		onLogUsage?: (item: InventoryItem) => void;
	}

	let { item, canWrite = false, finished = false, autoExpired = false, onLogUsage }: Props =
		$props();

	function formatQuantityLine(showRemaining: boolean) {
		const unitSuffix = item.unit ? ` ${item.unit}` : '';
		const amount = `${item.quantity}${unitSuffix}`.trim();
		if (!showRemaining) return amount;
		return t('inventory.quantityLeft', { amount });
	}

	const showRemainingLabel = $derived.by(() => {
		if (finished) return false;
		const stock = parseNumericQuantity(item.quantity);
		return stock !== null && stock > 0;
	});

	const quantityLine = $derived(formatQuantityLine(showRemainingLabel));

	function expiryTone(date: string) {
		const days = daysUntilExpiry(date);
		return days >= 0 && days <= EXPIRING_SOON_DAYS ? 'warning' : 'default';
	}

	const expiryLabel = $derived.by(() => {
		if (!item.expiresOn || finished) return null;
		const days = daysUntilExpiry(item.expiresOn);
		if (days >= 0 && days <= EXPIRING_SOON_DAYS) {
			return formatDaysLeft(days, getLocale());
		}
		return formatExpiryDate(item.expiresOn, getLocale());
	});
</script>

<article class="row" class:finished class:autoExpired={autoExpired}>
	<div class="primary">
		<a href="/item/{item.id}/edit" class="name">{item.name}</a>
		<div class="meta">
			{#if finished}
				<Badge tone="default">{t('inventory.finishedBadge')}</Badge>
			{:else if autoExpired}
				<Badge tone="warning">{t('inventory.autoExpiredBadge')}</Badge>
			{/if}
			{#if expiryLabel}
				<Badge tone={autoExpired ? 'default' : expiryTone(item.expiresOn!)}>
					{expiryLabel}
				</Badge>
			{/if}
		</div>
	</div>
	<div class="secondary">
		<span class="qty">{quantityLine}</span>
		{#if canWrite && !finished && onLogUsage}
			<button
				type="button"
				class="log-btn"
				onclick={() => onLogUsage(item)}
			>
				{t('consume.logUsage')}
			</button>
		{/if}
	</div>
</article>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-height: 3rem;
		padding: 0.45rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.row.finished {
		opacity: 0.78;
	}

	.row.autoExpired {
		background: color-mix(in srgb, var(--color-warning) 5%, var(--color-surface));
	}

	.primary {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-width: 0;
	}

	.name {
		flex: 1;
		min-width: 0;
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.3;
		color: var(--color-text);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name:hover {
		color: var(--color-primary);
	}

	.meta {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.2rem;
	}

	.secondary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.qty {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.log-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.75rem;
		font-weight: 600;
		font-family: inherit;
		color: var(--color-primary);
		cursor: pointer;
		flex-shrink: 0;
	}

	.log-btn:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
	}
</style>
