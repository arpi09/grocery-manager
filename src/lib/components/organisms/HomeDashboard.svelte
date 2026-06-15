<script lang="ts">

	import { browser } from '$app/environment';

	import { page } from '$app/state';

	import Card from '$lib/components/atoms/Card.svelte';

	import NavIcon from '$lib/components/atoms/NavIcon.svelte';

	import EmptyState from '$lib/components/molecules/EmptyState.svelte';

	import HomeNextAction from '$lib/components/molecules/HomeNextAction.svelte';

	import HomeHouseholdSection from '$lib/components/organisms/HomeHouseholdSection.svelte';

	import ReplenishmentSection from '$lib/components/organisms/ReplenishmentSection.svelte';

	import { composeHouseholdBriefing } from '$lib/domain/household-briefing';

	import { deriveHomeState, HOME_RECOMMENDS_MAX_ROWS } from '$lib/domain/home-state';

	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';

	import type { DashboardSummary } from '$lib/application/inventory.service';

	import { APP_HOME_PATH } from '$lib/navigation/app-home';

	import {

		STREAK_MILESTONE_WEEKS,

		ZERO_WASTE_STREAK_CELEBRATION,

		type GamificationCelebrationKind

	} from '$lib/domain/gamification';

	import { getCelebrationRegistryEntry } from '$lib/domain/gamification.registry';

	import { getTimeOfDay, timeOfDayGreetingKey } from '$lib/domain/meal-slot';

	import { t } from '$lib/i18n';

	import { presentCelebration } from '$lib/utils/present-celebration.svelte';

	import {

		ONBOARDING_PROGRESS_EVENT,

		getActivationProgress,

		type ActivationProgress

	} from '$lib/utils/onboarding';

	import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import type { ReceiptFinishSuggestion, ReceiptPatternSuggestion } from '$lib/domain/purchase-pattern';

	import { scanHubHref, scanModeHref } from '$lib/utils/scan-nav';

	import { recordPeakInventoryCount } from '$lib/utils/household-invite-prompt';

	import { isReceiptImportRecentlyCompleted } from '$lib/utils/receipt-import-session';



	interface Props {

		summary: DashboardSummary;

		celebration?: GamificationCelebrationKind | null;

		canWrite?: boolean;

		displayName?: string | null;

		householdId?: string | null;

		receiptAutopilotSuggestions?: ReceiptPatternSuggestion[];

		receiptFinishSuggestions?: ReceiptFinishSuggestion[];

		intelligence?: HomeIntelligenceSnapshot;

		shoppingListCount?: number;

		showMemoryExplorer?: boolean;

		shoppingCadence?: HouseholdShoppingCadence | null;

	}



	let {

		summary,

		celebration = null,

		canWrite = false,

		displayName = null,

		householdId = null,

		receiptAutopilotSuggestions = [],

		receiptFinishSuggestions = [],

		intelligence = { replenishment: [], pantryHealth: [], waste: null, dedupeByKey: {} },

		shoppingListCount = 0,

		showMemoryExplorer = false,

		shoppingCadence = null

	}: Props = $props();



	const returnTo = APP_HOME_PATH;

	const scanReceiptHref = $derived(scanModeHref('receipt', returnTo));

	const scanBarcodeHref = $derived(scanModeHref('barcode', returnTo));

	const scanHubLinkHref = $derived(scanHubHref(returnTo));

	const userId = $derived(page.data.user?.id ?? null);



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



	const expiringCount = $derived(summary.expiringSoon.length);

	const pantryStatus = $derived(summary.pantryStatus);



	const homeState = $derived(

		deriveHomeState({

			totalItems: summary.totalItems,

			expiringCount,

			shoppingListCount

		})

	);



	const tagline = $derived(

		homeState === 'cold'

			? t('home.taglineEmpty')

			: homeState === 'lista_ready'

				? t('home.taglineListaReady')

				: homeState === 'expiry'

					? t('home.taglineExpiry')

					: homeState === 'steady'

						? t('home.taglineEngaged')

						: null

	);



	const showEngagedSections = $derived(homeState !== 'cold');



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



	const recommendsRows = $derived(

		householdBriefing.replenishment.slice(0, HOME_RECOMMENDS_MAX_ROWS)

	);



	const replenishmentKeys = $derived(new Set(intelligence.replenishment.map((entry) => entry.normalizedKey)));



	const filteredAutopilotSuggestions = $derived(

		receiptAutopilotSuggestions.filter((entry) => !replenishmentKeys.has(entry.normalizedKey))

	);



	const finishSuggestionsForFootnote = $derived(

		browser && isReceiptImportRecentlyCompleted() ? [] : receiptFinishSuggestions

	);



	const receiptFootnoteCount = $derived(

		filteredAutopilotSuggestions.length + finishSuggestionsForFootnote.length

	);



	const showMemoryFootnote = $derived(

		browser && showMemoryExplorer && canWrite && isReceiptImportRecentlyCompleted()

	);



	$effect(() => {

		if (!browser || !userId) {

			return;

		}

		recordPeakInventoryCount(summary.totalItems, userId);

	});



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



