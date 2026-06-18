<script lang="ts">
	import MemorySuggestionList from '$lib/components/molecules/MemorySuggestionList.svelte';
	import TripSummaryPills from '$lib/components/molecules/TripSummaryPills.svelte';
	import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';
	import { buildPlanHeaderTitle } from '$lib/domain/shopping-v2-presenter';
	import { sortUncheckedItems } from '$lib/domain/shopping-trip';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';

	interface Props {
		items: ShoppingListItem[];
		suggestions: ReplenishmentSuggestion[];
		canEdit: boolean;
		tripLabel?: string | null;
		showReceiptLead?: boolean;
		acceptingKey?: string | null;
		dismissingKey?: string | null;
		onAcceptSuggestion: (suggestion: ReplenishmentSuggestion) => void | Promise<void>;
		onDismissSuggestion: (suggestion: ReplenishmentSuggestion) => void | Promise<void>;
		onStartShop: () => void;
		onAddItem: () => void;
		onOpenLegacy: () => void;
	}

	let {
		items,
		suggestions,
		canEdit,
		tripLabel = null,
		showReceiptLead = false,
		acceptingKey = null,
		dismissingKey = null,
		onAcceptSuggestion,
		onDismissSuggestion,
		onStartShop,
		onAddItem,
		onOpenLegacy
	}: Props = $props();

	const header = $derived(buildPlanHeaderTitle(tripLabel));
	const uncheckedCount = $derived(sortUncheckedItems(items).length);
	const hasMemory = $derived(suggestions.length > 0);

	const subtitle = $derived.by(() => {
		if (uncheckedCount === 0) {
			return t('shopping.v2.plan.subtitleEmpty');
		}
		const base = t('shopping.v2.plan.subtitle', { count: uncheckedCount, store: '' }).replace(
			/\s·\s$/,
			''
		);
		return hasMemory ? `${base} · ${t('shopping.v2.plan.subtitleMemory')}` : base;
	});
</script>

<div class="plan-view" data-testid="shopping-v2-plan">
	<header class="plan-header">
		<h1 class="plan-title">
			{header.useTripLabel
				? t('shopping.v2.plan.titleTrip', { name: header.tripLabel })
				: t('shopping.v2.plan.titleDefault')}
		</h1>
		<p class="plan-subtitle">{subtitle}</p>
	</header>

	<div class="plan-illus" aria-label={t('shopping.v2.plan.illustrationAria')}>
		<img src="/illustrations/v2/shopping-plan.svg" alt="" width="280" height="140" aria-hidden="true" />
	</div>

	{#if showReceiptLead}
		<p class="receipt-lead" role="status">{t('shopping.v2.receiptLead')}</p>
	{/if}

	<MemorySuggestionList
		{suggestions}
		{items}
		{canEdit}
		{acceptingKey}
		{dismissingKey}
		onAccept={onAcceptSuggestion}
		onDismiss={onDismissSuggestion}
	/>

	<TripSummaryPills {items} {canEdit} {onStartShop} {onAddItem} />

	{#if canEdit}
		<button type="button" class="legacy-link" onclick={onOpenLegacy}>
			{t('shopping.v2.overflow.legacyList')}
		</button>
	{/if}
</div>

<style>
	.plan-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.plan-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.plan-title {
		margin: 0;
		font-size: var(--font-size-display, 1.75rem);
		font-weight: var(--font-weight-display, 700);
		line-height: 1.15;
	}

	.plan-subtitle {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.plan-illus {
		display: flex;
		justify-content: center;
	}

	.plan-illus img {
		width: min(100%, 280px);
		height: auto;
	}

	.receipt-lead {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		white-space: pre-line;
	}

	.legacy-link {
		align-self: flex-start;
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		text-decoration: underline;
		min-height: var(--touch-target-min);
	}

	.legacy-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
