<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		href?: string;
		interactive?: boolean;
		children: Snippet;
	}

	let { href, interactive = false, class: className = '', children, ...rest }: Props = $props();

	const tag = href ? 'a' : 'div';
</script>

<svelte:element
	this={tag}
	class="card {interactive ? 'card-interactive' : ''} {className}"
	{href}
	{...rest}
>
	{@render children()}
</svelte:element>

<style>
	.card {
		display: block;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md) var(--space-lg);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
		color: inherit;
	}

	.card-interactive:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
		transition:
			box-shadow 0.15s,
			transform 0.15s;
	}
</style>
