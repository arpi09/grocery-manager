<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import { page } from '$app/state';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';
	import MainNav from '$lib/components/organisms/MainNav.svelte';
	import RecipeAssistant from '$lib/components/organisms/RecipeAssistant.svelte';
	import ScanFab from '$lib/components/molecules/ScanFab.svelte';
	import InventoryScanToast from '$lib/components/molecules/InventoryScanToast.svelte';
	import OnboardingGuide from '$lib/components/organisms/OnboardingGuide.svelte';
	import { canEditInventory } from '$lib/domain/household';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { isStorageLocation } from '$lib/domain/location';
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

	const showScanFab = $derived.by(() => {
		if (!canWrite || page.url.pathname.startsWith('/scan')) {
			return false;
		}
		return page.url.pathname === APP_HOME_PATH;
	});

	const scanFabHref = $derived.by(() => {
		const from = encodeURIComponent(`${page.url.pathname}${page.url.search}`);
		const inventoryMatch = page.url.pathname.match(/^\/inventory\/([^/]+)$/);
		if (inventoryMatch && isStorageLocation(inventoryMatch[1])) {
			return `/scan?mode=barcode&location=${inventoryMatch[1]}&from=${from}`;
		}
		return `/scan?mode=barcode&from=${from}`;
	});

	function openRecipeIdeas() {
		recipeOpen = true;
	}

	setContext(OPEN_RECIPE_IDEAS, openRecipeIdeas);
</script>

<div class="app">
	<MainNav {user} {households} {activeHousehold} onRecipeIdeas={openRecipeIdeas} />
	<main>
		{@render children()}
	</main>
	<InventoryScanToast />
	{#if showScanFab}
		<ScanFab {canWrite} href={scanFabHref} />
	{/if}
	<RecipeAssistant bind:open={recipeOpen} />
	<OnboardingGuide />
</div>

<style>
	.app {
		min-height: 100vh;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		padding: 0;
		padding-bottom: calc(
			var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom, 0) + var(--space-lg)
		);
	}

	@media (min-width: 900px) {
		.app {
			padding-bottom: var(--space-xl);
		}
	}

	main {
		width: 100%;
		min-width: 0;
		padding: var(--space-sm) var(--space-lg) var(--space-lg);
	}

	@media (min-width: 900px) {
		main {
			padding-top: 0;
			scroll-margin-top: var(--header-height-desktop);
		}
	}
</style>
