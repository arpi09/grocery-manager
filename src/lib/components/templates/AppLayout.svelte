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
	import GamificationToast from '$lib/components/molecules/GamificationToast.svelte';
	import InventoryScanToast from '$lib/components/molecules/InventoryScanToast.svelte';
	import ActivationCelebration from '$lib/components/organisms/ActivationCelebration.svelte';
	import OnboardingGuide from '$lib/components/organisms/OnboardingGuide.svelte';
	import PostOnboardingSurvey from '$lib/components/organisms/PostOnboardingSurvey.svelte';
	import { canEditInventory } from '$lib/domain/household';
	import DemoAccountBanner from '$lib/components/molecules/DemoAccountBanner.svelte';
	import { completeOnboarding, markSignupAt } from '$lib/utils/onboarding';
	import type { NavUser } from '$lib/navigation/nav-config';
	import type { UserHouseholdSummary } from '$lib/domain/household';

	interface Props {
		children: Snippet;
		user?: (NavUser & { email: string }) | null;
	}

	let { children, user = null }: Props = $props();

	let recipeOpen = $state(false);

	const households = $derived((page.data.households ?? []) as UserHouseholdSummary[]);
	const activeHousehold = $derived(
		(page.data.activeHousehold ?? null) as { id: string; name: string } | null
	);

	const canWrite = $derived(
		page.data.householdRole ? canEditInventory(page.data.householdRole) : false
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

		if (page.url.searchParams.get('freshAccount') !== '1') {
			return;
		}

		const userId = page.data.user?.id;
		if (!userId) {
			return;
		}

		markSignupAt(userId);
		completeOnboarding(userId);
		const url = new URL(page.url);
		url.searchParams.delete('freshAccount');
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	});
</script>

<AppSeoHead {locale} />

<div class="app">
	<MainNav {user} {households} {activeHousehold} onRecipeIdeas={openRecipeIdeas} />
	<main>
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
	<ActionToast />
	<GamificationToast />
	<OnboardingGuide />
	<PostOnboardingSurvey />
	<ActivationCelebration />
	<RecipeAssistant bind:open={recipeOpen} canEdit={canWrite} />
</div>

<style>
	.app {
		min-height: 100vh;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		padding: 0;
		padding-bottom: var(--content-bottom-safe);
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
	}
</style>
