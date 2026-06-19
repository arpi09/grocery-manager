<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Snippet } from 'svelte';

	interface Props {
		selectedCount: number;
		actions?: Snippet;
	}

	let { selectedCount, actions }: Props = $props();

	const visible = $derived(selectedCount > 0);
</script>

{#if visible}
	<div class="data-grid-bulk-bar" role="status" data-testid="data-grid-bulk-bar">
		<p class="selection-label">{t('dataGrid.selectedCount', { count: selectedCount })}</p>
		{#if actions}
			<div class="bulk-actions">
				{@render actions()}
			</div>
		{/if}
	</div>
{/if}

<style>
	.data-grid-bulk-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.selection-label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.bulk-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}
</style>
