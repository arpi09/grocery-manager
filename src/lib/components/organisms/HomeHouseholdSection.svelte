<script lang="ts">
	import EatFirstSection from '$lib/components/organisms/EatFirstSection.svelte';
	import WastePreventionBanner from '$lib/components/molecules/WastePreventionBanner.svelte';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import {
		briefingVisiblePantryHealth,
		composeHouseholdBriefing,
		BRIEFING_MAX_VISIBLE_LINES
	} from '$lib/domain/household-briefing';
	import type { PantryHealthInsight } from '$lib/domain/pantry-health';
	import { t } from '$lib/i18n';

	interface Props {
		intelligence: HomeIntelligenceSnapshot;
		expiringSoon: InventoryItem[];
		staleCount: number;
		shoppingListCount: number;
		canWrite?: boolean;
		householdId?: string | null;
		pantryAllGood?: boolean;
	}

	let {
		intelligence,
		expiringSoon,
		staleCount,
		shoppingListCount,
		canWrite = false,
		householdId = null,
		pantryAllGood = false
	}: Props = $props();

	const hasExpiring = $derived(expiringSoon.length > 0);

	const briefing = $derived(
		composeHouseholdBriefing({ intelligence, staleCount, shoppingListCount })
	);
	const visiblePantryHealth = $derived(briefingVisiblePantryHealth(briefing));

	const showWaste = $derived(Boolean(briefing.waste) && !hasExpiring);
	const showSync = $derived(staleCount > 0);
	const showCalm = $derived(
		pantryAllGood && !hasExpiring && !showWaste && !showSync && visiblePantryHealth.length === 0
	);

	function pantryHealthMessage(entry: PantryHealthInsight): string {
		if (entry.kind === 'stale') {
			return t('pantryHealth.stale', { count: entry.count });
		}
		if (entry.kind === 'duplicate') {
			return t('pantryHealth.duplicate', {
				count: entry.count,
				name: entry.displayName ?? ''
			});
		}
		return t('pantryHealth.overstock', {
			count: entry.count,
			name: entry.displayName ?? ''
		});
	}

	const pantryHealthRows = $derived(
		visiblePantryHealth.slice(
			0,
			Math.max(
				0,
				BRIEFING_MAX_VISIBLE_LINES -
					(hasExpiring ? 1 : 0) -
					(showWaste ? 1 : 0) -
					(showSync ? 1 : 0)
			)
		)
	);
</script>

<div class="household-stack">
	{#if hasExpiring}
		<div class="household-block household-block--eat-first">
			<EatFirstSection
				compact
				expiringItems={expiringSoon}
				canEdit={canWrite}
				{householdId}
			/>
		</div>
	{/if}

	{#if showWaste && briefing.waste}
		<div class="household-block">
			<WastePreventionBanner alert={briefing.waste} />
		</div>
	{/if}

	{#if showSync}
		<a class="household-row" href="/inventory/synk" data-analytics-id="home.household_sync">
			<span>{t('home.pantryStatusStale', { count: staleCount })}</span>
			<span class="arrow" aria-hidden="true">→</span>
		</a>
	{/if}

	{#each pantryHealthRows as insight (insight.id)}
		<a class="household-row" href={insight.href}>
			<span>{pantryHealthMessage(insight)}</span>
			<span class="arrow" aria-hidden="true">→</span>
		</a>
	{/each}

	{#if showCalm}
		<p class="household-calm" role="status">{t('home.pantryStatusAllGood')}</p>
	{/if}
</div>

<style>
	.household-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.household-block--eat-first :global(.eat-first) {
		margin: 0;
	}

	.household-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-height: var(--touch-target-min);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: inherit;
		text-decoration: none;
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.household-row:hover span:first-child {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.arrow {
		flex-shrink: 0;
		color: var(--color-text-muted);
	}

	.household-calm {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}
</style>
