<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		collapsed?: boolean;
		'data-testid'?: string;
		children: Snippet;
	}

	let {
		class: className = '',
		collapsed = false,
		'data-testid': dataTestId,
		children
	}: Props = $props();
</script>

<div
	class="skaffu-filter-bar {className}"
	class:skaffu-filter-bar--collapsed={collapsed}
	data-testid={dataTestId}
>
	{@render children()}
</div>

<style>
	.skaffu-filter-bar {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font);
	}

	.skaffu-filter-bar :global(.list-toolbar) {
		gap: var(--space-xs);
	}

	.skaffu-filter-bar :global(.search-wrap input),
	.skaffu-filter-bar :global(.search-input input) {
		border-radius: var(--radius-sm);
		border-color: var(--color-border);
		background: var(--color-surface-muted);
		font-family: var(--font);
	}

	.skaffu-filter-bar :global(.filter-chip),
	.skaffu-filter-bar :global(.sort-chip),
	.skaffu-filter-bar :global(.section-chip) {
		border-radius: var(--radius-sm);
		font-family: var(--font);
	}

	.skaffu-filter-bar--collapsed :global(.chip-row),
	.skaffu-filter-bar--collapsed :global(.filter-chips--panel) {
		display: none;
	}
</style>
