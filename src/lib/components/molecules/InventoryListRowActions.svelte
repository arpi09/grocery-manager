<script lang="ts">
	import { tick } from 'svelte';
	import { portal } from '$lib/actions/portal';
	import { pantryZoneTitleKey } from '$lib/domain/pantry-shelf-presenter';
	import type { StorageLocation } from '$lib/domain/location';
	import { t } from '$lib/i18n';

	interface Props {
		itemId: string;
		itemName: string;
		editHref: string;
		canConsume?: boolean;
		itemLocation?: StorageLocation;
		showViewInZone?: boolean;
		menuOpen?: boolean;
		onConsume?: () => void;
		onMenuToggle?: () => void;
		onMenuClose?: () => void;
	}

	let {
		itemId,
		itemName,
		editHref,
		canConsume = false,
		itemLocation,
		showViewInZone = false,
		menuOpen = false,
		onConsume,
		onMenuToggle,
		onMenuClose
	}: Props = $props();

	let triggerEl = $state<HTMLButtonElement | null>(null);
	let panelStyle = $state('');

	const zoneHref = $derived(
		showViewInZone && itemLocation ? `/inventory/${itemLocation}` : null
	);
	const zoneTitle = $derived(
		itemLocation ? t(pantryZoneTitleKey(itemLocation)) : ''
	);

	async function positionPanel() {
		await tick();
		if (!triggerEl) return;

		const rect = triggerEl.getBoundingClientRect();
		const panelWidth = 10 * 16;
		const margin = 8;
		let left = rect.right - panelWidth;
		if (left < margin) left = margin;
		if (left + panelWidth > window.innerWidth - margin) {
			left = window.innerWidth - panelWidth - margin;
		}

		const top = Math.max(margin, rect.bottom + 4);
		panelStyle = `top: ${top}px; left: ${left}px;`;
	}

	$effect(() => {
		if (menuOpen) {
			void positionPanel();
		}
	});
</script>

<div class="row-actions" data-inventory-row-menu-root onclick={(event) => event.stopPropagation()}>
	{#if canConsume && onConsume}
		<button
			type="button"
			class="row-use"
			aria-label={t('pantry.v2.tile.useAria', { name: itemName })}
			data-testid="inventory-row-use-{itemId}"
			onclick={(event) => {
				event.stopPropagation();
				onMenuClose?.();
				onConsume();
			}}
		>
			<span class="row-use-label">{t('pantry.v2.tile.use')}</span>
		</button>
	{/if}
	<div class="row-menu-wrap" data-inventory-row-menu-root>
		<button
			type="button"
			class="row-menu"
			bind:this={triggerEl}
			aria-label={t('inventory.itemActionsNamed', { name: itemName })}
			aria-expanded={menuOpen}
			aria-haspopup="menu"
			data-testid="inventory-row-menu-{itemId}"
			data-inventory-row-menu-root
			onclick={(event) => {
				event.stopPropagation();
				onMenuToggle?.();
			}}
		>
			<span aria-hidden="true">⋮</span>
		</button>
		{#if menuOpen}
			<div
				class="menu-panel"
				role="menu"
				style={panelStyle}
				data-inventory-row-menu-root
				use:portal={'body'}
			>
				<a class="menu-item" href={editHref} role="menuitem" onclick={() => onMenuClose?.()}>
					{t('inventory.editItem')}
				</a>
				{#if zoneHref}
					<a class="menu-item" href={zoneHref} role="menuitem" onclick={() => onMenuClose?.()}>
						{t('pantry.v2.tile.viewInZone', { zone: zoneTitle })}
					</a>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.row-actions {
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.125rem;
		min-width: 0;
		max-width: 100%;
	}

	.row-use,
	.row-menu {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: 1.75rem;
		padding: 0 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		color: var(--color-text);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
	}

	.row-use {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
	}

	.row-menu {
		flex-shrink: 0;
		width: 1.75rem;
		padding: 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.row-use:hover,
	.row-menu:hover,
	.row-menu[aria-expanded='true'] {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.row-use:focus-visible,
	.row-menu:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}

	@media (max-width: 640px) {
		.row-use,
		.row-menu {
			min-width: 1.75rem;
			min-height: 1.75rem;
		}
	}

	@media (max-width: 360px) {
		.row-use-label {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		.row-use::before {
			content: '−';
			font-size: 0.875rem;
			font-weight: 700;
		}
	}

	.row-menu-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.menu-panel {
		position: fixed;
		z-index: calc(var(--z-nav-bottom) + 12);
		min-width: 10rem;
		padding: var(--space-xs);
		padding-bottom: calc(var(--space-xs) + env(safe-area-inset-bottom, 0));
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
	}

	.menu-item {
		display: block;
		padding: 0.55rem 0.65rem;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
		white-space: nowrap;
	}

	.menu-item:hover {
		background: var(--color-surface-muted);
		color: var(--color-primary);
		text-decoration: none;
	}
</style>
