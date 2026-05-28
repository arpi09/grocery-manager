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
</script>

<div class="app">
	<MainNav {user} />
	<main class:wide-main={wide}>
		{@render children()}
	</main>
	<RecipeAssistant />
</div>

<style>
	.app {
		min-height: 100vh;
		padding: var(--space-lg);
		padding-top: var(--space-md);
		padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0));
	}

	@media (min-width: 900px) {
		.app {
			padding-top: 0;
			padding-bottom: var(--space-lg);
		}
	}

	main {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.wide-main {
		max-width: var(--max-width-wide);
	}
</style>
