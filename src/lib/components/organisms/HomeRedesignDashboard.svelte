<script lang="ts">
	import HomeHero from '$lib/components/molecules/HomeHero.svelte';
	import HomeForYouCard from '$lib/components/molecules/HomeForYouCard.svelte';
	import HomeOverviewCard from '$lib/components/molecules/HomeOverviewCard.svelte';
	import HomeExpiringIllustration from '$lib/components/organisms/illustrations/HomeExpiringIllustration.svelte';
	import HomeShoppingIllustration from '$lib/components/organisms/illustrations/HomeShoppingIllustration.svelte';
	import HomePantryIllustration from '$lib/components/organisms/illustrations/HomePantryIllustration.svelte';
	import HomeHouseholdIllustration from '$lib/components/organisms/illustrations/HomeHouseholdIllustration.svelte';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import { deriveHomeForYou } from '$lib/domain/home-for-you';
	import { deriveHeroStatus, getHomeHeroTimeBand } from '$lib/domain/home-hero';
	import { deriveHomeState } from '$lib/domain/home-state';
	import { buildHomeViewedMetadata, resolveHeroScrollTargetId } from '$lib/domain/home-redesign-telemetry';
	import { formatCadenceWeekday, type HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { getLocale, t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';
	import { trackProductEvent, type ClientProductEventType } from '$lib/client/product-events';
	import { onMount } from 'svelte';

	interface Props {
		summary: DashboardSummary;
		intelligence: HomeIntelligenceSnapshot;
		canWrite?: boolean;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
	}

	let {
		summary,
		intelligence,
		canWrite = false,
		shoppingListCount = 0,
		shoppingCadence = null
	}: Props = $props();

	const expiringCount = $derived(summary.expiringSoon.length);
	const homeState = $derived(
		deriveHomeState({
			totalItems: summary.totalItems,
			expiringCount,
			shoppingListCount
		})
	);
	const forYou = $derived(deriveHomeForYou(intelligence, summary.expiringSoon));
	const heroBand = $derived(getHomeHeroTimeBand());
	const heroStatus = $derived(deriveHeroStatus(homeState));
	const heroScrollTargetId = $derived(
		resolveHeroScrollTargetId({ hasForYou: forYou != null, expiringCount })
	);
	const scanHref = $derived(canWrite ? scanHubHref('/hem') : '/scan');

	const locale = $derived(getLocale());
	const cadenceLabel = $derived.by(() => {
		if (!shoppingCadence) return null;
		const weekday = formatCadenceWeekday(shoppingCadence.weekday, locale);
		return t('home.v5.shopping.cadence', { weekday });
	});

	const pantrySecondary = $derived(
		summary.pantryStatus.staleCount > 0
			? t('home.v5.pantry.needsAttention')
			: t('home.v5.pantry.allGood')
	);

	onMount(() => {
		void trackProductEvent(
			'home_viewed',
			buildHomeViewedMetadata({
				homeState,
				hasRecommendation: forYou != null,
				recommendationKind: forYou?.kind ?? null,
				heroBand,
				heroStatus,
				expiringCount,
				shoppingCount: shoppingListCount,
				pantryCount: summary.totalItems
			})
		);
	});

	function trackCard(event: Extract<
		ClientProductEventType,
		'expiring_clicked' | 'shopping_clicked' | 'pantry_clicked' | 'household_clicked'
	>) {
		void trackProductEvent(event, { homeState });
	}
</script>

<section class="home-v5" aria-label={t('home.ariaLabel')} data-home-state={homeState}>
	<HomeHero {homeState} {scanHref} scrollTargetId={heroScrollTargetId} />

	{#if forYou}
		<HomeForYouCard recommendation={forYou} {canWrite} />
	{/if}

	<div class="compact-row">
		<HomeOverviewCard
			id="home-expiring-card"
			title={t('home.v5.expiring.title')}
			href={expiringCount > 0 ? '/inventory/fridge?filter=expiring' : '/inventory/fridge'}
			tone={expiringCount > 0 ? 'attention' : 'default'}
			testId="home-expiring-card"
			onclick={() => trackCard('expiring_clicked')}
		>
			{#snippet illustration()}<HomeExpiringIllustration />{/snippet}
			{#snippet body()}
				<p>{t('home.v5.expiring.body', { count: expiringCount })}</p>
			{/snippet}
			{#snippet secondary()}
				<p>{t('home.v5.expiring.link')}</p>
			{/snippet}
		</HomeOverviewCard>

		<HomeOverviewCard
			id="home-shopping-card"
			title={t('home.v5.shopping.title')}
			href="/inkop"
			testId="home-shopping-card"
			onclick={() => trackCard('shopping_clicked')}
		>
			{#snippet illustration()}<HomeShoppingIllustration />{/snippet}
			{#snippet body()}
				<p>{t('home.v5.shopping.body', { count: shoppingListCount })}</p>
			{/snippet}
			{#snippet secondary()}
				{#if cadenceLabel}
					<p>{cadenceLabel}</p>
				{/if}
				<p>{t('home.v5.shopping.link')}</p>
			{/snippet}
		</HomeOverviewCard>
	</div>

	<div class="compact-row secondary-row">
		<HomeOverviewCard
			title={t('home.v5.pantry.title')}
			href="/inventory/fridge"
			testId="home-pantry-card"
			onclick={() => trackCard('pantry_clicked')}
		>
			{#snippet illustration()}<HomePantryIllustration />{/snippet}
			{#snippet body()}
				<p>{t('home.v5.pantry.body', { count: summary.totalItems })}</p>
			{/snippet}
			{#snippet secondary()}
				<p>{pantrySecondary}</p>
			{/snippet}
		</HomeOverviewCard>

		<HomeOverviewCard
			title={t('home.v5.household.title')}
			href="/settings/household"
			testId="home-household-card"
			onclick={() => trackCard('household_clicked')}
		>
			{#snippet illustration()}<HomeHouseholdIllustration />{/snippet}
			{#snippet body()}
				<p>{t('home.v5.household.body')}</p>
			{/snippet}
			{#snippet secondary()}
				<p>{t('home.v5.household.link')}</p>
			{/snippet}
		</HomeOverviewCard>
	</div>
</section>

<style>
	.home-v5 {
		display: flex;
		flex-direction: column;
		gap: var(--page-section-gap);
		padding-top: var(--space-xs);
	}

	.compact-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--page-section-gap);
	}

	@media (min-width: 720px) {
		.compact-row {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
