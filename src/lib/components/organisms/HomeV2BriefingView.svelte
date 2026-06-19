<script lang="ts">
	import SceneIllustration from '$lib/components/atoms/SceneIllustration.svelte';
	import HomeBriefingChips from '$lib/components/molecules/HomeBriefingChips.svelte';
	import HomeBriefingForYouCard from '$lib/components/molecules/HomeBriefingForYouCard.svelte';
	import HomeBriefingGreeting from '$lib/components/molecules/HomeBriefingGreeting.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import {
		buildHomeBriefingChipsPresentation,
		buildHomeBriefingForYouPresentation,
		buildHomeBriefingGreetingPresentation,
		buildHomeBriefingStatusPresentation
	} from '$lib/domain/home-briefing-presenter';
	import {
		selectHomeBriefingForYouCard,
		selectHomeBriefingStatus,
		type HomeBriefingForYouCard
	} from '$lib/domain/home-briefing';
	import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { getLocale, t } from '$lib/i18n';
	import { PANTRY_SHELF_PATH } from '$lib/navigation/nav-config';
	import type { StorageLocation } from '$lib/domain/location';

	interface Props {
		summary: DashboardSummary;
		intelligence: HomeIntelligenceSnapshot;
		displayName?: string | null;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
		canWrite?: boolean;
		pantryUxV2Enabled?: boolean;
		acceptingReplenishment?: boolean;
		onAcceptReplenishment?: (card: Extract<HomeBriefingForYouCard, { kind: 'replenishment' }>) =>
			| void
			| Promise<void>;
	}

	let {
		summary,
		intelligence,
		displayName = null,
		shoppingListCount = 0,
		shoppingCadence = null,
		canWrite = false,
		pantryUxV2Enabled = false,
		acceptingReplenishment = false,
		onAcceptReplenishment
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
		recipeSuggestion: null
	});

	const status = $derived(selectHomeBriefingStatus(briefingInput));
	const forYou = $derived.by(() => {
		const card = selectHomeBriefingForYouCard(briefingInput);
		if (!card) return null;
		if (card.kind === 'expiring') {
			return {
				...card,
				suggestion: locationLabel(locale, card.item.location)
			};
		}
		return card;
	});

	const greeting = $derived(buildHomeBriefingGreetingPresentation(displayName));
	const statusPresentation = $derived(buildHomeBriefingStatusPresentation(status, locale));
	const forYouPresentation = $derived(
		forYou ? buildHomeBriefingForYouPresentation(forYou, locale) : null
	);
	const chipsPresentation = $derived(
		buildHomeBriefingChipsPresentation({ useSoonCount, shoppingCadence, locale })
	);

	const useSoonHref = $derived.by(() => {
		const primaryZone =
			(summary.expiringSoon.find((item) => item.location)?.location as StorageLocation | undefined) ??
			'fridge';
		return pantryUxV2Enabled
			? `${PANTRY_SHELF_PATH}?filter=expiring`
			: `/inventory/${primaryZone}?filter=expiring`;
	});

	const pantryHref = $derived(pantryUxV2Enabled ? PANTRY_SHELF_PATH : '/inventory/fridge');

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
				return '/inkop';
			default:
				return null;
		}
	});
</script>

<div class="home-v2-briefing" data-testid="home-v2-briefing">
	<div class="hero-wrap">
		<SceneIllustration
			src="/illustrations/v2/home-hero.svg"
			ariaLabel={t('home.v6.hero.illustrationAria')}
			width={390}
			height={120}
		/>
	</div>

	<HomeBriefingGreeting greeting={greeting} status={statusPresentation} />

	{#if forYou && forYouPresentation}
		<p class="section-label">{t('home.v6.forYou.sectionLabel')}</p>
		<HomeBriefingForYouCard
			card={forYou}
			title={forYouPresentation.title}
			body={forYouPresentation.body}
			cta={forYouPresentation.cta}
			{canWrite}
			ctaHref={forYouCtaHref}
			ctaLoading={acceptingReplenishment}
			onCta={
				forYou.kind === 'replenishment' && onAcceptReplenishment
					? () => onAcceptReplenishment(forYou)
					: undefined
			}
		/>
	{/if}

	<HomeBriefingChips
		useSoon={chipsPresentation.useSoon}
		shopping={chipsPresentation.shopping}
		{useSoonHref}
		shoppingHref="/inkop"
		householdHref="/settings/household"
		{pantryHref}
		showUseSoon={useSoonCount > 0}
	/>
</div>

<style>
	.home-v2-briefing {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.hero-wrap {
		margin: var(--space-sm) 0;
	}

	.hero-wrap :global(.scene-illus) {
		justify-content: stretch;
		opacity: 1;
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.hero-wrap :global(.scene-illus img) {
		width: 100%;
		max-height: 120px;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	.section-label {
		margin: var(--space-sm) 0 0;
		font-size: var(--font-size-label, 0.75rem);
		font-weight: var(--font-weight-label, 700);
		letter-spacing: var(--letter-spacing-label, 0.06em);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
</style>