<section class="home" aria-label={t('home.ariaLabel')} data-home-state={homeState}>

	<header class="hero" class:hero--engaged={homeState !== 'cold'}>

		<h1>{greeting}</h1>

		{#if tagline}

			<p class="tagline">{tagline}</p>

		{/if}

	</header>



	<section

		class="home-v3-section"

		class:home-v3-section--cold={homeState === 'cold'}

		aria-labelledby={homeState === 'cold' ? undefined : 'home-this-week-heading'}

	>

		{#if homeState !== 'cold'}

			<h2 id="home-this-week-heading" class="home-v3-heading">{t('home.v3.thisWeekTitle')}</h2>

		{/if}

		{#if homeState === 'cold'}

			{#if canWrite}

				<EmptyState

					iconId="box"

					title={t('home.v4.coldTitle')}

					description={t('home.emptyDescriptionShopping')}

					actionLabel={t('home.v4.coldAction')}

					actionHref="/inkop?quick=1"

					primaryAnalyticsId="home.empty_primary"

					secondaryActionLabel={t('home.v4.coldSecondary')}

					secondaryActionHref={scanHubLinkHref}

					secondaryAnalyticsId="home.empty_secondary_scan"

				/>

				<div class="empty-scan-chips">

					<a

						class="empty-chip"

						href={scanReceiptHref}

						data-analytics-id="home.empty_chip_receipt"

					>

						{t('home.chipReceipt')}

					</a>

					<a

						class="empty-chip"

						href={scanBarcodeHref}

						data-analytics-id="home.empty_chip_barcode"

					>

						{t('home.chipBarcode')}

					</a>

				</div>

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

			<a class="shopping-teaser shopping-teaser-primary" href="/inkop" data-analytics-id="home.weekly_shop_cta">

				<span class="shopping-teaser-icon" aria-hidden="true">

					<NavIcon id="shopping" />

				</span>

				<span class="shopping-teaser-copy">{t('home.weeklyShopCta')}</span>

				{#if shoppingListCount > 0}

					<span class="shopping-list-badge" aria-label={t('home.shoppingTeaser', { count: shoppingListCount })}>

						{shoppingListCount}

					</span>

				{/if}

				<span class="shopping-teaser-arrow" aria-hidden="true">→</span>

			</a>



			<HomeNextAction

				totalItems={summary.totalItems}

				{expiringCount}

				staleCount={pantryStatus.staleCount}

				{canWrite}

				{returnTo}

				variant="secondary"

			/>



			{#if !canWrite}

				<p class="readonly-hint">{t('home.readonlyHint')}</p>

			{/if}

		{/if}

	</section>



	{#if showEngagedSections}

	<section class="home-v3-section" aria-labelledby="home-recommends-heading">

		<h2 id="home-recommends-heading" class="home-v3-heading">{t('home.v3.recommendsTitle')}</h2>

		{#if recommendsRows.length > 0}

			<ReplenishmentSection

				suggestions={recommendsRows}

				dedupeByKey={intelligence.dedupeByKey}

				canEdit={canWrite}

				{householdId}

				compact

				surface="hem"

			/>

		{:else if canWrite}

			<p class="section-empty recommends-empty">

				{t('home.v3.recommendsEmpty')}

				<span class="household-empty-links">

					<a href={scanHubLinkHref} data-analytics-id="home.recommends_empty_scan">{t('nav.scan')}</a>

				</span>

			</p>

		{:else}

			<p class="section-empty">{t('home.v3.recommendsEmptyReadonly')}</p>

		{/if}

		{#if canWrite && receiptFootnoteCount > 0}

			<p class="receipt-footnote">

				<a href="/inkop" data-analytics-id="home.receipt_footnote">

					{t('home.v3.receiptFootnote', { count: receiptFootnoteCount })}

				</a>

			</p>

		{/if}

		{#if showMemoryFootnote}

			<p class="receipt-footnote">

				<a href="/settings/memory" data-analytics-id="home.memory_footnote">

					{t('home.v3.memoryFootnote')}

				</a>

			</p>

		{/if}

	</section>



	<section class="home-v3-section" aria-labelledby="home-household-heading">

		<h2 id="home-household-heading" class="home-v3-heading">{t('home.v3.householdTitle')}</h2>

		<HomeHouseholdSection

			{intelligence}

			expiringSoon={summary.expiringSoon}

			staleCount={pantryStatus.staleCount}

			{shoppingListCount}

			{canWrite}

			{householdId}

			{pantryAllGood}

		/>

	</section>

	{/if}

</section>



<style>

	.home {

		display: flex;

		flex-direction: column;

		gap: var(--space-sm);

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

		.hero--engaged {

			padding-bottom: 0;

		}



		.hero--engaged .tagline {

			display: none;

		}



		.hero--engaged h1 {

			font-size: 1.35rem;

			margin-bottom: 0;

		}

	}



	.home-v3-section {

		display: flex;

		flex-direction: column;

		gap: var(--space-sm);

	}



	.home-v3-section--cold {

		margin-top: var(--space-xs);

	}



	.home-v3-heading {

		margin: 0;

		font-size: 0.95rem;

		font-weight: 700;

		letter-spacing: -0.01em;

		line-height: 1.3;

		color: var(--color-text);

	}



	.section-empty {

		margin: 0;

		color: var(--color-text-muted);

		font-size: 0.9375rem;

		line-height: 1.45;

	}

	.empty-scan-chips {

		display: flex;

		flex-wrap: wrap;

		justify-content: center;

		gap: var(--space-xs);

		margin-top: calc(-1 * var(--space-md));

	}

	.empty-chip {

		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-height: var(--touch-target-min);

		padding: var(--space-xs) var(--space-md);

		border: 1px solid var(--color-border);

		border-radius: 999px;

		background: var(--color-surface);

		color: var(--color-text);

		font-size: var(--font-size-body-sm);

		font-weight: 600;

		text-decoration: none;

	}

	.empty-chip:hover {

		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));

		text-decoration: none;

	}

	.empty-tertiary {

		display: block;

		margin-top: var(--space-xs);

		text-align: center;

		font-size: var(--font-size-body-sm);

		font-weight: 600;

		color: var(--color-text-muted);

		text-decoration: none;

	}

	.empty-tertiary:hover {

		color: var(--color-text);

		text-decoration: underline;

		text-underline-offset: 2px;

	}

	.household-empty-links {

		display: inline;

	}

	.household-empty-links a {

		font-weight: 600;

		color: var(--color-primary);

		text-decoration: underline;

		text-underline-offset: 2px;

	}

	.household-empty-sep {

		margin: 0 0.25rem;

	}



	.receipt-footnote {

		margin: 0;

		font-size: 0.875rem;

		line-height: 1.45;

	}



	.receipt-footnote a {

		font-weight: 600;

		color: var(--color-primary);

		text-decoration: underline;

		text-underline-offset: 2px;

	}



	.activation-progress {

		margin: calc(-1 * var(--space-md)) 0 0;

		text-align: center;

		font-size: 0.9375rem;

		font-weight: 600;

		color: var(--color-primary);

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



	.shopping-teaser-primary {

		border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));

		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));

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



	.shopping-list-badge {

		flex-shrink: 0;

		min-width: 1.5rem;

		padding: 0.125rem 0.5rem;

		border-radius: var(--radius-full, 999px);

		background: var(--color-primary);

		color: var(--color-on-primary);

		font-size: 0.8125rem;

		font-weight: 700;

		text-align: center;

		line-height: 1.4;

	}



	.shopping-teaser-arrow {

		flex-shrink: 0;

		color: var(--color-primary);

		font-weight: 600;

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

</style>

