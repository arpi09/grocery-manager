<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		/** Rare: span full main width (no max-width cap). */
		fullBleed?: boolean;
	}

	let { children, fullBleed = false }: Props = $props();
</script>

<div class="page-container" class:full-bleed={fullBleed}>
	{@render children()}
</div>

<style>
	.page-container {
		width: 100%;
		max-width: var(--page-max-width);
		margin-inline: auto;
		min-width: 0;
	}

	.full-bleed {
		max-width: none;
	}
</style>
