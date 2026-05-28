<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		for?: string;
		children: Snippet;
	}

	let { for: htmlFor, children }: Props = $props();
</script>

<label class="label" for={htmlFor}>{@render children()}</label>

<style>
	.label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--space-xs);
	}
</style>
