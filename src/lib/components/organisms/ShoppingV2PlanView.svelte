<script lang="ts">
	import MemorySuggestionList from '$lib/components/molecules/MemorySuggestionList.svelte';
	import TripSummaryPills from '$lib/components/molecules/TripSummaryPills.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';
	import { buildPlanHeaderTitle } from '$lib/domain/shopping-v2-presenter';
	import { sortUncheckedItems } from '$lib/domain/shopping-trip';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';
	import { receiptOneTapHref } from '$lib/utils/scan-nav';

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
		onOpenLegacy,
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
		{#if header.useTripLabel}
			<h2 class="plan-trip">
				{t('shopping.v2.plan.titleTrip', { name: header.tripLabel })}
			</h2>
		{/if}
		<p class="plan-subtitle">{subtitle}</p>
	</header>

	{#if uncheckedCount === 0}
		<EmptyState
			title={t('shopping.v2.plan.emptyTitle')}
			description={t('shopping.v2.plan.emptyBody')}
			actionLabel={canEdit ? t('shopping.v2.plan.emptyCta') : undefined}
			actionVariant="secondary"
			onAction={canEdit ? onAddItem : undefined}
			primaryAnalyticsId="shopping.v2.plan.empty_add"
		/>
	{/if}

	{#if showReceiptLead}
		<p class="receipt-lead" role="status">{t('shopping.v2.receiptLead')}</p>
	{/if}

	{#if canEdit}
		<div class="receipt-import-cta" data-testid="inkop-receipt-one-tap">
			<p class="receipt-import-lead">{t('receiptAutomation.oneTapLead')}</p>
			<a class="btn btn-primary btn-full" href={receiptOneTapHref('/inkop')}>
				{t('receiptAutomation.oneTapCta')}
			</a>
		</div>
	{/if}

	<MemorySuggestionList
		{suggestions}
		{items}
		{canEdit}
		{acceptingKey}
		{dismissingKey}
		deemphasizeCadence={true}
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

	.plan-trip {
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

	.receipt-import-cta {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
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


	.compare-stores-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.legacy-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
