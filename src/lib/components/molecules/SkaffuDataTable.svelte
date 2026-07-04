<script lang="ts">
	import { browser } from '$app/environment';
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

	let rootEl = $state<HTMLDivElement | null>(null);

	const MOBILE_LIST_MQ = '(max-width: 640px)';

	function syncMobileListSemantics(node: HTMLDivElement) {
		const tbody = node.querySelector('tbody');
		if (!tbody) return;

		const isMobile = browser && window.matchMedia(MOBILE_LIST_MQ).matches;
		const rows = tbody.querySelectorAll<HTMLElement>('.mdc-data-table__row');

		if (isMobile) {
			tbody.setAttribute('role', 'list');
			for (const row of rows) {
				row.setAttribute('role', 'listitem');
			}
		} else {
			tbody.removeAttribute('role');
			for (const row of rows) {
				row.removeAttribute('role');
			}
		}
	}

	$effect(() => {
		if (!browser || !rootEl) return;

		syncMobileListSemantics(rootEl);

		const mq = window.matchMedia(MOBILE_LIST_MQ);
		const onMqChange = () => syncMobileListSemantics(rootEl!);
		mq.addEventListener('change', onMqChange);

		const tbody = rootEl.querySelector('tbody');
		const observer = tbody
			? new MutationObserver(() => syncMobileListSemantics(rootEl!))
			: null;
		if (tbody && observer) {
			observer.observe(tbody, { childList: true });
		}

		return () => {
			mq.removeEventListener('change', onMqChange);
			observer?.disconnect();
		};
	});
</script>

<div
	bind:this={rootEl}
	class="{skaffuSmuiClassNames.table} {className}"
	data-testid={dataTestId}
>
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
	.skaffu-table {
		min-width: 0;
		max-width: 100%;
	}

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

	/* table-layout: fixed resolves width: 1% to ~10px and MDC's overflow: hidden
	   clips the cell content — narrow columns need real widths (content + padding). */
	.skaffu-table :global(.col-checkbox),
	.skaffu-table :global(.col-checkoff) {
		padding-inline: var(--space-sm);
		text-align: center;
		vertical-align: middle;
	}

	.skaffu-table :global(.col-checkbox) {
		width: calc(1.75rem + 2 * var(--space-sm));
	}

	.skaffu-table :global(.col-checkoff) {
		width: calc(var(--touch-target-min) + 2 * var(--space-sm));
	}

	.skaffu-table :global(.col-thumb) {
		width: calc(1.75rem + 2 * var(--space-sm));
		padding-inline: var(--space-sm);
		vertical-align: middle;
	}

	.skaffu-table :global(.col-name) {
		width: auto;
		min-width: 0;
	}

	.skaffu-table :global(.col-qty) {
		width: 8.5rem;
		white-space: nowrap;
	}

	.skaffu-table :global(.col-expiry) {
		width: 8.5rem;
		white-space: nowrap;
	}

	.skaffu-table :global(.col-actions) {
		width: 8.5rem;
		padding-inline: var(--space-xs);
		text-align: right;
		vertical-align: middle;
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

	@media (max-width: 640px) {
		.skaffu-table {
			overflow-x: clip;
		}

		.skaffu-table :global(.mdc-data-table),
		.skaffu-table :global(.mdc-data-table__table-container) {
			overflow-x: clip;
		}

		.skaffu-table :global(.mdc-data-table) {
			overflow-y: visible;
			border: none;
			background: transparent;
		}

		.skaffu-table :global(.mdc-data-table__table),
		.skaffu-table :global(.mdc-data-table__content) {
			display: block;
			width: 100%;
		}

		.skaffu-table :global(thead) {
			display: none;
		}

		.skaffu-table :global(tbody) {
			display: flex;
			flex-direction: column;
			gap: 0;
		}

		.skaffu-table :global(.mdc-data-table__row) {
			display: flex;
			flex-wrap: nowrap;
			align-items: center;
			gap: var(--space-xs);
			width: 100%;
			box-sizing: border-box;
			min-width: 0;
			min-height: var(--touch-target-min);
			padding: var(--space-sm) var(--space-md);
			background: var(--color-surface);
			border-bottom: 1px solid
				color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted));
		}

		.skaffu-table :global(.mdc-data-table__row:last-child) {
			border-bottom: none;
		}

		.skaffu-table :global(.mdc-data-table__cell) {
			display: block;
			border: none;
			padding: 0;
			min-height: auto;
		}

		.skaffu-table :global(.mdc-data-table__cell[colspan]) {
			flex: 1 1 100%;
			width: 100%;
			padding: var(--space-sm);
			text-align: center;
		}

		.skaffu-table :global(.col-checkbox),
		.skaffu-table :global(.col-checkoff),
		.skaffu-table :global(.col-thumb),
		.skaffu-table :global(.col-location),
		.skaffu-table :global(.col-actions) {
			flex: 0 0 auto;
			width: auto;
			padding-inline: 0;
		}

		.skaffu-table :global(.col-name) {
			flex: 1 1 0;
			min-width: 0;
			overflow: hidden;
		}

		.skaffu-table :global(.col-actions),
		.skaffu-table :global(.col-checkoff) {
			flex: 0 0 auto;
			margin-inline-start: auto;
		}

		.skaffu-table :global(.col-qty),
		.skaffu-table :global(.col-expiry) {
			display: none;
		}
	}
</style>
