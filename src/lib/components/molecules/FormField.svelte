<script lang="ts">
	import Label from '$lib/components/atoms/Label.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label: string;
		error?: string;
	}

	let { label, error, id, name, ...rest }: Props = $props();
	const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-');
</script>

<div class="field">
	<Label for={fieldId}>{label}</Label>
	<Input id={fieldId} {name} error={!!error} {...rest} />
	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.field {
		margin-bottom: var(--space-md);
	}

	.error {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-danger);
	}
</style>
