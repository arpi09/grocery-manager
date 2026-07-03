<script lang="ts">
	import HomeBriefingChips from '$lib/components/molecules/HomeBriefingChips.svelte';
	import HomeBriefingSuggestionCard from '$lib/components/molecules/HomeBriefingSuggestionCard.svelte';
	import HomeBriefingGreeting from '$lib/components/molecules/HomeBriefingGreeting.svelte';
	import { trackForYouCtaTapped, trackHomeChipTapped, trackMomentCtaTapped } from '$lib/client/home-v2-telemetry';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import {
		buildHomeBriefingChipsPresentation,
		buildHomeBriefingForYouPresentation,
		buildHomeBriefingGreetingPresentation,
		buildHomeBriefingMomentPresentation,
		buildHomeBriefingPulsePresentation,
		buildHomeBriefingStatusPresentation
	} from '$lib/domain/home-briefing-presenter';
	import {
		isShoppingListReady,
		selectHomeBriefingForYouCard,
		selectHomeBriefingMomentCard,
		selectHomeBriefingPulse,
		selectHomeBriefingStatus,
		type HomeBriefingForYouCard,
		type HomeBriefingFunFact,
		type HomeBriefingMomentCard,
		type HomeBriefingMomentKind,
		type HomeBriefingRecipeCard
	} from '$lib/domain/home-briefing';
	import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { getLocale, t } from '$lib/i18n';
	import { PANTRY_SHELF_PATH } from '$lib/navigation/nav-config';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import { isWithinActiveMealSlot } from '$lib/domain/meal-slot';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	
	interface Props {
		summary: DashboardSummary;
		intelligence: HomeIntelligenceSnapshot;
		displayName?: string | null;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
		recipeSuggestion?: HomeBriefingRecipeCard | null;
		briefingRecipeChip?: { id: string; title: string } | null;
		briefingFunFact?: HomeBriefingFunFact | null;
		briefingOneLiner?: string | null;
		canWrite?: boolean;
		pantryUxV2Enabled?: boolean;
		shoppingUxV2Enabled?: boolean;
		acceptingReplenishment?: boolean;
		onAcceptReplenishment?: (card: Extract<HomeBriefingForYouCard, { kind: 'replenishment' }>) =>
			| void
			| Promise<void>;
		onRecipeCta?: (card: HomeBriefingRecipeCard) => void | Promise<void>;
	}

	let {
		summary,
		intelligence,
		displayName = null,
		shoppingListCount = 0,
		shoppingCadence = null,
		recipeSuggestion = null,
		briefingRecipeChip = null,
		briefingFunFact = null,
		briefingOneLiner = null,
		canWrite = false,
		pantryUxV2Enabled = false,
		shoppingUxV2Enabled = false,
		acceptingReplenishment = false,
		onAcceptReplenishment,
		onRecipeCta
	}: Props = $props();


	const locale = $derived(getLocale());
	const useSoonCount = $derived(summary.expiringSoon.length);

	const briefingInput = $derived({
		totalItems: summary.totalItems,
		useSoonCount,
		shoppingListCount,
		shoppingCadence,
		intelligence,
		expiringSoon: summary.expiringSoon,
		recipeSuggestion
	});

	const status = $derived(selectHomeBriefingStatus(briefingInput));
	const forYou = $derived(selectHomeBriefingForYouCard(briefingInput));

	const zoneCounts = $derived.by(() => {
		const counts = Object.fromEntries(LOCATIONS.map((location) => [location, 0])) as Record<
			StorageLocation,
			number
		>;
		for (const entry of summary.counts) {
			counts[entry.location] = entry.count;
		}
		return counts;
	});

	const moment = $derived(selectHomeBriefingMomentCard(briefingInput));

	const greeting = $derived(buildHomeBriefingGreetingPresentation(displayName));
	const statusPresentation = $derived(
		buildHomeBriefingStatusPresentation(status, locale, shoppingCadence, shoppingListCount)
	);
	const forYouPresentation = $derived(
		forYou ? buildHomeBriefingForYouPresentation(forYou, locale, shoppingCadence) : null
	);
	const momentPresentation = $derived(
		moment ? buildHomeBriefingMomentPresentation(moment) : null
	);

	const showRecipeChip = $derived(
		briefingRecipeChip != null &&
			forYou?.kind !== 'recipe' &&
			moment?.kind !== 'planMeal' &&
			(useSoonCount > 0 || isWithinActiveMealSlot())
	);

	const chipsPresentation = $derived(
		buildHomeBriefingChipsPresentation({
			shoppingListCount,
			shoppingCadence,
			locale,
			zoneCounts,
			recipeChip: showRecipeChip ? briefingRecipeChip : null,
			funFact: briefingFunFact
		})
	);

	const storageHref = $derived(pantryUxV2Enabled ? PANTRY_SHELF_PATH : '/inventory');

	const shoppingHref = $derived(
		shoppingUxV2Enabled && isShoppingListReady(shoppingListCount, shoppingCadence)
			? '/inkop?mode=shop'
			: '/inkop'
	);

	const recipeChipHref = $derived(
		briefingRecipeChip ? `/recept/${briefingRecipeChip.id}/laga` : null
	);

	function momentCtaHref(kind: HomeBriefingMomentKind): string {
		switch (kind) {
			case 'emptyPantry':
			case 'scanReceipt':
				return scanModeHref('receipt', APP_HOME_PATH);
			case 'photoRound':
				return scanModeHref('photo', APP_HOME_PATH);
			case 'planMeal':
				return '/planer';
			case 'openShopping':
				return '/inkop';
			case 'seeStats':
				return '/statistik';
		}
	}

	const momentHref = $derived(moment ? momentCtaHref(moment.kind) : null);

	const pulse = $derived(
		selectHomeBriefingPulse({
			forYouKind: forYou?.kind ?? null,
			replenishment: intelligence.replenishment,
			lastUpdatedAt: summary.pantryStatus.lastUpdatedAt
		})
	);
	const pulsePresentation = $derived(pulse ? buildHomeBriefingPulsePresentation(pulse) : null);
	const pulseHref = $derived(pulse?.kind === 'replenishmentMemory' ? shoppingHref : storageHref);

	const forYouCtaHref = $derived.by(() => {
		if (!forYou) return null;
		switch (forYou.kind) {
			case 'expiring':
				return pantryUxV2Enabled
					? `${PANTRY_SHELF_PATH}?filter=expiring`
					: `/inventory/${forYou.item.location}?filter=expiring`;
			case 'shopReady':
				return '/inkop?mode=shop';
			case 'recipe':
				return forYou.missingCount > 0 ? null : '/inkop?mode=shop';
			default:
				return null;
		}
	});

	function trackForYouLinkTap(kind: HomeBriefingForYouCard['kind'], destination: string) {
		trackForYouCtaTapped(kind, destination);
	}

	function trackMomentLinkTap(kind: HomeBriefingMomentCard['kind'], destination: string) {
		trackMomentCtaTapped(kind, destination);
	}
