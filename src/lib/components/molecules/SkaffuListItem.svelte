<script lang="ts">
	import { Item } from '@smui/list';
	import { skaffuSmuiClassNames } from '$lib/design/skaffu-smui-theme';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		'data-testid'?: string;
		activated?: boolean;
		selected?: boolean;
		disabled?: boolean;
		removing?: boolean;
		checkedRow?: boolean;
		children: Snippet;
	}

	let {
		class: className = '',
		'data-testid': dataTestId,
		activated = false,
		selected = false,
		disabled = false,
		removing = false,
		checkedRow = false,
		children
	}: Props = $props();

	const itemClass = $derived(
		[
			skaffuSmuiClassNames.listItem,
			'product-row',
			className,
			removing ? 'removing' : '',
			checkedRow ? 'checked-row' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<Item
	class={itemClass}
	data-testid={dataTestId}
	{activated}
	{selected}
	{disabled}
	wrapper
>
	{@render children()}
</Item>

<style>
	.skaffu-list-item :global(.mdc-deprecated-list-item__wrapper) {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		min-height: var(--touch-target-min);
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted));
		background: var(--color-surface);
		font-family: var(--font);
	}

	.skaffu-list-item:nth-child(even) :global(.mdc-deprecated-list-item__wrapper) {
		background: color-mix(in srgb, var(--color-surface-muted) 40%, var(--color-surface));
	}

	.skaffu-list-item:focus-within :global(.mdc-deprecated-list-item__wrapper) {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.skaffu-list-item:last-child :global(.mdc-deprecated-list-item__wrapper) {
		border-bottom: none;
	}

	.skaffu-list-item :global(.mdc-deprecated-list-item__primary-text),
	.skaffu-list-item :global(.mdc-deprecated-list-item__text) {
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--color-text);
	}

	.skaffu-list-item :global(.mdc-deprecated-list-item__secondary-text),
	.skaffu-list-item :global(.mdc-deprecated-list-item__meta) {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
