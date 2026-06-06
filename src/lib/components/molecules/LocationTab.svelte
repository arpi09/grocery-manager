<script lang="ts">
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { t, type MessageKey } from '$lib/i18n';

	interface Props {
		active: StorageLocation;
	}

	let { active }: Props = $props();

	const tabKeys: Record<StorageLocation, MessageKey> = {
		fridge: 'location.fridgeShort',
		freezer: 'location.freezerShort',
		cupboard: 'location.cupboardShort'
	};
</script>

<nav class="tabs" aria-label={t('inventory.tabsAria')}>
	{#each LOCATIONS as location}
		<a
			href="/inventory/{location}"
			class="tab"
			class:active={location === active}
			aria-current={location === active ? 'page' : undefined}
		>
			{t(tabKeys[location])}
		</a>
	{/each}
</nav>

<style>
	.tabs {
		display: flex;
		gap: 2px;
		padding: 3px;
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.tab {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		text-align: center;
		padding: 0.45rem 0.5rem;
		border-radius: calc(var(--radius-md) - 3px);
		font-weight: 600;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		text-decoration: none;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.tab:hover {
		color: var(--color-text);
		text-decoration: none;
	}

	.tab.active {
		background: var(--color-surface);
		color: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}

	@media (min-width: 480px) {
		.tab {
			font-size: 0.875rem;
			padding: 0.5rem 0.75rem;
		}
	}
</style>
