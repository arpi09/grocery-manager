<script lang="ts">
	import SkaffuList from '$lib/components/molecules/SkaffuList.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		class?: string;
		children: Snippet;
	}

	let { label, class: className = '', children }: Props = $props();
</script>

<div class="settings-group {className}">
	<h2 class="label-caps group-label">{label}</h2>
	<SkaffuList class="group-list">
		{@render children()}
	</SkaffuList>
</div>

<style>
	.settings-group {
		margin-bottom: var(--page-section-gap);
	}

	.settings-group:last-child {
		margin-bottom: 0;
	}

	.group-label {
		margin: 0 0 var(--space-xs);
		padding: 0 var(--space-xs);
		color: var(--color-text-muted);
		font-size: var(--font-size-label);
	}

	.settings-group :global(.group-list.skaffu-list .mdc-deprecated-list) {
		border-radius: var(--radius-lg);
	}
</style>
