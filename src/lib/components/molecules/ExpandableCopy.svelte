<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n';

	interface Props {
		id?: string;
		preview?: string;
		expanded?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		id,
		preview,
		expanded = $bindable(false),
		class: className = '',
		children
	}: Props = $props();

	const instanceId = crypto.randomUUID();
	const contentId = $derived(id ?? `expandable-copy-${instanceId}`);
</script>

<div class="expandable-copy {className}">
	{#if expanded}
		<div class="body" id={contentId}>
			{@render children()}
		</div>
	{:else if preview}
		<p class="body preview" id={contentId}>{preview}</p>
	{/if}

	<button
		type="button"
		class="toggle"
		aria-expanded={expanded}
		aria-controls={contentId}
		onclick={() => (expanded = !expanded)}
	>
		{expanded ? t('common.readLess') : t('common.readMore')}
	</button>
</div>

<style>
	.expandable-copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-xs);
		min-width: 0;
	}

	.body {
		margin: 0;
		color: var(--color-text-muted);
		font-size: inherit;
		line-height: 1.45;
		max-width: 42ch;
	}

	.body :global(p) {
		margin: 0;
	}

	.body :global(p + p) {
		margin-top: var(--space-xs);
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-primary);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 0.15em;
		cursor: pointer;
	}

	.toggle:hover {
		color: var(--color-primary-hover);
	}

	.toggle:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}
</style>
