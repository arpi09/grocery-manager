<script lang="ts">
	import { browser } from '$app/environment';
	import Card from '$lib/components/atoms/Card.svelte';
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import ReplenishmentSection from '$lib/components/organisms/ReplenishmentSection.svelte';
	import ReceiptAutopilotSection from '$lib/components/organisms/ReceiptAutopilotSection.svelte';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import type { ReceiptFinishSuggestion } from '$lib/domain/purchase-pattern';
	import {
		briefingVisiblePantryHealth,
		composeHouseholdBriefing
	} from '$lib/domain/household-briefing';
	import type { PantryHealthInsight } from '$lib/domain/pantry-health';
	import { trackProductEvent } from '$lib/client/product-events';
	import {
		clearReceiptImportCompleted,
		isReceiptImportRecentlyCompleted,
		readReceiptImportCompleted
	} from '$lib/utils/receipt-import-session';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	interface Props {
		intelligence: HomeIntelligenceSnapshot;
		staleCount: number;
		shoppingListCount: number;
		canWrite?: boolean;
		householdId?: string | null;
		finishSuggestions?: ReceiptFinishSuggestion[];
	}

	let {
		intelligence,
		staleCount,
		shoppingListCount,
		canWrite = false,
		householdId = null,
		finishSuggestions = []
	}: Props = $props();

	const briefing = $derived(
		composeHouseholdBriefing({ intelligence, staleCount, shoppingListCount })
	);
	const visiblePantryHealth = $derived(briefingVisiblePantryHealth(briefing));
	const showPostImportFinish = $derived(browser && isReceiptImportRecentlyCompleted());
	const postImportFinish = $derived(showPostImportFinish ? finishSuggestions : []);

	let briefingViewTracked = $state(false);
	let receiptLoopCtaTracked = $state(false);
	let wasteShownTracked = $state(false);
	let pantryHealthShownTracked = $state(false);

	onMount(() => {
		if (!briefing.hasActionableContent || briefingViewTracked) {
			return;
		}
		briefingViewTracked = true;
		void trackProductEvent('home_briefing_viewed', {
			primaryKind: briefing.primaryKind,
			counts: briefing.counts
		});
	});

	$effect(() => {
		if (
			!browser ||
			receiptLoopCtaTracked ||
			!isReceiptImportRecentlyCompleted() ||
			intelligence.replenishment.length === 0
		) {
			return;
		}
		receiptLoopCtaTracked = true;
		const flag = readReceiptImportCompleted();
		void trackProductEvent('receipt_loop_cta_shown', {
			itemsAdded: flag?.itemsAdded ?? 0,
			replenishmentCount: intelligence.replenishment.length
		});
	});

	$effect(() => {
		const waste = briefing.waste;
		if (!browser || wasteShownTracked || !briefing.hasActionableContent || !waste) {
			return;
		}
		wasteShownTracked = true;
		void trackProductEvent('waste_alert_shown', {
			expiringCount: waste.expiringCount,
			slowMoverCount: waste.slowMoverCount,
			source: 'briefing'
		});
	});

	$effect(() => {
		const insights = visiblePantryHealth;
		if (
			!browser ||
			pantryHealthShownTracked ||
			!briefing.hasActionableContent ||
			insights.length === 0
		) {
			return;
		}
		pantryHealthShownTracked = true;
		void trackProductEvent('pantry_health_insight_shown', {
			count: insights.length,
			kinds: insights.map((entry) => entry.kind),
			source: 'briefing'
		});
	});

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

	function trackPantryHealthClick(entry: PantryHealthInsight) {
		void trackProductEvent('pantry_health_insight_clicked', {
			kind: entry.kind,
			count: entry.count,
			source: 'briefing'
		});
	}

	function handleWasteClick() {
		if (!briefing.waste) {
			return;
		}
		void trackProductEvent('waste_alert_clicked', {
			expiringCount: briefing.waste.expiringCount,
			slowMoverCount: briefing.waste.slowMoverCount,
			source: 'briefing'
		});
		void trackProductEvent('waste_alert_actioned', {
			expiringCount: briefing.waste.expiringCount,
			slowMoverCount: briefing.waste.slowMoverCount,
			source: 'briefing'
		});
	}

	function handleReceiptLoopClick() {
		void trackProductEvent('receipt_loop_cta_clicked', {
			replenishmentCount: intelligence.replenishment.length
		});
		clearReceiptImportCompleted();
	}
