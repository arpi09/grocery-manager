<script lang="ts">
	import type { Snippet } from 'svelte';
	import MainNav from '$lib/components/organisms/MainNav.svelte';
	import RecipeAssistant from '$lib/components/organisms/RecipeAssistant.svelte';
	import type { NavUser } from '$lib/navigation/nav-config';

	interface Props {
		children: Snippet;
		wide?: boolean;
		user?: (NavUser & { email: string }) | null;
	}

	let { children, wide = false, user = null }: Props = $props();

	let recipeOpen = $state(false);

	function openRecipeIdeas() {
		recipeOpen = true;
	}
</script>

<div class="app">
	<MainNav {user} onRecipeIdeas={openRecipeIdeas} />
	<main class:wide-main={wide}>
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
		max-width: var(--max-width);
		margin: 0 auto;
		padding-top: var(--space-sm);
	}

	@media (min-width: 900px) {
		main {
			padding-top: 0;
		}
	}

	.wide-main {
		max-width: var(--max-width-wide);
	}
</style>
