<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
	import RowOverflowMenu from '$lib/components/molecules/RowOverflowMenu.svelte';
	import SkaffuListItem from '$lib/components/molecules/SkaffuListItem.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { isMovingToAutoExpiredSoon } from '$lib/domain/auto-expired';
	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
	import {
		daysUntilExpiry,
		formatDaysLeft,
		formatExpiryDate,
		EXPIRING_SOON_DAYS
	} from '$lib/domain/expiry';
	import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
	import { buildInventoryShelfLifeExplanation } from '$lib/domain/learning/prediction-explain';
	import { getLocale, t } from '$lib/i18n';
	import {
		clampSwipeOffset,
		resolveSwipeAction,
		resolveSwipeAxis
	} from '$lib/utils/row-swipe';

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

	let swipeOffset = $state(0);
	let swipeDragging = $state(false);
	let swipeStartX = 0;
	let swipeStartY = 0;
	let swipeAxis: 'x' | 'y' | null = null;
	let swipePointerId: number | null = null;

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

	const movingSoon = $derived(
		!finished && !autoExpired && isMovingToAutoExpiredSoon(item, autoExpiredGraceDays)
	);

	function expiryTone(date: string) {
		const days = daysUntilExpiry(date);
		return days >= 0 && days <= EXPIRING_SOON_DAYS ? 'warning' : 'default';
	}

	const expiryExplanation = $derived.by(() => {
		if (!isEstimatedExpirySource(item.expiresOnSource)) return null;
		return buildInventoryShelfLifeExplanation(
			{ productName: item.name, source: item.expiresOnSource!, location: item.location },
			getLocale()
		);
	});

	const expiryLabel = $derived.by(() => {
		if (!item.expiresOn || finished) return null;
		const days = daysUntilExpiry(item.expiresOn);
		if (days >= 0 && days <= EXPIRING_SOON_DAYS) {
			return formatDaysLeft(days, getLocale());
		}
		return formatExpiryDate(item.expiresOn, getLocale());
	});

	const showEstimatedBadge = $derived(
		isEstimatedExpirySource(item.expiresOnSource) && !finished && !autoExpired
	);

	const showMissingDateHint = $derived(
		!finished && !autoExpired && !item.expiresOn && !showEstimatedBadge
	);

	const showConsumeActions = $derived(
		canWrite && !finished && (onFinishOneTap || onPartialConsume)
	);

	const swipeEnabled = $derived(showConsumeActions && !finishing);

	const partialSwipeLabel = $derived(t('consume.swipePartial'));

	const rowClass = $derived(
		[
			'inventory-row',
			finished ? 'finished' : '',
			autoExpired ? 'autoExpired' : '',
			swipeEnabled ? 'inventory-row--swipe' : ''
		]
			.filter(Boolean)
			.join(' ')
	);

	function resetSwipe() {
		swipeDragging = false;
		swipeAxis = null;
		swipeOffset = 0;
		swipePointerId = null;
	}

	function onSwipePointerDown(event: PointerEvent) {
		if (!swipeEnabled) return;
		swipeStartX = event.clientX;
		swipeStartY = event.clientY;
		swipeAxis = null;
		swipePointerId = event.pointerId;
	}

	function onSwipePointerMove(event: PointerEvent) {
		if (swipePointerId !== event.pointerId) return;

		const deltaX = event.clientX - swipeStartX;
		const deltaY = event.clientY - swipeStartY;

		if (!swipeAxis) {
			swipeAxis = resolveSwipeAxis(deltaX, deltaY);
			if (!swipeAxis) return;
		}

		if (swipeAxis === 'y') {
			resetSwipe();
			return;
		}

		if (!swipeDragging) {
			swipeDragging = true;
			try {
				(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
			} catch {
				// Pointer may already be released or captured elsewhere.
			}
		}

		event.preventDefault();
		swipeOffset = clampSwipeOffset(deltaX);
	}

	function onSwipePointerUp(event: PointerEvent) {
		if (swipePointerId !== event.pointerId) return;

		const deltaX = event.clientX - swipeStartX;
		const action = swipeDragging && swipeAxis === 'x' ? resolveSwipeAction(deltaX) : null;

		if (event.currentTarget instanceof HTMLElement && swipeDragging) {
			try {
				event.currentTarget.releasePointerCapture(event.pointerId);
			} catch {
				// Pointer may already be released.
			}
		}

		if (action === 'finish') {
			event.preventDefault();
			onFinishOneTap?.(item);
		} else if (action === 'partial') {
			event.preventDefault();
			onPartialConsume?.(item);
		}

		resetSwipe();
	}

	function onSwipePointerCancel() {
		resetSwipe();
	}
</script>

{#snippet rowContent()}
	<div class="content">
		<div class="main-line">
			<a href="/item/{item.id}/edit" class="name">{item.name}</a>
			{#if showEstimatedBadge}
				<EstimatedBadge source={item.expiresOnSource} explanation={expiryExplanation} showSettingsLink />
			{/if}
			{#if showMissingDateHint}
				<span class="missing-date">{t('inventory.missingExpiryDate')}</span>
			{/if}
			<span class="sep" aria-hidden="true">·</span>
			<span class="qty">{quantityLine}</span>
		</div>

		{#if finished || autoExpired || movingSoon || expiryLabel}
			<div class="subline">
				{#if finished}
					<Badge tone="default">{t('inventory.finishedBadge')}</Badge>
				{:else if autoExpired}
					<Badge tone="warning">{t('inventory.autoExpiredBadge')}</Badge>
				{/if}
				{#if movingSoon}
					<Badge tone="warning">{t('inventory.movingToAutoExpiredSoon')}</Badge>
				{/if}
				{#if expiryLabel}
					<Badge tone={autoExpired ? 'default' : expiryTone(item.expiresOn!)}>
						{expiryLabel}
					</Badge>
				{/if}
			</div>
		{/if}
	</div>

	{#if showConsumeActions}
		<div class="actions">
			<RowOverflowMenu
				itemId={item.id}
				itemName={item.name}
				disabled={finishing}
				{finishing}
				onFinishOneTap={onFinishOneTap ? () => onFinishOneTap(item) : undefined}
				onPartialConsume={onPartialConsume ? () => onPartialConsume(item) : undefined}
			/>
		</div>
	{/if}
{/snippet}

<SkaffuListItem class={rowClass} data-testid="inventory-compact-row">
	{#if swipeEnabled}
		<div class="swipe-row">
			<div class="swipe-bg" aria-hidden="true">
				<span class="swipe-hint swipe-hint--partial">{partialSwipeLabel}</span>
				<span class="swipe-hint swipe-hint--finish">{t('consume.swipeFinish')}</span>
			</div>
			<div
				class="swipe-content"
				class:swipe-dragging={swipeDragging}
				style:transform="translateX({swipeOffset}px)"
			>
				<div
					class="swipe-handle"
					role="group"
					aria-label={item.name}
					data-testid="inventory-swipe-handle"
					onpointerdown={onSwipePointerDown}
					onpointermove={onSwipePointerMove}
					onpointerup={onSwipePointerUp}
					onpointercancel={onSwipePointerCancel}
				>
					{@render rowContent()}
				</div>
			</div>
		</div>
	{:else}
		<div class="row-body">
			{@render rowContent()}
		</div>
	{/if}
</SkaffuListItem>

<style>
	:global(.inventory-row.finished) :global(.mdc-deprecated-list-item__wrapper) {
		opacity: 0.78;
	}

	:global(.inventory-row.autoExpired) :global(.mdc-deprecated-list-item__wrapper) {
		background: color-mix(in srgb, var(--color-warning) 5%, var(--color-surface));
	}

	:global(.inventory-row--swipe) :global(.mdc-deprecated-list-item__wrapper) {
		padding: 0;
		overflow-x: hidden;
		overflow-y: visible;
	}

	.swipe-row {
		position: relative;
		width: 100%;
		overflow: hidden;
	}

	.swipe-bg {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		pointer-events: none;
	}

	.swipe-hint {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 5.5rem;
		min-height: var(--touch-target-min);
		padding: 0 var(--space-sm);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-on-primary);
	}

	.swipe-hint--partial {
		background: var(--color-primary);
	}

	.swipe-hint--finish {
		background: var(--color-success, #2d8a4e);
	}

	.swipe-content {
		position: relative;
		z-index: 1;
		width: 100%;
		background: var(--color-surface);
		transition: transform 0.18s ease;
		will-change: transform;
	}

	.swipe-handle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		width: 100%;
		min-height: var(--touch-target-min);
		padding: var(--space-sm) var(--space-md);
		touch-action: pan-y;
		cursor: grab;
	}

	.row-body {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		width: 100%;
	}

	.swipe-content.swipe-dragging {
		transition: none;
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.main-line {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-xs);
		min-width: 0;
	}

	.name {
		flex: 1 1 auto;
		min-width: 0;
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.35;
		color: var(--color-text);
		text-decoration: none;
	}

	.name:hover {
		color: var(--color-primary);
	}

	.missing-date {
		flex-shrink: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.sep {
		flex-shrink: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.qty {
		flex-shrink: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.subline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
	}

	.actions {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.swipe-content {
			transition: none;
		}
	}
</style>
