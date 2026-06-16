<script lang="ts">
	import List from '@smui/list';
	import { skaffuSmuiClassNames } from '$lib/design/skaffu-smui-theme';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		'data-testid'?: string;
		children: Snippet;
	}

	let { class: className = '', 'data-testid': dataTestId, children }: Props = $props();
</script>

<div class="{skaffuSmuiClassNames.list} {className}" data-testid={dataTestId}>
	<List nonInteractive>
		{@render children()}
	</List>
</div>

<style>
	.skaffu-list :global(.mdc-deprecated-list) {
		margin: 0;
		padding: 0;
		font-family: var(--font);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.skaffu-list :global(.mdc-deprecated-list-item) {
		min-height: var(--touch-target-min);
		padding: 0;
		margin: 0;
	}
</style>
