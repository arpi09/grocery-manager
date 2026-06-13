<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { setContext } from 'svelte';
	import { page } from '$app/state';
	import AppSeoHead from '$lib/components/seo/AppSeoHead.svelte';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';
	import MainNav from '$lib/components/organisms/MainNav.svelte';
	import RecipeAssistant from '$lib/components/organisms/RecipeAssistant.svelte';
	import ActionToast from '$lib/components/molecules/ActionToast.svelte';
	import ClientToast from '$lib/components/molecules/ClientToast.svelte';
	import GamificationToast from '$lib/components/molecules/GamificationToast.svelte';
	import CelebrationMoment from '$lib/components/molecules/CelebrationMoment.svelte';
	import InventoryScanToast from '$lib/components/molecules/InventoryScanToast.svelte';
	import ExpiryNudgeToast from '$lib/components/molecules/ExpiryNudgeToast.svelte';
	import ActivationCelebration from '$lib/components/organisms/ActivationCelebration.svelte';
	import HouseholdInvitePrompt from '$lib/components/organisms/HouseholdInvitePrompt.svelte';
	import OnboardingGuide from '$lib/components/organisms/OnboardingGuide.svelte';
	import PageHintModal from '$lib/components/organisms/PageHintModal.svelte';
	import PostOnboardingSurvey from '$lib/components/organisms/PostOnboardingSurvey.svelte';
	import PmfSurveyBanner from '$lib/components/organisms/PmfSurveyBanner.svelte';
	import { canEditInventory } from '$lib/domain/household';
	import DemoAccountBanner from '$lib/components/molecules/DemoAccountBanner.svelte';
	import {
		REGISTRATION_WELCOME_DONE_EVENT,
		completeOnboarding,
		markSignupAt
	} from '$lib/utils/onboarding';
	import type { NavUser } from '$lib/navigation/nav-config';
	import type { UserHouseholdSummary } from '$lib/domain/household';
	import { initAnalyticsBeacon } from '$lib/client/analytics-beacon';
	import { t } from '$lib/i18n';
	import { OPEN_RECIPE_ASSISTANT_PARAM } from '$lib/utils/recipe-assistant-nav';
	import { POST_REGISTER_INKOP_PATH } from '$lib/navigation/post-register';

	interface Props {
		children: Snippet;
		user?: (NavUser & { email: string }) | null;
		hideNav?: boolean;
	}

	let { children, user = null, hideNav = false }: Props = $props();

	let recipeOpen = $state(false);

	const households = $derived((page.data.households ?? []) as UserHouseholdSummary[]);
	const activeHousehold = $derived(
		(page.data.activeHousehold ?? null) as { id: string; name: string } | null
	);

	const canWrite = $derived(
		page.data.householdRole ? canEditInventory(page.data.householdRole) : false
	);
	const staleCount = $derived(
		typeof page.data.staleCount === 'number' ? page.data.staleCount : 0
	);
	const householdMemberCount = $derived(
		typeof page.data.householdMemberCount === 'number' ? page.data.householdMemberCount : 0
	);

	function openRecipeIdeas() {
		recipeOpen = true;
	}

	setContext(OPEN_RECIPE_IDEAS, openRecipeIdeas);

	const locale = $derived((page.data.locale === 'en' ? 'en' : 'sv') as 'sv' | 'en');
	const showDemoBanner = $derived(Boolean(page.data.user?.isDemo));

	$effect(() => {
		if (!browser) {
			return;
		}

		if (page.url.searchParams.get(OPEN_RECIPE_ASSISTANT_PARAM) !== '1') {
			return;
		}

		recipeOpen = true;
		const url = new URL(page.url);
		url.searchParams.delete(OPEN_RECIPE_ASSISTANT_PARAM);
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		if (page.url.searchParams.get('freshAccount') !== '1') {
			return;
		}

		if (!page.data.user?.emailVerified) {
			return;
		}

		const userId = page.data.user?.id;
		if (!userId) {
			return;
		}

		markSignupAt(userId);
		completeOnboarding(userId);
		void goto(POST_REGISTER_INKOP_PATH, { replaceState: true, keepFocus: true, noScroll: true });
	});

	$effect(() => {
		if (browser) {
			initAnalyticsBeacon();
		}
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		if (page.url.searchParams.get('welcome') !== '1' || !page.data.user?.emailVerified) {
			return;
		}

		const url = new URL(page.url);
		url.searchParams.delete('welcome');
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		const stripWelcomeParam = () => {
			if (page.url.searchParams.get('welcome') !== '1') {
				return;
			}
			const url = new URL(page.url);
			url.searchParams.delete('welcome');
			const next = `${url.pathname}${url.search}${url.hash}`;
			void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
		};

		window.addEventListener(REGISTRATION_WELCOME_DONE_EVENT, stripWelcomeParam);
		return () => window.removeEventListener(REGISTRATION_WELCOME_DONE_EVENT, stripWelcomeParam);
	});
</script>

<AppSeoHead {locale} />

<div class="app" class:app--hide-nav={hideNav}>
	<a href="#main-content" class="skip-to-main">{t('a11y.skipToContent')}</a>
	{#if !hideNav}
		<MainNav {user} {households} {activeHousehold} {staleCount} {canWrite} />
	{/if}
	<main id="main-content" tabindex="-1">
		{#if showDemoBanner}
			<DemoAccountBanner />
		{/if}
		{#key page.url.pathname}
			<div class="page-content motion-page-enter">
				{@render children()}
			</div>
		{/key}
	</main>
	<InventoryScanToast />
	<ExpiryNudgeToast />
	<ActionToast />
	<ClientToast />
	<GamificationToast />
	<CelebrationMoment />
	<OnboardingGuide />
	<PageHintModal />
	<PostOnboardingSurvey />
	<PmfSurveyBanner />
	<ActivationCelebration />
	<HouseholdInvitePrompt memberCount={householdMemberCount} />
	<RecipeAssistant bind:open={recipeOpen} canEdit={canWrite} />
</div>

<style>
	.app {
		position: relative;
		min-height: 100vh;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		padding: 0;
		padding-bottom: var(--content-bottom-safe);
	}

	.app--hide-nav {
		padding-bottom: 0;
	}

	.app--hide-nav main {
		padding: 0;
	}

	main {
		width: 100%;
		min-width: 0;
		padding: 0 var(--page-padding-x) var(--space-lg);
	}

	.page-content {
		width: 100%;
		min-width: 0;
	}

	@media (min-width: 900px) {
		main {
			padding-bottom: var(--space-xl);
			scroll-margin-top: var(--header-height-desktop);
		}

		main:focus {
			outline: none;
		}
	}
</style>

