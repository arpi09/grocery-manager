<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import HomeHero from '$lib/components/molecules/HomeHero.svelte';
	import HomeMemoryLines from '$lib/components/molecules/HomeMemoryLines.svelte';
	import HomeExpiringList from '$lib/components/molecules/HomeExpiringList.svelte';
	import { deriveHomeState } from '$lib/domain/home-state';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import {
		STREAK_MILESTONE_WEEKS,
		ZERO_WASTE_STREAK_CELEBRATION,
		type GamificationCelebrationKind
	} from '$lib/domain/gamification';
	import { getCelebrationRegistryEntry } from '$lib/domain/gamification.registry';
	import { t } from '$lib/i18n';
	import { presentCelebration } from '$lib/utils/present-celebration.svelte';
	import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import { recordPeakInventoryCount } from '$lib/utils/household-invite-prompt';

	interface Props {
		summary: DashboardSummary;
		celebration?: GamificationCelebrationKind | null;
		canWrite?: boolean;
		householdId?: string | null;
		intelligence?: HomeIntelligenceSnapshot;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
	}

	let {
		summary,
		celebration = null,
		canWrite = false,
		householdId = null,
		intelligence = { replenishment: [], pantryHealth: [], waste: null, dedupeByKey: {} },
		shoppingListCount = 0,
		shoppingCadence = null
	}: Props = $props();

	const returnTo = APP_HOME_PATH;
	const scanReceiptHref = $derived(scanModeHref('receipt', returnTo));
	const userId = $derived(page.data.user?.id ?? null);

	const expiringCount = $derived(summary.expiringSoon.length);
	const homeState = $derived(
		deriveHomeState({
			totalItems: summary.totalItems,
			expiringCount,
			shoppingListCount
		})
	);

	$effect(() => {
		if (!browser || !userId) return;
		recordPeakInventoryCount(summary.totalItems, userId);
	});

	$effect(() => {
		if (!browser || !celebration || !householdId) return;

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

<section class="home" aria-label={t('home.ariaLabel')} data-home-state={homeState}>
	<HomeHero
		{homeState}
		{shoppingListCount}
		{expiringCount}
		{canWrite}
		{scanReceiptHref}
	/>

	{#if homeState !== 'cold'}
		<HomeMemoryLines {shoppingCadence} {intelligence} />
		<HomeExpiringList expiringSoon={summary.expiringSoon} />
		{#if !canWrite}
			<p class="readonly-hint">{t('home.readonlyHint')}</p>
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

	.readonly-hint {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}
</style>
