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
	import type { ReceiptPatternSuggestion } from '$lib/domain/purchase-pattern';
	import { scanHubHref, scanModeHref } from '$lib/utils/scan-nav';

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
		receiptAutopilotSuggestions = []
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

	let locationsOpen = $state(false);
	let eatFirstOpen = $state(true);
	let receiptAutopilotOpen = $state(false);

	$effect(() => {
		if (!browser) {
			return;
		}
		eatFirstOpen = hasExpiring;
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
		{#if canWrite}
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
		{:else}
			<p class="readonly-hint">{t('home.readonlyHint')}</p>
		{/if}

		{#if showWeeklyRitual}
			<WeeklyRitualHero expiringCount={expiringCount} />
		{/if}

		<WrappedBanner />

		<EngagementStrip {engagement} />

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

		{#if canWrite && receiptAutopilotSuggestions.length > 0}
			<details class="home-disclosure" bind:open={receiptAutopilotOpen}>
				<summary>
					{t('home.receiptAutopilotSummary', { count: receiptAutopilotSuggestions.length })}
				</summary>
				<ReceiptAutopilotSection
					suggestions={receiptAutopilotSuggestions}
					canEdit={canWrite}
					compact
				/>
			</details>
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
