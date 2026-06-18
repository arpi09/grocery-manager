<script lang="ts">
	import ShoppingListPanel from '$lib/components/organisms/ShoppingListPanel.svelte';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		items: ShoppingListItem[];
		checkedCount: number;
		canEdit: boolean;
		shareLinkEnabled: boolean;
		shoppingToPantryMode: ShoppingToPantryMode;
		memberCount: number;
		onClose: () => void;
	}

	let {
		open,
		items,
		checkedCount,
		canEdit,
		shareLinkEnabled,
		shoppingToPantryMode,
		memberCount,
		onClose
	}: Props = $props();
</script>

{#if open}
	<div class="legacy-drawer" data-testid="shopping-v2-legacy-drawer">
		<header class="drawer-header">
			<h2>{t('shopping.v2.overflow.legacyList')}</h2>
			<button type="button" class="close" onclick={onClose} aria-label={t('common.close')}>
				×
			</button>
		</header>
		<ShoppingListPanel
			id="shopping-list-panel"
			tabindex={-1}
			{items}
			{checkedCount}
			{canEdit}
			{shareLinkEnabled}
			{shoppingToPantryMode}
			{memberCount}
		/>
	</div>
{/if}

<style>
	.legacy-drawer {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.drawer-header h2 {
		margin: 0;
		font-size: 1rem;
	}

	.close {
		border: none;
		background: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		color: var(--color-text-muted);
	}
</style>
