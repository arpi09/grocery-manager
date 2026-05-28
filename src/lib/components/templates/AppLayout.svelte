<script lang="ts">
	import type { Snippet } from 'svelte';
	import RecipeAssistant from '$lib/components/organisms/RecipeAssistant.svelte';

	interface Props {
		children: Snippet;
	wide?: boolean;
	}

let { children, wide = false }: Props = $props();
</script>

<div class="app">
	<main class:wide-main={wide}>
		{@render children()}
	</main>
	<RecipeAssistant />
</div>

<style>
	.app {
		min-height: 100vh;
		padding: var(--space-lg);
		padding-bottom: 5rem;
	}

	main {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.wide-main {
		max-width: var(--max-width-wide);
	}
</style>
