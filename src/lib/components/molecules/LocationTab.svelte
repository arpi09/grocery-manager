<script lang="ts">
	import { LOCATIONS, LOCATION_LABELS, type StorageLocation } from '$lib/domain/location';

	interface Props {
		active: StorageLocation;
	}

	let { active }: Props = $props();
</script>

<nav class="tabs" aria-label="Storage locations">
	{#each LOCATIONS as location}
		<a
			href="/inventory/{location}"
			class="tab"
			class:active={location === active}
			aria-current={location === active ? 'page' : undefined}
		>
			{LOCATION_LABELS[location]}
		</a>
	{/each}
</nav>

<style>
	.tabs {
		display: flex;
		gap: var(--space-xs);
		padding: var(--space-xs);
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
	}

	.tab {
		flex: 1;
		text-align: center;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.tab.active {
		background: var(--color-surface);
		color: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}
</style>
