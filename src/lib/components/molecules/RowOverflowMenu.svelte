<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		itemId: string;
		itemName: string;
		disabled?: boolean;
		onPartialConsume?: () => void;
		onFinishOneTap?: () => void;
		finishing?: boolean;
	}

	let { itemId, itemName, disabled = false, onPartialConsume, onFinishOneTap, finishing = false }: Props = $props();

	let menuOpen = $state(false);

	function closeMenu() {
		menuOpen = false;
	}

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		menuOpen = !menuOpen;
	}

	$effect(() => {
		if (!menuOpen) return;

		function handlePointerDown(event: PointerEvent) {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest('.menu-wrap')) return;
			closeMenu();
		}

		const id = window.setTimeout(() => {
			window.addEventListener('pointerdown', handlePointerDown);
		}, 0);

		return () => {
			window.clearTimeout(id);
			window.removeEventListener('pointerdown', handlePointerDown);
		};
	});
</script>

<div class="menu-wrap" data-testid="row-overflow-menu">
	<button
		type="button"
		class="menu-trigger"
		aria-label={t('inventory.itemActionsNamed', { name: itemName })}
		aria-expanded={menuOpen}
		aria-haspopup="menu"
		disabled={disabled}
		onclick={toggleMenu}
	>
		<span aria-hidden="true">⋯</span>
	</button>

	{#if menuOpen}
		<div class="menu-panel" role="menu">
			<a class="menu-item" role="menuitem" href="/item/{itemId}/edit" onclick={closeMenu}>
				{t('inventory.editItem')}
			</a>
			{#if onFinishOneTap}
				<button
					type="button"
					class="menu-item menu-action"
					role="menuitem"
					disabled={disabled || finishing}
					onclick={() => {
						closeMenu();
						onFinishOneTap();
					}}
				>
					{t('consume.finish')}
				</button>
			{/if}
			{#if onPartialConsume}
				<button
					type="button"
					class="menu-item menu-action"
					role="menuitem"
					disabled={disabled}
					onclick={() => {
						closeMenu();
						onPartialConsume();
					}}
				>
					{t('consume.partial')}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.menu-wrap {
		position: relative;
		display: inline-flex;
	}

	.menu-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
	}

	.menu-trigger:hover:not(:disabled),
	.menu-trigger[aria-expanded='true'] {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.menu-trigger:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.menu-panel {
		position: absolute;
		top: calc(100% + 0.25rem);
		right: 0;
		z-index: calc(var(--z-nav-bottom) + 2);
		min-width: 11rem;
		padding: var(--space-xs);
		padding-bottom: calc(var(--space-xs) + env(safe-area-inset-bottom, 0));
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 0.5rem 0.6rem;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
		text-align: left;
	}

	.menu-item:hover:not(:disabled) {
		background: var(--color-surface-muted);
		color: var(--color-primary);
		text-decoration: none;
	}

	.menu-action {
		border: none;
		background: transparent;
		cursor: pointer;
		font-family: inherit;
	}

	.menu-action:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
