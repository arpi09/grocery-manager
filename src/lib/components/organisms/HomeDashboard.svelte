<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Card from '$lib/components/atoms/Card.svelte';
	import ProUpgradeCta from '$lib/components/molecules/ProUpgradeCta.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import EatFirstSection from '$lib/components/organisms/EatFirstSection.svelte';
	import ReceiptAutopilotSection from '$lib/components/organisms/ReceiptAutopilotSection.svelte';
	import EngagementStrip from '$lib/components/molecules/EngagementStrip.svelte';
	import WeeklyRitualHero from '$lib/components/molecules/WeeklyRitualHero.svelte';
	import HomeQuickAdd from '$lib/components/molecules/HomeQuickAdd.svelte';
	import HouseholdActivityFeed from '$lib/components/molecules/HouseholdActivityFeed.svelte';
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
	import { getTimeOfDay, timeOfDayGreetingKey } from '$lib/domain/meal-slot';
	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';
	import { t, type MessageKey } from '$lib/i18n';
	import { presentCelebration } from '$lib/utils/present-celebration.svelte';
	import {
		ONBOARDING_PROGRESS_EVENT,
		getActivationProgress,
		type ActivationProgress
	} from '$lib/utils/onboarding';
	import type { ReceiptFinishSuggestion, ReceiptPatternSuggestion } from '$lib/domain/purchase-pattern';
	import { scanHubHref, scanModeHref } from '$lib/utils/scan-nav';
	import { recordPeakInventoryCount } from '$lib/utils/household-invite-prompt';
	import { shouldNudgeReceiptAutopilot } from '$lib/utils/receipt-autopilot-nudge';

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
		activityEvents?: HouseholdActivityEvent[];
		lastUpdatedByDisplayName?: string | null;
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
		activityEvents = [],
		lastUpdatedByDisplayName = null
	}: Props = $props();

	const returnTo = APP_HOME_PATH;
	const scanPhotoHref = $derived(scanModeHref('photo', returnTo));
	const scanBarcodeHref = $derived(scanModeHref('barcode', returnTo));
	const scanHubLinkHref = $derived(scanHubHref(returnTo));
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

	const showPantryStatusCard = $derived(summary.totalItems > 0);

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
			(receiptAutopilotSuggestions.length > 0 || receiptFinishSuggestions.length > 0)
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

	{#if !isPro && summary.totalItems > 0}
		<ProUpgradeCta variant="card" />
	{/if}

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
		{#if showWeeklyRitual}
			<WeeklyRitualHero
				expiringCount={expiringCount}
				staleCount={pantryStatus.staleCount}
				photoHref={scanPhotoHref}
				hub={true}
			/>
		{/if}

		{#if canWrite}
			{#if !showWeeklyRitual}
				<section class="scan-zone" aria-labelledby="home-scan-heading">
					<h2 id="home-scan-heading" class="sr-only">{t('home.scanCardTitle')}</h2>
					<a class="scan-card" href={scanPhotoHref} data-analytics-id="home.scan_photo">
						<span class="scan-icon" aria-hidden="true">
							<FeatureIcon id="photo" size={22} />
						</span>
						<div class="scan-copy">
							<span class="scan-title">{t('photoRound.title')}</span>
							<span class="scan-subtitle">{t('scan.modeTiles.photoRound.description')}</span>
						</div>
						<span class="scan-arrow" aria-hidden="true">→</span>
					</a>
					<p class="scan-alt">
						<a href={scanHubLinkHref} data-analytics-id="home.scan_hub">{t('home.moreAddWays')}</a>
					</p>
				</section>
			{/if}

			<div class="quick-add-secondary">
				<HomeQuickAdd recentNames={recentItemNames} />
			</div>

			{#if duplicateGroups.length > 0}
				<section class="duplicate-nudge" aria-labelledby="home-duplicate-heading">
					<h2 id="home-duplicate-heading" class="sr-only">{t('home.duplicateWarningTitle')}</h2>
					{#each duplicateGroups.slice(0, 2) as group (group.location + group.displayName)}
						<p class="duplicate-copy">
							{t('home.duplicateWarning', { count: group.count, name: group.displayName })}
							<a href="/inventory/{group.location}">{t('home.duplicateWarningInventory')}</a>
							·
							<a href="/inventory/synk">{t('home.duplicateWarningMerge')}</a>
						</p>
					{/each}
				</section>
			{/if}
			<p class="merge-link"><a href="/inventory/merge">{t('home.mergeDuplicatesLink')}</a></p>
		{:else}
			<p class="readonly-hint">{t('home.readonlyHint')}</p>
		{/if}

		<WrappedBanner />

		{#if showPantryStatusCard}
			<section class="pantry-status" aria-labelledby="home-pantry-status-heading">
				<h2 id="home-pantry-status-heading" class="pantry-status-title">
					{t('home.pantryStatusTitle')}
					<span class="sync-health-badge" data-level={pantryStatus.syncHealth}>
						{t(`home.syncHealth.${pantryStatus.syncHealth}` as MessageKey)}
					</span>
				</h2>
				{#if pantryStatus.staleCount === 0 && pantryStatus.withoutExpiryCount === 0 && pantryStatus.autoExpiredCount === 0 && pantryStatusLines.length === 1 && lastUpdatedLabel}
					<p class="pantry-status-good">{t('home.pantryStatusAllGood')}</p>
					<p class="pantry-status-meta">
						<a href="/inventory/fridge">{lastUpdatedLabel}</a>
					</p>
				{:else if pantryStatusLines.length > 0}
					<ul class="pantry-status-list">
						{#each pantryStatusLines as line (line.href + line.label)}
							<li>
								<a href={line.href}>{line.label}</a>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}

		<EngagementStrip {engagement} />
		<HouseholdActivityFeed events={activityEvents} />

		{#if savings.hasData}
			<SkafferapportWidget {savings} />
		{/if}

		{#if !showWeeklyRitual}
			<details class="home-disclosure" bind:open={eatFirstOpen}>
				<summary>
					{#if hasExpiring}
						{t('home.eatFirstSummary', { count: expiringCount })}
					{:else}
						{t('eatFirst.title')}
					{/if}
				</summary>
				<EatFirstSection
					compact
					expiringItems={summary.expiringSoon}
					canEdit={canWrite}
					householdId={householdId}
				/>
			</details>
		{/if}

		<details class="home-disclosure" bind:open={locationsOpen}>
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

		{#if canWrite && (receiptAutopilotSuggestions.length > 0 || receiptFinishSuggestions.length > 0)}
			{#if nudgeReceiptAutopilot}
				<section class="autopilot-nudge" aria-labelledby="home-autopilot-nudge-heading">
					<h2 id="home-autopilot-nudge-heading" class="autopilot-nudge-title">
						{t('receiptAutopilot.nudgeTitle')}
					</h2>
					<p class="autopilot-nudge-lead">{t('receiptAutopilot.nudgeLead')}</p>
					<ReceiptAutopilotSection
						suggestions={receiptAutopilotSuggestions}
						finishSuggestions={receiptFinishSuggestions}
						canEdit={canWrite}
						compact
					/>
				</section>
			{:else}
				<details class="home-disclosure" bind:open={receiptAutopilotOpen}>
					<summary>
						{t('home.receiptAutopilotSummary', {
							count: receiptAutopilotSuggestions.length + receiptFinishSuggestions.length
						})}
					</summary>
					<ReceiptAutopilotSection
						suggestions={receiptAutopilotSuggestions}
						finishSuggestions={receiptFinishSuggestions}
						canEdit={canWrite}
						compact
					/>
				</details>
			{/if}
		{/if}
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

	.quick-add-secondary :global(.barcode-link) {
		font-size: 0.8125rem;
	}

	.scan-zone {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.scan-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		min-height: var(--touch-target-min);
		padding: var(--space-lg);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 14%, var(--color-surface)),
			var(--color-surface)
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
	}

	.scan-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(31, 42, 36, 0.12);
		text-decoration: none;
	}

	.scan-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: var(--color-primary);
		color: #fff;
		border-radius: var(--radius-md);
	}

	.location-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.scan-copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.scan-title {
		font-weight: 700;
		font-size: 1.1rem;
		letter-spacing: -0.02em;
	}

	.scan-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.scan-arrow {
		flex-shrink: 0;
		font-size: 1.25rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.scan-alt {
		margin: 0;
		text-align: center;
		font-size: 0.875rem;
	}

	.scan-alt a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0 var(--space-sm);
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.scan-alt a:hover {
		color: var(--color-primary-hover);
	}

	.readonly-hint,
	.readonly-empty {
		margin: 0;
		padding: var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.5;
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
		gap: var(--space-xs);
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

	.pantry-status {
		padding: var(--space-md) var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.pantry-status-title {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.sync-health-badge {
		font-size: 0.75rem;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.sync-health-badge[data-level='needs_love'] {
		background: color-mix(in srgb, var(--color-warning) 18%, transparent);
	}

	.merge-link {
		margin: 0;
		font-size: 0.875rem;
	}

	.pantry-status-good {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text);
	}

	.pantry-status-meta {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
	}

	.pantry-status-meta a {
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}

	.pantry-status-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.pantry-status-list a {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.4;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}

	.pantry-status-list a:hover {
		color: var(--color-primary-hover);
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
