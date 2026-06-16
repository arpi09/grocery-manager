<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		id?: string;
		tabindex?: number;
		'aria-label'?: string;
		'data-testid'?: string;
		header?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	let {
		class: className = '',
		id,
		tabindex,
		'aria-label': ariaLabel,
		'data-testid': dataTestId,
		header,
		footer,
		children
	}: Props = $props();
</script>

<section
	class="skaffu-list-panel {className}"
	id={id}
	aria-label={ariaLabel}
	data-testid={dataTestId}
	{...(tabindex !== undefined ? { tabindex } : {})}
>
	{#if header}
		<div class="panel-header">
			{@render header()}
		</div>
	{/if}

	{@render children()}

	{#if footer}
		<div class="panel-footer">
			{@render footer()}
		</div>
	{/if}
</section>

<style>
	.skaffu-list-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		min-width: 0;
		scroll-margin-top: calc(var(--sticky-below-header) + var(--space-md));
	}

	.panel-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.panel-footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding-top: var(--space-xs);
		border-top: 1px solid var(--color-border);
	}

	.skaffu-list-panel :global(.inventory-list.skaffu-list) {
		border: none;
		border-radius: 0;
		background: transparent;
	}

	.skaffu-list-panel :global(.inventory-list.skaffu-list .mdc-deprecated-list),
	.skaffu-list-panel :global(.inventory-list.skaffu-list .mdc-deprecated-list-item) {
		overflow: visible;
	}

	.skaffu-list-panel :global(.inventory-list.skaffu-list) :global(.mdc-deprecated-list) {
		overflow: visible;
	}

	@media (max-width: 640px) {
		.skaffu-list-panel {
			padding: var(--space-sm);
		}

		.panel-footer {
			margin-inline: calc(-1 * var(--space-sm));
			padding-inline: var(--space-sm);
		}
	}
</style>
