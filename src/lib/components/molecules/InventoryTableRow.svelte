<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
	import PriceMemoryChip from '$lib/components/molecules/PriceMemoryChip.svelte';
	import RowOverflowMenu from '$lib/components/molecules/RowOverflowMenu.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { isMovingToAutoExpiredSoon } from '$lib/domain/auto-expired';
	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
	import { daysUntilExpiry, formatExpiryDate, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
	import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
	import { buildInventoryShelfLifeExplanation } from '$lib/domain/learning/prediction-explain';
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

	const expiryExplanation = $derived.by(() => {
		if (!isEstimatedExpirySource(item.expiresOnSource)) return null;
		return buildInventoryShelfLifeExplanation(
			{ productName: item.name, source: item.expiresOnSource!, location: item.location },
			getLocale()
		);
	});

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

	const showEstimatedBadge = $derived(
		isEstimatedExpirySource(item.expiresOnSource) && !finished && !autoExpired
	);

	const showNoExpiryHint = $derived(
		!item.expiresOn && !finished && !autoExpired && !showEstimatedBadge
	);

	const showConsumeActions = $derived(
		canWrite && !finished && (onFinishOneTap || onPartialConsume)
	);

	const priceMemoryKey = $derived(normalizeReceiptProductName(item.name));
</script>

<article class="inventory-card product-row" class:finished class:autoExpired={autoExpired}>
	<div class="card-main">
		<div class="name-row">
			<a href="/item/{item.id}/edit" class="name">{item.name}</a>
			{#if showEstimatedBadge}
				<EstimatedBadge source={item.expiresOnSource} explanation={expiryExplanation} showSettingsLink />
			{/if}
		</div>
		{#if item.notes}
			<p class="notes" title={item.notes}>{item.notes}</p>
		{/if}
		<div class="meta-row">
			<span class="qty">{quantityCell}</span>
			{#if expiryLabel}
				<Badge tone={autoExpired ? 'default' : expiryTone(item.expiresOn!)}>
					{expiryLabel}
				</Badge>
			{:else if showNoExpiryHint}
				<span class="no-expiry-hint">{t('inventory.noExpiryHint')}</span>
			{/if}
		</div>
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
	</div>
	{#if showConsumeActions}
		<div class="card-actions">
			<RowOverflowMenu
				itemId={item.id}
				itemName={item.name}
				disabled={finishing}
				finishing={finishing}
				onFinishOneTap={onFinishOneTap ? () => onFinishOneTap(item) : undefined}
				onPartialConsume={onPartialConsume ? () => onPartialConsume(item) : undefined}
			/>
		</div>
	{/if}
</article>

<style>
	.inventory-card {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		transition: background-color 0.12s ease;
	}

	.inventory-card.finished {
		opacity: 0.78;
	}

	.inventory-card.autoExpired {
		background: color-mix(in srgb, var(--color-warning) 5%, var(--color-surface));
	}

	.card-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.name-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
	}

	.name {
		font-weight: 600;
		font-size: 0.9375rem;
		line-height: 1.35;
		color: var(--color-text);
		text-decoration: none;
	}

	.name:hover {
		color: var(--color-primary);
	}

	.notes {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.35;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
	}

	.qty {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.no-expiry-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.row-badges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.card-actions {
		flex-shrink: 0;
	}
</style>
