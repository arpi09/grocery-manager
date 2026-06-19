<script lang="ts">
	import ShoppingChecklistDataGrid from '$lib/components/organisms/ShoppingChecklistDataGrid.svelte';
	import ShoppingListShareMenu from '$lib/components/molecules/ShoppingListShareMenu.svelte';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import type { ShoppingToPantryMode } from '$lib/domain/shopping-to-pantry';
	import { t } from '$lib/i18n';
	import {
		focusInitialElement,
		restoreFocus,
		saveFocus,
		trapFocus
	} from '$lib/utils/modal-a11y';

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

	let drawerEl = $state<HTMLElement | null>(null);

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			onClose();
		}
	}

	$effect(() => {
		if (!open) {
			return;
		}
		saveFocus();
		return () => {
			restoreFocus();
		};
	});

	$effect(() => {
		if (!open || !drawerEl) {
			return;
		}
		const releaseTrap = trapFocus(drawerEl);
		const frame = requestAnimationFrame(() => {
			if (drawerEl) {
				focusInitialElement(drawerEl);
			}
		});
		return () => {
			cancelAnimationFrame(frame);
			releaseTrap();
		};
	});
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
	<div
		bind:this={drawerEl}
		class="legacy-drawer"
		role="dialog"
		aria-modal="true"
		aria-label={t('shopping.v2.overflow.legacyList')}
		data-testid="shopping-v2-legacy-drawer"
	>
		<header class="drawer-header">
			<button type="button" class="back-link" onclick={onClose}>
				{t('dataGrid.backToPlan')}
			</button>
			<div class="header-actions">
				<ShoppingListShareMenu
					uncheckedItems={items}
					{checkedCount}
					{canEdit}
					{shareLinkEnabled}
					{memberCount}
				/>
				<button type="button" class="close" onclick={onClose} aria-label={t('common.close')}>
					×
				</button>
			</div>
		</header>

		<ShoppingChecklistDataGrid
			uncheckedItems={items}
			{checkedCount}
			{canEdit}
			{shoppingToPantryMode}
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
		min-width: 0;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-width: 0;
	}

	.back-link {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 650;
		color: var(--color-primary);
		cursor: pointer;
		min-height: var(--touch-target-min);
		text-align: left;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
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