</script>

<div class="home-v2-briefing" data-testid="home-v2-briefing">
	<HomeBriefingGreeting greeting={greeting} status={statusPresentation} statusOverride={briefingOneLiner} />

	{#if forYou && forYouPresentation}
		<p class="section-label">{t('home.v6.forYou.sectionLabel')}</p>
		<HomeBriefingSuggestionCard
			variant="forYou"
			kind={forYou.kind}
			title={forYouPresentation.title}
			body={forYouPresentation.body}
			cta={forYouPresentation.cta}
			{canWrite}
			ctaHref={forYouCtaHref}
			ctaLoading={acceptingReplenishment}
			showActionButton={forYou.kind === 'replenishment' ||
				(forYou.kind === 'recipe' && forYou.missingCount > 0)}
			onCta={
				forYou.kind === 'replenishment' && onAcceptReplenishment
					? () => onAcceptReplenishment(forYou)
					: forYou.kind === 'recipe' && onRecipeCta
						? () => onRecipeCta(forYou)
						: forYouCtaHref
							? () => trackForYouLinkTap(forYou.kind, forYouCtaHref!)
							: undefined
			}
		/>
	{:else if moment && momentPresentation}
		<p class="section-label">{t('home.v6.forYou.sectionLabel')}</p>
		<HomeBriefingSuggestionCard
			variant="moment"
			kind={moment.kind}
			title={momentPresentation.title}
			body={momentPresentation.body}
			cta={momentPresentation.cta}
			ctaHref={momentHref}
			onCta={momentHref ? () => trackMomentLinkTap(moment.kind, momentHref!) : undefined}
		/>
	{/if}


	<HomeBriefingChips
		chips={chipsPresentation}
		{shoppingHref}
		storageHref={storageHref}
		recipeHref={showRecipeChip ? recipeChipHref : null}
		onChipTap={trackHomeChipTapped}
	/>

	{#if pulse && pulsePresentation}
		<a
			class="pulse-card"
			href={pulseHref}
			data-testid="home-v2-pulse"
			data-pulse-kind={pulse.kind}
		>
			<span class="pulse-label">{t('home.v6.pulse.sectionLabel')}</span>
			<span class="pulse-text">{t(pulsePresentation.key, pulsePresentation.params)}</span>
		</a>
	{/if}
</div>

<style>
	.home-v2-briefing {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.section-label {
		margin: var(--space-sm) 0 0;
		font-size: var(--font-size-label, 0.75rem);
		font-weight: var(--font-weight-label, 700);
		letter-spacing: var(--letter-spacing-label, 0.06em);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.pulse-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: var(--space-sm);
		min-height: var(--touch-target-min);
		padding: 12px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		text-decoration: none;
		box-shadow: var(--shadow-sm);
	}

	.pulse-label {
		font-size: var(--font-size-label, 0.75rem);
		font-weight: var(--font-weight-label, 700);
		letter-spacing: var(--letter-spacing-label, 0.04em);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.pulse-text {
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
		line-height: 1.3;
	}

	.pulse-card:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
