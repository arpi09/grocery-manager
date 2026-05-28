<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		error?: boolean;
	}

	let {
		error = false,
		class: className = '',
		value = $bindable(''),
		...rest
	}: Props = $props();
</script>

<input class="input {error ? 'input-error' : ''} {className}" bind:value {...rest} />

<style>
	.input {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
		border-color: var(--color-primary);
	}

	.input-error {
		border-color: var(--color-danger);
	}
</style>
