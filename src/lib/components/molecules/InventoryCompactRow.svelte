<script lang="ts">

	import Badge from '$lib/components/atoms/Badge.svelte';

	import Button from '$lib/components/atoms/Button.svelte';

	import type { InventoryItem } from '$lib/domain/inventory-item';

	import { isMovingToAutoExpiredSoon } from '$lib/domain/auto-expired';

	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';

	import {

		daysUntilExpiry,

		formatDaysLeft,

		formatExpiryDate,

		EXPIRING_SOON_DAYS

	} from '$lib/domain/expiry';

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

		!finished &&

			!autoExpired &&

			isMovingToAutoExpiredSoon(item, autoExpiredGraceDays)

	);



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



	const showConsumeActions = $derived(

		canWrite && !finished && (onFinishOneTap || onPartialConsume)

	);



	const swipeEnabled = $derived(showConsumeActions && !finishing);



	function resetSwipe() {
		swipeDragging = false;
		swipeAxis = null;
		swipeOffset = 0;
		swipePointerId = null;
	}

	function onSwipePointerDown(event: PointerEvent) {
		if (!swipeEnabled) return;
		if (event.target instanceof Element && event.target.closest('button')) return;

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
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
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



{#if swipeEnabled}

	<div class="swipe-row" data-testid="inventory-compact-row">

		<div class="swipe-bg" aria-hidden="true">

			<span class="swipe-hint swipe-hint--partial">{t('consume.partial')}</span>

			<span class="swipe-hint swipe-hint--finish">{t('consume.finish')}</span>

		</div>

		<div

			class="row swipe-content"

			class:finished

			class:autoExpired={autoExpired}

			class:swipe-dragging={swipeDragging}

			style:transform="translateX({swipeOffset}px)"

			onpointerdown={onSwipePointerDown}

			onpointermove={onSwipePointerMove}

			onpointerup={onSwipePointerUp}

			onpointercancel={onSwipePointerCancel}

		>

			<div class="primary">

				<a href="/item/{item.id}/edit" class="name">{item.name}</a>

				<div class="meta">

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

			</div>

			<div class="secondary">

				<span class="qty">{quantityLine}</span>

				<div class="actions">

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

					{#if onPartialConsume}

						<button

							type="button"

							class="partial-btn"

							disabled={finishing}

							onclick={() => onPartialConsume(item)}

						>

							{t('consume.partial')}

						</button>

					{/if}

				</div>

			</div>

		</div>

	</div>

{:else}

	<article class="row" class:finished class:autoExpired={autoExpired} data-testid="inventory-compact-row">

		<div class="primary">

			<a href="/item/{item.id}/edit" class="name">{item.name}</a>

			<div class="meta">

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

		</div>

		<div class="secondary">

			<span class="qty">{quantityLine}</span>

			{#if showConsumeActions}

				<div class="actions">

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

					{#if onPartialConsume}

						<button

							type="button"

							class="partial-btn"

							disabled={finishing}

							onclick={() => onPartialConsume(item)}

						>

							{t('consume.partial')}

						</button>

					{/if}

				</div>

			{/if}

		</div>

	</article>

{/if}



<style>

	.swipe-row {

		position: relative;

		overflow: hidden;

		border-bottom: 1px solid var(--color-border);

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

		padding: 0 0.75rem;

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

		touch-action: pan-y;

		transition: transform 0.18s ease;

		will-change: transform;

	}



	.swipe-content.swipe-dragging {

		transition: none;

	}



	.row {

		display: flex;

		flex-direction: column;

		gap: 0.2rem;

		min-height: 3rem;

		padding: 0.45rem 0.5rem;

		border-bottom: 1px solid var(--color-border);

		background: var(--color-surface);

	}



	.swipe-row .row {

		border-bottom: none;

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



	.actions {

		display: inline-flex;

		align-items: center;

		gap: 0.35rem;

		flex-shrink: 0;

	}



	.actions :global(.finish-btn) {

		min-height: var(--touch-target-min);

		padding: 0.35rem 0.75rem;

		font-size: 0.75rem;

	}



	.partial-btn {

		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-height: var(--touch-target-min);

		padding: 0.35rem 0.5rem;

		border: none;

		border-radius: var(--radius-sm);

		background: transparent;

		font-size: 0.75rem;

		font-weight: 600;

		font-family: inherit;

		color: var(--color-primary);

		text-decoration: underline;

		text-underline-offset: 0.12em;

		cursor: pointer;

	}



	.partial-btn:hover:not(:disabled) {

		color: var(--color-primary-hover);

	}



	.partial-btn:disabled {

		opacity: 0.55;

		cursor: not-allowed;

	}



	@media (prefers-reduced-motion: reduce) {

		.swipe-content {

			transition: none;

		}

	}

</style>

