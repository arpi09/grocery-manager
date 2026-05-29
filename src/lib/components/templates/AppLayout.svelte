<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import MainNav from '$lib/components/organisms/MainNav.svelte';
	import RecipeAssistant from '$lib/components/organisms/RecipeAssistant.svelte';
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

	function openRecipeIdeas() {
		recipeOpen = true;
	}
</script>

<div class="app">
	<MainNav {user} {households} {activeHousehold} onRecipeIdeas={openRecipeIdeas} />
	<main>
		{@render children()}
	</main>
	<RecipeAssistant bind:open={recipeOpen} />
</div>

<style>
	.app {
		--mobile-bottom-nav-height: 4.25rem;
		min-height: 100vh;
		padding: var(--space-lg);
		padding-top: 0;
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
		padding-top: var(--space-sm);
	}

	@media (min-width: 900px) {
		main {
			padding-top: 0;
		}
	}
</style>
