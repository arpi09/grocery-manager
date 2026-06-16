<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import HomeWelcome from '$lib/components/molecules/HomeWelcome.svelte';
	import HomePantryCard from '$lib/components/molecules/HomePantryCard.svelte';
	import HomeShoppingCard from '$lib/components/molecules/HomeShoppingCard.svelte';
	import HomeExpiringCard from '$lib/components/molecules/HomeExpiringCard.svelte';
	import HomeAttentionCard from '$lib/components/molecules/HomeAttentionCard.svelte';
	import { deriveHomeState } from '$lib/domain/home-state';
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
	import { preferredScanHref, scanHubHref } from '$lib/utils/scan-nav';
	import { recordPeakInventoryCount } from '$lib/utils/household-invite-prompt';

	interface Props {
		summary: DashboardSummary;
		celebration?: GamificationCelebrationKind | null;
		canWrite?: boolean;
		displayName?: string | null;
		householdId?: string | null;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
	}

	let {
		summary,
		celebration = null,
		canWrite = false,
		displayName = null,
		householdId = null,
		shoppingListCount = 0,
		shoppingCadence = null
	}: Props = $props();

	const returnTo = APP_HOME_PATH;
	const scanHref = $derived(canWrite ? scanHubHref(returnTo) : preferredScanHref());
	const userId = $derived(page.data.user?.id ?? null);

	const expiringCount = $derived(summary.expiringSoon.length);
	const homeState = $derived(
		deriveHomeState({
			totalItems: summary.totalItems,
			expiringCount,
			shoppingListCount
		})
	);
	const isCold = $derived(homeState === 'cold');
	const showAttentionCard = $derived(
		summary.pantryStatus.staleCount > 0 ||
			summary.pantryStatus.withoutExpiryCount > 0 ||
			summary.pantryStatus.autoExpiredCount > 0
	);

	const pantrySize = $derived.by(() => {
		if (homeState === 'expiry' || homeState === 'cold') return 'compact' as const;
		return 'default' as const;
	});

	const shoppingSize = $derived.by(() => {
		if (homeState === 'lista_ready') return 'hero' as const;
		if (homeState === 'expiry') return 'compact' as const;
		return 'default' as const;
	});

	const expiringSize = $derived(homeState === 'expiry' ? ('hero' as const) : ('default' as const));

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
	<HomeWelcome {displayName} totalItems={summary.totalItems} {homeState} {shoppingListCount} />

	{#if canWrite}
		<div class="scan-cta-wrap">
			<a
				class="btn btn-primary btn-full scan-cta"
				href={scanHref}
				data-testid="home-scan-cta"
				data-analytics-id="home.scan_cta"
			>
				{t('home.scanCardTitle')}
			</a>
			{#if isCold}
				<a
					class="btn btn-secondary btn-full secondary-cta"
					href="/inkop?quick=1"
					data-analytics-id="home.cold_shopping_secondary"
				>
					{t('home.v4.coldAction')}
				</a>
			{/if}
		</div>
	{/if}

	<div class="card-grid">
		{#if homeState === 'expiry'}
			<HomeExpiringCard expiringSoon={summary.expiringSoon} {homeState} size={expiringSize} />
			<HomePantryCard
				totalItems={summary.totalItems}
				counts={summary.counts}
				pantryStatus={summary.pantryStatus}
				cold={isCold}
				size={pantrySize}
			/>
			<HomeShoppingCard {shoppingListCount} {shoppingCadence} size={shoppingSize} />
		{:else if homeState === 'lista_ready'}
			<HomeShoppingCard {shoppingListCount} {shoppingCadence} size={shoppingSize} />
			<HomePantryCard
				totalItems={summary.totalItems}
				counts={summary.counts}
				pantryStatus={summary.pantryStatus}
				cold={isCold}
				size={pantrySize}
			/>
			<HomeExpiringCard expiringSoon={summary.expiringSoon} {homeState} size={expiringSize} />
		{:else}
			<HomePantryCard
				totalItems={summary.totalItems}
				counts={summary.counts}
				pantryStatus={summary.pantryStatus}
				cold={isCold}
				size={pantrySize}
			/>
			<HomeShoppingCard {shoppingListCount} {shoppingCadence} size={shoppingSize} />
			<HomeExpiringCard expiringSoon={summary.expiringSoon} {homeState} size={expiringSize} />
		{/if}
		{#if showAttentionCard}
			<HomeAttentionCard pantryStatus={summary.pantryStatus} />
		{/if}
	</div>

	{#if !canWrite}
		<p class="readonly-hint">{t('home.readonlyHint')}</p>
	{/if}
</section>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: var(--page-section-gap);
		padding-top: var(--space-xs);
	}

	.scan-cta-wrap {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.scan-cta,
	.secondary-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-sm);
		font-weight: 600;
		text-decoration: none;
		text-align: center;
	}

	.scan-cta {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.scan-cta:hover {
		background: var(--color-primary-hover);
		color: var(--color-on-primary);
	}

	.secondary-cta {
		background: var(--color-surface-muted);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.card-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--page-section-gap);
	}

	.card-grid :global(.dashboard-card[data-card-size='hero']) {
		grid-column: 1 / -1;
	}

	@media (min-width: 720px) {
		.card-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.card-grid :global(.dashboard-card[data-card-size='hero']) {
			grid-column: span 2;
		}
	}

	.readonly-hint {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}
</style>
