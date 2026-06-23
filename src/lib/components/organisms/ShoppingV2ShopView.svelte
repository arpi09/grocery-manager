<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import ShoppingFocusItem from '$lib/components/molecules/ShoppingFocusItem.svelte';
	import TripProgressBar from '$lib/components/molecules/TripProgressBar.svelte';
	import type { DedupeWarning } from '$lib/domain/dedupe-autopilot';
	import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
	import {
		getFocusItem,
		getPeekOverflowCount,
		getPeekQueue,
		getTripProgress,
		isTripComplete,
		type TripProgress
	} from '$lib/domain/shopping-trip';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';

	interface Props {
		items: ShoppingListItem[];
		focusIndex: number;
		tripTotal: number;
		pickedCount: number;
		canEdit: boolean;
		picking?: boolean;
		storeDedupeByKey?: Record<string, DedupeWarning[]>;
		onPick: (item: ShoppingListItem) => void;
		onBackToPlan: () => void;
		onCompletePantry: () => void;
		onCompletePlan: () => void;
		onOpenLegacy?: () => void;
	}

	let {
		items,
		focusIndex,
		tripTotal,
		pickedCount,
		canEdit,
		picking = false,
		storeDedupeByKey = {},
		onPick,
		onBackToPlan,
		onCompletePantry,
		onCompletePlan,
		onOpenLegacy
	}: Props = $props();

	const progress = $derived<TripProgress>(getTripProgress(pickedCount, tripTotal));
	const focusItem = $derived(getFocusItem(items, focusIndex));
	const peekQueue = $derived(getPeekQueue(items, focusIndex));
	const peekOverflow = $derived(getPeekOverflowCount(items, focusIndex));
	const complete = $derived(isTripComplete(pickedCount, tripTotal));
	const focusDedupeWarnings = $derived.by(() => {
		if (!focusItem) return [] as DedupeWarning[];
		const key = normalizeReceiptProductName(focusItem.name);
		return storeDedupeByKey[key] ?? [];
	});
</script>

<div class="shop-view" data-testid="shopping-v2-shop">
	<div class="shop-top">
		<button type="button" class="back-link" onclick={onBackToPlan} aria-label={t('shopping.v2.shop.backToPlanAria')}>
			{t('shopping.v2.shop.backToPlan')}
		</button>
		{#if onOpenLegacy}
			<button type="button" class="legacy-link" onclick={onOpenLegacy}>
				{t('shopping.v2.overflow.legacyList')}
			</button>
		{/if}
	</div>

	<TripProgressBar {progress} />

	{#if complete}
		<section class="complete-card" data-testid="shopping-v2-trip-complete">
			<h2>{t('shopping.v2.shop.completeTitle')}</h2>
			<p>{t('shopping.v2.shop.completeBody', { count: tripTotal })}</p>
			<div class="complete-actions">
				<Button fullWidth onclick={onCompletePantry}>{t('shopping.v2.shop.completePantryCta')}</Button>
				<Button variant="secondary" fullWidth onclick={onCompletePlan}>
					{t('shopping.v2.shop.completePlanCta')}
				</Button>
			</div>
		</section>
	{:else if focusItem}
		<ShoppingFocusItem
			item={focusItem}
			{canEdit}
			{picking}
			dedupeWarnings={focusDedupeWarnings}
			onPick={() => onPick(focusItem)}
		/>

		<section class="peek" aria-label={t('shopping.v2.shop.peekAria')}>
			<p class="peek-label">{t('shopping.v2.shop.peekLabel')}</p>
			<div class="peek-row">
				{#each peekQueue as item (item.id)}
					<span class="peek-pill">{item.name}</span>
				{/each}
				{#if peekOverflow > 0}
					<span class="peek-pill peek-more">{t('shopping.v2.shop.peekMore', { count: peekOverflow })}</span>
				{/if}
			</div>
		</section>
	{:else}
		<p class="empty-shop">{t('shopping.v2.shop.progressEmpty')}</p>
	{/if}

	<div class="live-region" aria-live="polite" aria-atomic="true"></div>
</div>

<style>
	.shop-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.shop-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-width: 0;
	}

	.legacy-link {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		text-decoration: underline;
		min-height: var(--touch-target-min);
		flex-shrink: 0;
	}

	.legacy-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.back-link {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.back-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.peek {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.peek-label {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.peek-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.peek-pill {
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.peek-more {
		background: var(--color-surface);
	}

	.complete-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		text-align: center;
	}

	.complete-card h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.complete-card p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.complete-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.empty-shop {
		margin: 0;
		text-align: center;
		color: var(--color-text-muted);
	}

	.live-region {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
