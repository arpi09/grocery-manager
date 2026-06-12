<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Card from '$lib/components/atoms/Card.svelte';
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import ProUpgradeCta from '$lib/components/molecules/ProUpgradeCta.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import EatFirstSection from '$lib/components/organisms/EatFirstSection.svelte';
	import ReceiptAutopilotSection from '$lib/components/organisms/ReceiptAutopilotSection.svelte';
	import EngagementStrip from '$lib/components/molecules/EngagementStrip.svelte';
	import WeeklyRitualHero from '$lib/components/molecules/WeeklyRitualHero.svelte';
	import HomeNextAction from '$lib/components/molecules/HomeNextAction.svelte';
	import MealTimeSuggestions from '$lib/components/organisms/MealTimeSuggestions.svelte';
	import HomeQuickAdd from '$lib/components/molecules/HomeQuickAdd.svelte';
	import HouseholdActivityFeed from '$lib/components/molecules/HouseholdActivityFeed.svelte';
	import PantryHealthInsights from '$lib/components/molecules/PantryHealthInsights.svelte';
	import WastePreventionBanner from '$lib/components/molecules/WastePreventionBanner.svelte';
	import HouseholdBriefing from '$lib/components/organisms/HouseholdBriefing.svelte';
	import { composeHouseholdBriefing } from '$lib/domain/household-briefing';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import type { DuplicateNameGroupSummary } from '$lib/application/inventory.service';
	import type { HouseholdActivityEvent } from '$lib/domain/household-activity';
	import SkafferapportWidget from '$lib/components/molecules/SkafferapportWidget.svelte';
	import WrappedBanner from '$lib/components/molecules/WrappedBanner.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { EngagementStrip as EngagementStripData } from '$lib/application/gamification.service';
	import type { SavingsReport } from '$lib/domain/savings-estimate';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import {
		STREAK_MILESTONE_WEEKS,
		ZERO_WASTE_STREAK_CELEBRATION,
		type GamificationCelebrationKind
	} from '$lib/domain/gamification';
	import { getCelebrationRegistryEntry } from '$lib/domain/gamification.registry';
	import { getCurrentMealSlot, getTimeOfDay, timeOfDayGreetingKey } from '$lib/domain/meal-slot';
	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';
	import { t, type MessageKey } from '$lib/i18n';
	import { presentCelebration } from '$lib/utils/present-celebration.svelte';
	import {
		ONBOARDING_PROGRESS_EVENT,
		getActivationProgress,
		type ActivationProgress
	} from '$lib/utils/onboarding';
	import type { ReceiptFinishSuggestion, ReceiptPatternSuggestion } from '$lib/domain/purchase-pattern';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import { recordPeakInventoryCount } from '$lib/utils/household-invite-prompt';
	import { shouldNudgeReceiptAutopilot } from '$lib/utils/receipt-autopilot-nudge';
	import { isReceiptImportRecentlyCompleted } from '$lib/utils/receipt-import-session';

	interface Props {
		summary: DashboardSummary;
		engagement: EngagementStripData;
		savings: SavingsReport;
		showWeeklyRitual?: boolean;
		celebration?: GamificationCelebrationKind | null;
		canWrite?: boolean;
		displayName?: string | null;
		householdId?: string | null;
		receiptAutopilotSuggestions?: ReceiptPatternSuggestion[];
		receiptFinishSuggestions?: ReceiptFinishSuggestion[];
		recentItemNames?: string[];
		duplicateGroups?: DuplicateNameGroupSummary[];
		intelligence?: HomeIntelligenceSnapshot;
		activityEvents?: HouseholdActivityEvent[];
		lastUpdatedByDisplayName?: string | null;
		shoppingListCount?: number;
	}

	let {
		summary,
		engagement,
		savings,
		showWeeklyRitual = false,
		celebration = null,
		canWrite = false,
		displayName = null,
		householdId = null,
		receiptAutopilotSuggestions = [],
		receiptFinishSuggestions = [],
		recentItemNames = [],
		duplicateGroups = [],
		intelligence = { replenishment: [], pantryHealth: [], waste: null, dedupeByKey: {} },
		activityEvents = [],
		lastUpdatedByDisplayName = null,
		shoppingListCount = 0
	}: Props = $props();

	const returnTo = APP_HOME_PATH;
	const scanPhotoHref = $derived(scanModeHref('photo', returnTo));
	const scanBarcodeHref = $derived(scanModeHref('barcode', returnTo));
	const userId = $derived(page.data.user?.id ?? null);
	const isPro = $derived(Boolean(page.data.isPro));

	let activationProgress = $state<ActivationProgress>(getActivationProgress(null));

	function refreshActivationProgress() {
		if (!browser) {
			return;
		}
		activationProgress = getActivationProgress(userId);
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void userId;
		refreshActivationProgress();

		const onProgress = () => refreshActivationProgress();
		window.addEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
		return () => window.removeEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
	});

	const greetingKey = $derived(timeOfDayGreetingKey(getTimeOfDay()));

	const greeting = $derived(
		displayName?.trim()
			? t(greetingKey, { name: displayName.trim() })
			: t('home.greetingNeutral')
	);

	const tagline = $derived(
		summary.totalItems === 0 ? t('home.taglineEmpty') : t('home.taglineEngaged')
	);

	const hasExpiring = $derived(summary.expiringSoon.length > 0);
	const expiringCount = $derived(summary.expiringSoon.length);
	const pantryStatus = $derived(summary.pantryStatus);

	function daysSinceDate(date: Date | string): number {
		const parsed = typeof date === 'string' ? new Date(date) : date;
		const today = new Date();
		const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const then = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
		return Math.round((start.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
	}

	const lastUpdatedLabel = $derived.by(() => {
		const updatedAt = pantryStatus.lastUpdatedAt;
		if (!updatedAt) return null;
		const days = daysSinceDate(updatedAt);
		if (days <= 0) return t('home.pantryStatusLastUpdatedToday');
		if (days === 1) return t('home.pantryStatusLastUpdatedYesterday');
		return t('home.pantryStatusLastUpdatedDays', { count: days });
	});

	type PantryStatusLine = { href: string; label: string };

	const pantryStatusLines = $derived.by((): PantryStatusLine[] => {
		const lines: PantryStatusLine[] = [];
		if (pantryStatus.staleCount > 0) {
			lines.push({
				href: '/inventory/synk',
				label: t('home.pantryStatusStale', { count: pantryStatus.staleCount })
			});
		}
		if (pantryStatus.withoutExpiryCount > 0) {
			lines.push({
				href: '/inventory/fridge?filter=noExpiry',
				label: t('home.pantryStatusWithoutExpiry', { count: pantryStatus.withoutExpiryCount })
			});
		}
		if (pantryStatus.autoExpiredCount > 0) {
			lines.push({
				href: '/inventory/fridge?autoExpired=1',
				label: t('home.pantryStatusAutoExpired', { count: pantryStatus.autoExpiredCount })
			});
		}
		if (lastUpdatedLabel) {
			const label = lastUpdatedByDisplayName
				? t('home.pantryStatusLastUpdatedBy', {
						label: lastUpdatedLabel,
						name: lastUpdatedByDisplayName
					})
				: lastUpdatedLabel;
			lines.push({
				href: '/inventory/fridge',
				label
			});
		}
		return lines;
	});

	const showPantryStatusCard = $derived(
		summary.totalItems > 0 &&
			(pantryStatus.staleCount > 0 ||
				pantryStatus.withoutExpiryCount > 0 ||
				pantryStatus.autoExpiredCount > 0)
	);

	const pantryStatusOnlyLines = $derived.by((): PantryStatusLine[] => {
		return pantryStatusLines.filter((line) => {
			if (lastUpdatedLabel && line.label === lastUpdatedLabel) return false;
			if (
				lastUpdatedLabel &&
				lastUpdatedByDisplayName &&
				line.label ===
					t('home.pantryStatusLastUpdatedBy', {
						label: lastUpdatedLabel,
						name: lastUpdatedByDisplayName
					})
			) {
				return false;
			}
			return true;
		});
	});

	const pantryAllGood = $derived(
		pantryStatus.staleCount === 0 &&
			pantryStatus.withoutExpiryCount === 0 &&
			pantryStatus.autoExpiredCount === 0
	);

	const householdBriefing = $derived(
		composeHouseholdBriefing({
			intelligence,
			staleCount: pantryStatus.staleCount,
			shoppingListCount
		})
	);

	const showHouseholdBriefing = $derived(
		summary.totalItems > 0 && householdBriefing.hasActionableContent
	);

	const replenishmentKeys = $derived(new Set(intelligence.replenishment.map((entry) => entry.normalizedKey)));

	const filteredAutopilotSuggestions = $derived(
		receiptAutopilotSuggestions.filter((entry) => !replenishmentKeys.has(entry.normalizedKey))
	);

	const finishSuggestionsForMore = $derived(
		browser && isReceiptImportRecentlyCompleted() ? [] : receiptFinishSuggestions
	);

	const showWeeklyRitualHero = $derived(
		showWeeklyRitual && !householdBriefing.hideWeeklyRitualSync
	);

	const showMealTimeSuggestions = $derived.by(() => {
		if (summary.totalItems === 0 || showWeeklyRitual || hasExpiring) {
			return false;
		}
		const slot = getCurrentMealSlot();
		return slot === 'breakfast' || slot === 'lunch' || slot === 'dinner';
	});

	let moreOnHomeOpen = $state(false);
	let locationsOpen = $state(false);
	let eatFirstOpen = $state(true);
	let receiptAutopilotOpen = $state(false);
	const nudgeReceiptAutopilot = $derived(
		browser && userId ? shouldNudgeReceiptAutopilot(userId) : false
	);

	$effect(() => {
		if (!browser || !userId) {
			return;
		}
		recordPeakInventoryCount(summary.totalItems, userId);
	});

	$effect(() => {
		if (!browser) {
			return;
		}
		eatFirstOpen = hasExpiring;
		if (
			nudgeReceiptAutopilot &&
			(filteredAutopilotSuggestions.length > 0 || finishSuggestionsForMore.length > 0)
		) {
			receiptAutopilotOpen = true;
		}
		const mq = window.matchMedia('(min-width: 560px)');
		const syncLocations = () => {
			locationsOpen = mq.matches;
		};
		syncLocations();
		mq.addEventListener('change', syncLocations);
		return () => mq.removeEventListener('change', syncLocations);
	});

	const emptyPrimaryHref = $derived(
		activationProgress.path === 'receipt'
			? scanModeHref('receipt', returnTo)
			: scanPhotoHref
	);

	const emptyPrimaryLabel = $derived(
		activationProgress.path === 'receipt'
			? t('home.emptyActionReceipt')
			: t('home.chipPhotoRound')
	);

	const emptySecondaryHref = $derived(
		activationProgress.path === 'receipt' ? scanBarcodeHref : scanModeHref('receipt', returnTo)
	);

	const emptySecondaryLabel = $derived(
		activationProgress.path === 'receipt' ? t('home.emptyActionBarcode') : t('home.emptyActionReceipt')
	);

	const locationIcons: Record<StorageLocation, FeatureIconId> = {
		fridge: 'fridge',
		freezer: 'freezer',
		cupboard: 'cupboard'
	};

	function locationShortLabel(location: StorageLocation): string {
		return t(`location.${location}Short` as MessageKey);
	}

	$effect(() => {
		if (!browser || !celebration || !householdId) {
			return;
		}

		const entry = getCelebrationRegistryEntry(celebration);
		const metadata =
			celebration === 'zeroWasteStreak'
				? { count: ZERO_WASTE_STREAK_CELEBRATION, weeks: ZERO_WASTE_STREAK_CELEBRATION }
				: celebration === 'streak5'
					? { count: STREAK_MILESTONE_WEEKS, weeks: STREAK_MILESTONE_WEEKS }
					: undefined;

		presentCelebration({
			kind: celebration,
			surface: entry?.defaultSurface ?? 'moment',
			householdId,
			userId,
			metadata
		});
	});
</script>

<section class="home" aria-label={t('home.ariaLabel')}>
	<header class="hero" class:hero--engaged={summary.totalItems > 0}>
		<h1>{greeting}</h1>
		<p class="tagline">{tagline}</p>
	</header>

	{#if summary.totalItems === 0}
		{#if canWrite}
			<EmptyState
				iconId={activationProgress.path === 'receipt' ? 'receipt' : 'photo'}
				title={t('home.emptyTitle')}
				description={t('home.emptyDescription')}
				actionLabel={emptyPrimaryLabel}
				actionHref={emptyPrimaryHref}
				primaryAnalyticsId="home.empty_primary"
				secondaryActionLabel={emptySecondaryLabel}
				secondaryActionHref={emptySecondaryHref}
				secondaryAnalyticsId="home.empty_secondary"
			/>
			{#if activationProgress.inProgress && activationProgress.path === 'barcode' && activationProgress.barcodeCount > 0}
				<p class="activation-progress" role="status">
					{t('onboarding.barcodeProgress', {
						count: activationProgress.barcodeCount,
						goal: activationProgress.barcodeGoal
					})}
				</p>
			{/if}
		{:else}
			<Card>
				<p class="readonly-empty">{t('home.readonlyEmpty')}</p>
			</Card>
		{/if}
	{:else}
		<HouseholdBriefing
			{intelligence}
			staleCount={pantryStatus.staleCount}
			{shoppingListCount}
			{canWrite}
			{householdId}
			finishSuggestions={receiptFinishSuggestions}
		/>

		{#if showWeeklyRitualHero || showPantryStatusCard}
			<WeeklyRitualHero
				statusOnly
				expiringCount={expiringCount}
				staleCount={pantryStatus.staleCount}
				syncHealth={pantryStatus.syncHealth}
				pantryStatusLines={pantryStatusOnlyLines}
				allGood={pantryAllGood && !hasExpiring && pantryStatus.staleCount === 0}
			/>
		{/if}

		{#if !showHouseholdBriefing}
			<HomeNextAction
				totalItems={summary.totalItems}
				{expiringCount}
				staleCount={pantryStatus.staleCount}
				{canWrite}
				{returnTo}
			/>

			<a class="shopping-teaser" href="/inkop" data-analytics-id="home.shopping_teaser">
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

		{#if !canWrite}
			<p class="readonly-hint">{t('home.readonlyHint')}</p>
		{/if}

		{#if !showHouseholdBriefing && intelligence.pantryHealth.length > 0}
			<PantryHealthInsights insights={intelligence.pantryHealth} />
		{/if}

		{#if hasExpiring}
			{#if !showHouseholdBriefing && intelligence.waste}
				<WastePreventionBanner alert={intelligence.waste} />
			{/if}
			<details class="home-disclosure eat-first-prominent" bind:open={eatFirstOpen}>
				<summary>
					{t('home.eatFirstSummary', { count: expiringCount })}
				</summary>
				<EatFirstSection
					compact
					expiringItems={summary.expiringSoon}
					canEdit={canWrite}
					householdId={householdId}
				/>
			</details>
		{/if}

		<details class="home-disclosure more-on-home" bind:open={moreOnHomeOpen}>
			<summary>{t('home.moreOnHome')}</summary>
			<div class="more-on-home-body">
				{#if !isPro}
					<ProUpgradeCta variant="card" />
				{/if}

				{#if canWrite}
					<div class="quick-add-secondary">
						<HomeQuickAdd recentNames={recentItemNames} />
					</div>
				{/if}

				{#if showMealTimeSuggestions}
					<MealTimeSuggestions hasInventory={summary.totalItems > 0} />
				{/if}

				{#if canWrite && duplicateGroups.length > 0 && intelligence.pantryHealth.length === 0 && !showHouseholdBriefing}
					<section class="duplicate-nudge" aria-labelledby="home-duplicate-heading">
						<h2 id="home-duplicate-heading" class="sr-only">{t('home.duplicateWarningTitle')}</h2>
						{#each duplicateGroups.slice(0, 2) as group (group.location + group.displayName)}
							<p class="duplicate-copy">
								{t('home.duplicateWarning', { count: group.count, name: group.displayName })}
								<a href="/inventory/{group.location}">{t('home.duplicateWarningInventory')}</a>
								·
								<a href="/inventory/merge">{t('home.duplicateWarningMerge')}</a>
							</p>
						{/each}
					</section>
				{/if}

				<WrappedBanner />
				<EngagementStrip {engagement} />
				<HouseholdActivityFeed events={activityEvents} />

				{#if savings.hasData}
					<SkafferapportWidget {savings} />
				{/if}

				{#if !hasExpiring && !showWeeklyRitual}
					<details class="home-disclosure nested" bind:open={eatFirstOpen}>
						<summary>
							{t('eatFirst.title')}
						</summary>
						<EatFirstSection
							compact
							expiringItems={summary.expiringSoon}
							canEdit={canWrite}
							householdId={householdId}
						/>
					</details>
				{/if}

				<details class="home-disclosure nested" bind:open={locationsOpen}>
					<summary>
						{t('home.locationsSummary', { count: summary.totalItems })}
					</summary>
					<div class="locations">
						{#each summary.counts as { location, count }}
							<Card href="/inventory/{location}" interactive class="location-card">
								<span
									class="location-icon"
									style="color: {LOCATION_COLORS[location]}"
									aria-hidden="true"
								>
									<FeatureIcon id={locationIcons[location]} size={22} />
								</span>
								<span class="location-name">{locationShortLabel(location)}</span>
								<span class="location-count">{count}</span>
							</Card>
						{/each}
					</div>
				</details>

				{#if canWrite && (filteredAutopilotSuggestions.length > 0 || finishSuggestionsForMore.length > 0)}
					{#if nudgeReceiptAutopilot && filteredAutopilotSuggestions.length > 0}
						<section class="autopilot-nudge" aria-labelledby="home-autopilot-nudge-heading">
							<h2 id="home-autopilot-nudge-heading" class="autopilot-nudge-title">
								{t('receiptAutopilot.nudgeTitle')}
							</h2>
							<p class="autopilot-nudge-lead">{t('receiptAutopilot.nudgeLead')}</p>
							<ReceiptAutopilotSection
								suggestions={filteredAutopilotSuggestions}
								finishSuggestions={finishSuggestionsForMore}
								canEdit={canWrite}
								compact
							/>
						</section>
					{:else if filteredAutopilotSuggestions.length > 0 || finishSuggestionsForMore.length > 0}
						<details class="home-disclosure nested" bind:open={receiptAutopilotOpen}>
							<summary>
								{t('home.receiptAutopilotSummary', {
									count: filteredAutopilotSuggestions.length + finishSuggestionsForMore.length
								})}
							</summary>
							<ReceiptAutopilotSection
								suggestions={filteredAutopilotSuggestions}
								finishSuggestions={finishSuggestionsForMore}
								canEdit={canWrite}
								compact
							/>
						</details>
					{:else if finishSuggestionsForMore.length > 0}
						<details class="home-disclosure nested" bind:open={receiptAutopilotOpen}>
							<summary>
								{t('home.receiptAutopilotSummary', { count: finishSuggestionsForMore.length })}
							</summary>
							<ReceiptAutopilotSection
								suggestions={[]}
								finishSuggestions={finishSuggestionsForMore}
								canEdit={canWrite}
								compact
							/>
						</details>
					{/if}
				{/if}
			</div>
		</details>
	{/if}
</section>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding-top: var(--space-xs);
	}

	@media (min-width: 560px) {
		.home {
			gap: var(--page-section-gap);
		}
	}

	.hero h1 {
		margin: 0;
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.tagline {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.45;
		max-width: 42ch;
	}

	@media (max-width: 559px) {
		.hero--engaged .tagline {
			display: none;
		}

		.hero--engaged h1 {
			font-size: 1.35rem;
		}
	}

	.home-disclosure {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.home-disclosure > summary {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: var(--space-md) var(--space-lg);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
		list-style: none;
	}

	.home-disclosure > summary::-webkit-details-marker {
		display: none;
	}

	.home-disclosure > summary::after {
		content: '▾';
		margin-left: auto;
		color: var(--color-text-muted);
		transition: transform 0.15s;
	}

	.home-disclosure[open] > summary::after {
		transform: rotate(180deg);
	}

	.home-disclosure > :global(.eat-first),
	.home-disclosure > .locations,
	.home-disclosure > :global(.autopilot) {
		padding: var(--space-md) var(--space-lg) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.activation-progress {
		margin: calc(-1 * var(--space-md)) 0 0;
		text-align: center;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.quick-add-secondary {
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
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
		box-shadow: var(--shadow-sm);
		text-decoration: none;
		color: inherit;
	}

	.shopping-teaser:hover {
		text-decoration: none;
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
	}

	.shopping-teaser-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.shopping-teaser-copy {
		flex: 1;
		min-width: 0;
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.shopping-teaser-arrow {
		flex-shrink: 0;
		color: var(--color-primary);
		font-weight: 600;
	}

	.quick-add-secondary :global(.barcode-link) {
		font-size: 0.8125rem;
	}

	.shopping-teaser-icon :global(.nav-icon) {
		width: 1.375rem;
		height: 1.375rem;
	}

	.readonly-hint,
	.readonly-empty {
		margin: 0;
		padding: var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.location-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.locations {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-sm);
	}

	:global(.location-card) {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		min-height: var(--touch-target-min);
		padding: var(--space-md) var(--space-sm) !important;
		text-align: center;
	}

	.location-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.location-count {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.autopilot-nudge {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
		box-shadow: var(--shadow-sm);
	}

	.autopilot-nudge-title {
		margin: 0 0 var(--space-xs);
		font-size: 1.05rem;
		letter-spacing: -0.02em;
	}

	.autopilot-nudge-lead {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.more-on-home-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.home-disclosure.nested {
		box-shadow: none;
		border-radius: var(--radius-sm);
	}

	.duplicate-nudge {
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-warning) 8%, var(--color-surface));
	}

	.duplicate-copy {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.duplicate-copy a {
		font-weight: 700;
		color: var(--color-primary);
	}

	@media (min-width: 560px) {
		.locations {
			gap: var(--space-md);
		}

		:global(.location-card) {
			padding: var(--space-lg) var(--space-md) !important;
		}

		.location-count {
			font-size: 1.5rem;
		}
	}
</style>