</script>

{#if briefing.hasActionableContent}
	<section class="household-briefing" aria-label={t('householdBriefing.ariaLabel')}>
		<header class="briefing-header">
			<h2>{t('householdBriefing.title')}</h2>
		</header>

		{#if showPostImportFinish && postImportFinish.length > 0}
			<div class="finish-block">
				<p class="finish-lead">{t('householdBriefing.finishLead')}</p>
				<ReceiptAutopilotSection
					suggestions={[]}
					finishSuggestions={postImportFinish}
					canEdit={canWrite}
					compact
				/>
			</div>
		{/if}

		{#if isReceiptImportRecentlyCompleted() && intelligence.replenishment.length > 0}
			<Card class="receipt-loop-cta">
				<p class="receipt-loop-copy">
					{t('householdBriefing.receiptLoopCopy', {
						count: readReceiptImportCompleted()?.itemsAdded ?? 0
					})}
				</p>
				<a href="/inkop" class="receipt-loop-link" onclick={handleReceiptLoopClick}>
					{t('householdBriefing.receiptLoopCta')}
				</a>
			</Card>
		{/if}

		{#if briefing.waste}
			<Card class="waste-primary">
				<p class="waste-copy">
					{#if briefing.waste.slowMoverCount > 0}
						{t('wastePrevention.slowMoverCopy', {
							expiringCount: briefing.waste.expiringCount,
							slowMoverCount: briefing.waste.slowMoverCount
						})}
					{:else}
						{t('wastePrevention.copy', { count: briefing.waste.expiringCount })}
					{/if}
				</p>
				<a href={briefing.waste.href} class="waste-action" onclick={handleWasteClick}>
					{t('wastePrevention.action')}
				</a>
			</Card>
		{/if}

		{#if briefing.replenishment.length > 0}
			<ReplenishmentSection
				suggestions={briefing.replenishment}
				dedupeByKey={intelligence.dedupeByKey}
				canEdit={canWrite}
				{householdId}
				compact
				surface="hem"
			/>
		{/if}

		{#if visiblePantryHealth.length > 0}
			<ul class="health-lines">
				{#each visiblePantryHealth as insight (insight.id)}
					<li>
						<a href={insight.href} class="health-link" onclick={() => trackPantryHealthClick(insight)}>
							<span>{pantryHealthMessage(insight)}</span>
							<span class="arrow" aria-hidden="true">→</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		{#if briefing.showSync}
			<a class="sync-link" href="/inventory/synk" data-analytics-id="home.briefing_sync">
				{t('home.nextActionSync', { count: briefing.staleCount })}
			</a>
		{/if}

		{#if briefing.showShoppingTeaser}
			<a class="shopping-teaser" href="/inkop" data-analytics-id="home.briefing_shopping_teaser">
				<span class="shopping-teaser-icon" aria-hidden="true">
					<NavIcon id="shopping" />
				</span>
				<span class="shopping-teaser-copy">
					{shoppingListCount > 0
						? t('home.shoppingTeaser', { count: shoppingListCount })
						: t('home.shoppingTeaserEmpty')}
				</span>
				<span class="shopping-teaser-arrow" aria-hidden="true">→</span>
			</a>
		{/if}
	</section>
{/if}

<style>
	.household-briefing {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
		box-shadow: var(--shadow-sm);
	}

	.briefing-header h2 {
		margin: 0;
		font-size: 1.05rem;
		letter-spacing: -0.02em;
	}

	.finish-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.finish-lead {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	:global(.receipt-loop-cta) {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.receipt-loop-copy {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.receipt-loop-link {
		align-self: flex-start;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
	}

	:global(.waste-primary) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm) var(--space-md);
	}

	.waste-copy {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.45;
		flex: 1 1 12rem;
	}

	.waste-action {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
	}

	.health-lines {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.health-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-height: 2.75rem;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: inherit;
		text-decoration: none;
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.health-link:hover span:first-child {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.arrow {
		color: var(--color-text-muted);
	}

	.sync-link {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		text-decoration: none;
	}

	.shopping-teaser {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		min-height: var(--touch-target-min);
		padding: var(--space-md) var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		text-decoration: none;
		color: inherit;
	}

	.shopping-teaser-copy {
		flex: 1;
		min-width: 0;
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.shopping-teaser-icon {
		display: flex;
		color: var(--color-primary);
	}

	.shopping-teaser-arrow {
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
