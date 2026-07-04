<script lang="ts">
	import SundaySuggestionPanel from '$lib/components/molecules/SundaySuggestionPanel.svelte';
	import TripSummaryPills from '$lib/components/molecules/TripSummaryPills.svelte';
	import FirstRunEmptyState from '$lib/components/molecules/FirstRunEmptyState.svelte';
	import type { SundaySuggestion } from '$lib/domain/sunday-suggestion';
	import { buildPlanHeaderTitle } from '$lib/domain/shopping-v2-presenter';
	import { sortUncheckedItems } from '$lib/domain/shopping-trip';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';
	import { receiptOneTapHref } from '$lib/utils/scan-nav';

	interface Props {
		items: ShoppingListItem[];
		sundayProposal: SundaySuggestion[];
		canEdit: boolean;
		tripLabel?: string | null;
		showReceiptLead?: boolean;
		addingKey?: string | null;
		addingAll?: boolean;
		dismissingKey?: string | null;
		onSundayAdd: (row: SundaySuggestion) => void | Promise<void>;
		onSundayAddAll: (rows: SundaySuggestion[]) => void | Promise<void>;
		onSundayDismiss: (row: SundaySuggestion) => void | Promise<void>;
		onStartShop: () => void;
		onAddItem: () => void;
		onOpenLegacy: () => void;
	}

	let {
		items,
		sundayProposal,
		canEdit,
		tripLabel = null,
		showReceiptLead = false,
		addingKey = null,
		addingAll = false,
		dismissingKey = null,
		onSundayAdd,
		onSundayAddAll,
		onSundayDismiss,
		onStartShop,
		onAddItem,
		onOpenLegacy,
	}: Props = $props();

	const header = $derived(buildPlanHeaderTitle(tripLabel));
	const uncheckedCount = $derived(sortUncheckedItems(items).length);
	const hasProposal = $derived(sundayProposal.length > 0);
	const showEmptyExtras = $derived(uncheckedCount > 0 || hasProposal);

	const subtitle = $derived.by(() => {
		if (uncheckedCount === 0) {
			return t('shopping.v2.plan.subtitleEmpty');
		}
		const base = t('shopping.v2.plan.subtitle', { count: uncheckedCount, store: '' }).replace(
			/\s·\s$/,
			''
		);
		return hasProposal ? `${base} · ${t('shopping.v2.plan.subtitleMemory')}` : base;
	});
</script>

<div class="plan-view" data-testid="shopping-v2-plan">
	<header class="plan-header">
		{#if header.useTripLabel}
			<h2 class="plan-trip">
				{t('shopping.v2.plan.titleTrip', { name: header.tripLabel })}
			</h2>
		{/if}
		{#if uncheckedCount > 0}
			<p class="plan-subtitle">{subtitle}</p>
		{/if}
	</header>

	{#if uncheckedCount === 0}
		<FirstRunEmptyState
			icon="🛒"
			title={t('shopping.v2.plan.emptyTitle')}
			body={t('shopping.v2.plan.emptyBody')}
			ctaLabel={canEdit ? t('shopping.v2.plan.emptyCta') : undefined}
			onCta={canEdit ? onAddItem : undefined}
			helperText={t('shopping.v2.plan.emptyHelper')}
			analyticsId="shopping.v2.plan.empty_add"
			testid="shopping-v2-empty"
		/>
	{/if}

	{#if showReceiptLead && showEmptyExtras}
		<p class="receipt-lead" role="status">{t('shopping.v2.receiptLead')}</p>
	{/if}

	{#if canEdit && showEmptyExtras}
		<!-- Secondary: "Börja handla" is the plan view's single primary CTA. -->
		<div class="receipt-import-cta" data-testid="inkop-receipt-one-tap">
			<a class="receipt-import-link" href={receiptOneTapHref('/inkop')}>
				{t('receiptAutomation.oneTapCta')}
			</a>
		</div>
	{/if}

	<SundaySuggestionPanel
		proposal={sundayProposal}
		{canEdit}
		{addingKey}
		{addingAll}
		{dismissingKey}
		onAdd={onSundayAdd}
		onAddAll={onSundayAddAll}
		onDismiss={onSundayDismiss}
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
		gap: var(--space-md);
	}

	.receipt-import-link {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
	}

	.receipt-import-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
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
