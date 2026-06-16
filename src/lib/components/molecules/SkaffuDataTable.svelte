<script lang="ts">
	import DataTable from '@smui/data-table';
	import { skaffuSmuiClassNames } from '$lib/design/skaffu-smui-theme';
	import type { Snippet } from 'svelte';

	interface Props {
		ariaLabel: string;
		stickyHeader?: boolean;
		class?: string;
		'data-testid'?: string;
		head?: Snippet;
		body?: Snippet;
	}

	let {
		ariaLabel,
		stickyHeader = false,
		class: className = '',
		'data-testid': dataTestId,
		head,
		body
	}: Props = $props();
</script>

<div class="{skaffuSmuiClassNames.table} {className}" data-testid={dataTestId}>
	<DataTable {stickyHeader} aria-label={ariaLabel}>
		{#if head}
			{@render head()}
		{/if}
		{#if body}
			{@render body()}
		{/if}
	</DataTable>
</div>

<style>
	.skaffu-table :global(.mdc-data-table) {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font-family: var(--font);
	}

	.skaffu-table :global(.mdc-data-table__table) {
		width: 100%;
		table-layout: fixed;
		border-collapse: collapse;
	}

	.skaffu-table :global(.col-name) {
		width: auto;
	}

	.skaffu-table :global(.col-qty),
	.skaffu-table :global(.col-expiry) {
		width: 1%;
		white-space: nowrap;
	}

	.skaffu-table :global(.mdc-data-table__header-cell) {
		padding: var(--space-sm) var(--space-md);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		background: var(--color-surface-muted);
		border-bottom: 1px solid var(--color-border);
	}

	.skaffu-table :global(.mdc-data-table__cell) {
		padding: var(--space-sm) var(--space-md);
		min-height: var(--touch-target-min);
		font-size: 0.875rem;
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	.skaffu-table :global(.mdc-data-table__row:last-child .mdc-data-table__cell) {
		border-bottom: none;
	}

	.skaffu-table :global(.mdc-data-table__row:hover) {
		background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
	}
</style>
