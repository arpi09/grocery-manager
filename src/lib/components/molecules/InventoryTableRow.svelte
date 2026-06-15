<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import PriceMemoryChip from '$lib/components/molecules/PriceMemoryChip.svelte';
	import RowOverflowMenu from '$lib/components/molecules/RowOverflowMenu.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { isMovingToAutoExpiredSoon } from '$lib/domain/auto-expired';
	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
	import { daysUntilExpiry, formatExpiryDate, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
	import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		item: InventoryItem;
		canWrite?: boolean;
		finished?: boolean;
		autoExpired?: boolean;
		autoExpiredGraceDays?: number;
		finishing?: boolean;
		onFinishOneTap?: (item: InventoryItem) => void;
		onPartialConsume?: (item: InventoryItem) => void;
	}

	let {
		item,
		canWrite = false,
		finished = false,
		autoExpired = false,
		autoExpiredGraceDays = 7,
		finishing = false,
		onFinishOneTap,
		onPartialConsume
	}: Props = $props();

	function formatQuantityCell(item: InventoryItem, showRemaining: boolean) {
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

	const quantityCell = $derived(formatQuantityCell(item, showRemainingLabel));

	function expiryTone(date: string) {
		const days = daysUntilExpiry(date);
		return days >= 0 && days <= EXPIRING_SOON_DAYS ? 'warning' : 'default';
	}

	const expiryLabel = $derived(
		item.expiresOn && !finished ? formatExpiryDate(item.expiresOn, getLocale()) : null
	);

	const movingSoon = $derived(
		!finished && !autoExpired && isMovingToAutoExpiredSoon(item, autoExpiredGraceDays)
	);

	const showConsumeActions = $derived(
		canWrite && !finished && (onFinishOneTap || onPartialConsume)
	);

	const priceMemoryKey = $derived(normalizeReceiptProductName(item.name));
</script>

<tr class="data-row" class:finished class:autoExpired={autoExpired}>
	<td class="col-name">
		<a href="/item/{item.id}/edit" class="name">{item.name}</a>
		{#if item.notes}
			<p class="notes" title={item.notes}>{item.notes}</p>
		{/if}
		<div class="row-badges">
			{#if finished}
				<Badge tone="default">{t('inventory.finishedBadge')}</Badge>
			{:else if autoExpired}
				<Badge tone="warning">{t('inventory.autoExpiredBadge')}</Badge>
			{/if}
			{#if movingSoon}
				<Badge tone="warning">{t('inventory.movingToAutoExpiredSoon')}</Badge>
			{/if}
			{#if !finished && !autoExpired && priceMemoryKey}
				<PriceMemoryChip normalizedKey={priceMemoryKey} />
			{/if}
		</div>
	</td>
	<td class="col-qty" data-label={t('inventory.columnQuantity')}>
		<span class="qty">{quantityCell}</span>
	</td>
	<td class="col-expiry" data-label={t('inventory.columnExpiry')}>
		{#if expiryLabel}
			<Badge tone={autoExpired ? 'default' : expiryTone(item.expiresOn!)}>
				{expiryLabel}
			</Badge>
			{#if isEstimatedExpirySource(item.expiresOnSource) && !finished && !autoExpired}
				<EstimatedBadge source={item.expiresOnSource} />
			{/if}
		{:else}
			<span class="muted">—</span>
		{/if}
	</td>
	<td class="col-actions">
		{#if showConsumeActions}
			<div class="action-group">
				{#if onFinishOneTap}
					<Button
						type="button"
						class="finish-btn"
						loading={finishing}
						loadingLabel={t('common.processing')}
						aria-label={t('consume.finishNamed', { name: item.name })}
						onclick={() => onFinishOneTap(item)}
					>
						{t('consume.finish')}
					</Button>
				{/if}
				<RowOverflowMenu
					itemId={item.id}
					itemName={item.name}
					disabled={finishing}
					onPartialConsume={onPartialConsume ? () => onPartialConsume(item) : undefined}
				/>
			</div>
		{/if}
	</td>
</tr>

<style>
	.data-row {
		transition: background-color 0.12s ease;
	}

	.data-row.finished {
		opacity: 0.78;
	}

	.data-row.autoExpired {
		background: color-mix(in srgb, var(--color-warning) 5%, transparent);
	}

	.data-row td {
		padding: 0.4rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	.col-name {
		min-width: 8rem;
		max-width: 1px;
		width: 42%;
	}

	.name {
		display: inline-block;
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.35;
		color: var(--color-text);
		text-decoration: none;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name:hover {
		color: var(--color-primary);
	}

	.notes {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.35;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		margin-top: 0.2rem;
	}

	.col-qty {
		width: 18%;
		white-space: nowrap;
	}

	.qty {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.col-expiry {
		width: 22%;
		white-space: nowrap;
	}

	.muted {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.col-actions {
		width: auto;
		min-width: 7.5rem;
		text-align: right;
		white-space: nowrap;
	}


	.action-group :global(.finish-btn) {
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.65rem;
		font-size: 0.75rem;
	}
</style>
