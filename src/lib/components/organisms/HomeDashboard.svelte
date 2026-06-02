<script lang="ts">
	import { browser } from '$app/environment';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import EngagementStrip from '$lib/components/molecules/EngagementStrip.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import EatFirstSection from '$lib/components/organisms/EatFirstSection.svelte';
	import ExpiringSoonSection from '$lib/components/organisms/ExpiringSoonSection.svelte';
	import MealTimeSuggestions from '$lib/components/organisms/MealTimeSuggestions.svelte';
	import type { EngagementStrip as EngagementStripData } from '$lib/application/gamification.service';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { ZERO_WASTE_STREAK_CELEBRATION, type GamificationCelebrationKind } from '$lib/domain/gamification';
	import { getTimeOfDay, timeOfDayGreetingKey } from '$lib/domain/meal-slot';
	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';
	import { getLocale, t, type MessageKey } from '$lib/i18n';
	import { celebrationMessage } from '$lib/utils/gamification-celebrate';
	import {
		markCelebrationShown,
		shouldShowCelebration
	} from '$lib/utils/gamification-celebrations';
	import {
		ONBOARDING_PROGRESS_EVENT,
		getActivationProgress,
		type ActivationProgress
	} from '$lib/utils/onboarding';

	interface Props {
		summary: DashboardSummary;
		engagement: EngagementStripData;
		celebration?: GamificationCelebrationKind | null;
		canWrite?: boolean;
		displayName?: string | null;
		householdId?: string | null;
	}

	let {
		summary,
		engagement,
		celebration = null,
		canWrite = false,
		displayName = null,
		householdId = null
	}: Props = $props();

	const returnTo = APP_HOME_PATH;
	const from = $derived(encodeURIComponent(returnTo));

	let activationProgress = $state<ActivationProgress>(getActivationProgress());

	function refreshActivationProgress() {
		if (!browser) {
			return;
		}
		activationProgress = getActivationProgress();
	}

	$effect(() => {
		if (!browser) {
			return;
		}

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

	const emptyPrimaryHref = $derived(
		activationProgress.path === 'receipt'
			? `/scan/kvitto?from=${from}`
			: `/scan?mode=barcode&from=${from}`
	);

	const emptyPrimaryLabel = $derived(
		activationProgress.path === 'receipt' ? t('home.emptyActionReceipt') : t('home.emptyActionBarcode')
	);

	const emptySecondaryHref = $derived(
		activationProgress.path === 'receipt'
			? `/scan?mode=barcode&from=${from}`
			: `/scan/kvitto?from=${from}`
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

	let showCelebrationBanner = $state(false);
	let celebrationMessageText = $state('');

	$effect(() => {
		if (!browser || !celebration || !householdId) {
			showCelebrationBanner = false;
			celebrationMessageText = '';
			return;
		}

		if (!shouldShowCelebration(celebration, householdId)) {
			showCelebrationBanner = false;
			celebrationMessageText = '';
			return;
		}

		celebrationMessageText = celebrationMessage(getLocale(), celebration, {
			count: ZERO_WASTE_STREAK_CELEBRATION
		});
		showCelebrationBanner = true;
		markCelebrationShown(celebration, householdId);
	});
</script>

<section class="home" aria-label={t('home.ariaLabel')}>
	<header class="hero">
		<h1>{greeting}</h1>
		<p class="tagline">{tagline}</p>
	</header>

	{#if showCelebrationBanner}
		<FeedbackBanner tone="success" message={celebrationMessageText} />
	{/if}

	{#if summary.totalItems === 0}
		{#if canWrite}
			<EmptyState
				iconId="barcode"
				title={t('home.emptyTitle')}
				description={t('home.emptyDescription')}
				actionLabel={emptyPrimaryLabel}
				actionHref={emptyPrimaryHref}
				secondaryActionLabel={emptySecondaryLabel}
				secondaryActionHref={emptySecondaryHref}
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
		<EngagementStrip {engagement} />

		<EatFirstSection
			expiringItems={summary.expiringSoon}
			canEdit={canWrite}
			householdId={householdId}
		/>

		<MealTimeSuggestions hasInventory={summary.totalItems > 0} />

		{#if canWrite}
			<section class="scan-zone" aria-labelledby="home-scan-heading">
				<h2 id="home-scan-heading" class="sr-only">{t('home.scanCardTitle')}</h2>
				<a class="scan-card" href="/scan?mode=barcode&from={from}">
					<span class="scan-icon" aria-hidden="true">
						<FeatureIcon id="barcode" size={22} />
					</span>
					<div class="scan-copy">
						<span class="scan-title">{t('home.scanCardTitle')}</span>
						<span class="scan-subtitle">{t('home.scanCardSubtitle')}</span>
					</div>
					<span class="scan-arrow" aria-hidden="true">→</span>
				</a>
				<details class="more-ways">
					<summary>{t('home.moreAddWays')}</summary>
					<nav class="more-ways-links" aria-label={t('home.moreAddWays')}>
						<a href="/scan/kvitto?from={from}">{t('home.chipReceipt')}</a>
						<a href="/scan/foto?from={from}">{t('home.chipPhoto')}</a>
						<a href="/item/new?from={from}">{t('home.chipManual')}</a>
					</nav>
				</details>
			</section>
		{:else}
			<p class="readonly-hint">{t('home.readonlyHint')}</p>
		{/if}

		<section class="status-zone" aria-labelledby="home-locations-heading">
			<div class="status-header">
				<h2 id="home-locations-heading">{t('home.locationsTitle')}</h2>
				<span class="total-badge">{t('home.totalTracked', { count: summary.totalItems })}</span>
			</div>
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
		</section>

		{#if summary.expiringSoon.length > 0}
			<div class="expiring-block">
				<ExpiringSoonSection items={summary.expiringSoon} showEmpty={false} />
			</div>
		{/if}
	{/if}
</section>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: var(--page-section-gap);
		padding-top: var(--space-xs);
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
		gap: var(--space-md);
	}

	.scan-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
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

	.more-ways {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.more-ways summary {
		cursor: pointer;
		padding: 0.65rem var(--space-md);
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		list-style: none;
	}

	.more-ways summary::-webkit-details-marker {
		display: none;
	}

	.more-ways[open] summary {
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border);
	}

	.more-ways-links {
		display: flex;
		flex-direction: column;
		padding: var(--space-xs) 0;
	}

	.more-ways-links a {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 var(--space-md);
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-primary);
		text-decoration: none;
	}

	.more-ways-links a:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
	}

	.readonly-hint,
	.readonly-empty {
		margin: 0;
		padding: var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.status-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.status-header h2 {
		margin: 0;
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
	}

	.total-badge {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-muted);
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

	.expiring-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
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
