<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchPurchaseMemoryTimeline } from '$lib/client/price-memory';
	import {
		buildPriceMemoryContext,
		formatPriceMemoryAmount,
		formatPriceMemoryMonthYear
	} from '$lib/domain/price-memory-format';
	import type {
		PurchaseMemorySearchResult,
		PurchaseMemorySummary,
		PurchaseMemoryTimelineEntry
	} from '$lib/domain/price-memory';
	import { getLocale, t } from '$lib/i18n';

	type MemoryCardData = PurchaseMemorySummary | PurchaseMemorySearchResult;

	interface Props {
		summary: MemoryCardData;
		entryPoint?: string;
		expandable?: boolean;
	}

	let { summary, entryPoint = 'search', expandable = true }: Props = $props();

	let expanded = $state(false);
	let timeline = $state<PurchaseMemoryTimelineEntry[]>([]);
	let loadingTimeline = $state(false);

	const locale = $derived(getLocale() === 'en' ? 'en-SE' : 'sv-SE');
	const pricedTimelineCount = $derived(
		timeline.filter((entry) => entry.unitPrice != null).length
	);
	const showTimelineToggle = $derived(
		expandable && (summary.purchaseCount >= 2 || pricedTimelineCount >= 2)
	);

	const lastLine = $derived.by(() => {
		if (!summary.lastPaid) return null;
		const context = buildPriceMemoryContext(summary.lastPaid, locale);
		if (context.storeLabel) {
			return t('priceMemory.card.lastPurchasedWithStore', {
				store: context.storeLabel,
				price: context.formattedUnitPrice,
				date: context.monthYear
			});
		}
		return t('priceMemory.card.lastPurchased', {
			price: context.formattedUnitPrice,
			date: context.monthYear
		});
	});

	const purchaseCountLabel = $derived(
		t('priceMemory.card.purchaseCount', { count: summary.purchaseCount })
	);

	function formatTimelineRow(entry: PurchaseMemoryTimelineEntry): string {
		const date = formatPriceMemoryMonthYear(entry.purchasedAt, locale);
		if (!entry.unitPrice) {
			return entry.storeLabel
				? t('priceMemory.card.timelineNoPriceWithStore', { date, store: entry.storeLabel })
				: t('priceMemory.card.timelineNoPrice', { date });
		}
		const price = formatPriceMemoryAmount(entry.unitPrice, entry.currency);
		return entry.storeLabel
			? t('priceMemory.card.timelineRowWithStore', { date, price, store: entry.storeLabel })
			: t('priceMemory.card.timelineRow', { date, price });
	}

	async function toggleTimeline() {
		if (expanded) {
			expanded = false;
			return;
		}
		if (!timeline.length && !loadingTimeline) {
			loadingTimeline = true;
			timeline = await fetchPurchaseMemoryTimeline({
				conceptKey: summary.conceptKey,
				key: summary.normalizedKey,
				entryPoint
			});
			loadingTimeline = false;
		}
		expanded = true;
	}
</script>

<Card class="purchase-memory-card" data-testid="purchase-memory-card">
	<div class="card-header">
		<h3 class="product-name">{summary.displayName}</h3>
		{#if summary.lastPaid}
			<p class="last-line">{lastLine}</p>
		{/if}
		<p class="meta-line">{purchaseCountLabel}</p>
		<p class="hint">{t('priceMemory.card.fromReceipts')}</p>
	</div>

	{#if showTimelineToggle}
		<button type="button" class="timeline-toggle" onclick={toggleTimeline} aria-expanded={expanded}>
			{expanded ? t('priceMemory.card.hideTimeline') : t('priceMemory.card.showTimeline')}
		</button>
	{/if}

	{#if expanded}
		<ul class="timeline" aria-label={t('priceMemory.card.timelineLabel')}>
			{#each timeline as entry (entry.purchasedAt.toISOString() + entry.productName)}
				<li>{formatTimelineRow(entry)}</li>
			{/each}
		</ul>
	{/if}
</Card>

<style>
	:global(.purchase-memory-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.product-name {
		margin: 0;
		font-size: var(--font-size-body);
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.last-line {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text);
	}

	.meta-line {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.hint {
		margin: 0;
		font-size: var(--font-size-caption);
		color: var(--color-text-muted);
	}

	.timeline-toggle {
		align-self: flex-start;
		border: none;
		background: none;
		padding: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-primary);
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.timeline {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-sm);
	}

	.timeline li {
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}
</style>
