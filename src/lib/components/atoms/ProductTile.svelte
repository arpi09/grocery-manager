<script lang="ts">
	import ProductAvatar from '$lib/components/atoms/ProductAvatar.svelte';
	import {
		buildPantryTileDetailPresentation,
		formatPantryTileQuantityLine,
		pantryZoneTitleKey
	} from '$lib/domain/pantry-shelf-presenter';
	import type { PantryTilePresentation } from '$lib/domain/pantry-shelf';
	import { formatExpiryDate } from '$lib/domain/expiry';
	import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
	import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
	import { getLocale, t } from '$lib/i18n';
	import type { StorageLocation } from '$lib/domain/location';

	interface Props {
		tile: PantryTilePresentation;
		href: string;
		variant?: 'item' | 'overflow';
		overflowLabel?: string;
		onNavigate?: () => void;
		canConsume?: boolean;
		onConsume?: () => void;
		zoneLocation?: StorageLocation;
	}

	let {
		tile,
		href,
		variant = 'item',
		overflowLabel,
		onNavigate,
		canConsume = false,
		onConsume,
		zoneLocation
	}: Props = $props();

	let menuOpen = $state(false);

	const detailPresentation = $derived(buildPantryTileDetailPresentation(tile));
	const quantityLine = $derived(formatPantryTileQuantityLine(tile));
	const detailLine = $derived.by(() => {
		if (variant === 'overflow' && overflowLabel) {
			return overflowLabel;
		}
		if (tile.detailKind === 'expires_date' && tile.expiresOn) {
			return formatExpiryDate(tile.expiresOn, getLocale());
		}
		if (detailPresentation) {
			return t(detailPresentation.key, detailPresentation.params);
		}
		return quantityLine;
	});

	const ariaLabel = $derived.by(() => {
		if (variant === 'overflow') {
			return overflowLabel ?? tile.name;
		}
		if (tile.warn) {
			return t('pantry.v2.tile.warnAria', { name: tile.name });
		}
		if (detailLine) {
			return t('pantry.v2.tile.aria', { name: tile.name, quantity: detailLine });
		}
		return tile.name;
	});

	const zoneHref = $derived(zoneLocation ? `/inventory/${zoneLocation}` : null);
	const zoneTitle = $derived(
		zoneLocation ? t(pantryZoneTitleKey(zoneLocation)) : ''
	);

	function closeMenu() {
		menuOpen = false;
	}

	$effect(() => {
		if (!menuOpen) return;

		function handlePointerDown(event: PointerEvent) {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest('.tile-menu-wrap')) return;
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

{#if variant === 'overflow'}
	<a
		class="product-tile overflow"
		{href}
		aria-label={ariaLabel}
		onclick={onNavigate}
		data-testid="pantry-v2-overflow-tile"
	>
		<span class="tile-mark" aria-hidden="true">+</span>
		<span class="tile-name">{tile.name}</span>
		{#if detailLine}
			<span class="tile-detail">{detailLine}</span>
		{/if}
	</a>
{:else}
	<article
		class="product-tile"
		class:warn={tile.warn}
		data-testid="pantry-v2-product-tile"
	>
		<a
			class="tile-body"
			{href}
			aria-label={ariaLabel}
			onclick={onNavigate}
			data-testid="pantry-v2-tile-body"
		>
			<ProductAvatar name={tile.name} warn={tile.warn} size="sm" decorative />
			<span class="tile-name">{tile.name}</span>
			{#if tile.expiresOnSource && isEstimatedExpirySource(tile.expiresOnSource)}
				<EstimatedBadge source={tile.expiresOnSource} interactive={false} />
			{/if}
			{#if detailLine}
				<span class="tile-detail" class:missing-expiry-detail={tile.detailKind === 'missing_expiry'}>
					{detailLine}
				</span>
			{/if}
		</a>
		<div class="tile-actions">
			{#if canConsume && onConsume}
				<button
					type="button"
					class="tile-use"
					aria-label={t('pantry.v2.tile.useAria', { name: tile.name })}
					data-testid="pantry-v2-tile-use"
					onclick={(event) => {
						event.stopPropagation();
						closeMenu();
						onConsume();
					}}
				>
					<span class="tile-use-label">{t('pantry.v2.tile.use')}</span>
				</button>
			{/if}
			<div class="tile-menu-wrap">
				<button
					type="button"
					class="tile-menu"
					aria-label={t('inventory.itemActionsNamed', { name: tile.name })}
					aria-expanded={menuOpen}
					aria-haspopup="menu"
					data-testid="pantry-v2-tile-menu"
					onclick={(event) => {
						event.stopPropagation();
						menuOpen = !menuOpen;
					}}
				>
					<span aria-hidden="true">⋮</span>
				</button>
				{#if menuOpen}
					<div class="menu-panel" role="menu">
						<a class="menu-item" href={href} role="menuitem" onclick={closeMenu}>
							{t('inventory.editItem')}
						</a>
						{#if zoneHref}
							<a class="menu-item" href={zoneHref} role="menuitem" onclick={closeMenu}>
								{t('pantry.v2.tile.viewInZone', { zone: zoneTitle })}
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</article>
{/if}

<style>
	.product-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 4.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		text-align: center;
		color: inherit;
		overflow: visible;
	}

	.product-tile.overflow {
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: var(--space-sm);
		text-decoration: none;
		color: var(--color-text-muted);
	}

	.product-tile.warn {
		border-color: color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-warning) 6%, var(--color-surface));
	}

	.tile-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 0.125rem;
		min-width: 0;
		padding: var(--space-xs) var(--space-xs) 0;
		text-decoration: none;
		color: inherit;
	}

	.tile-body:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
		border-radius: var(--radius-md) var(--radius-md) 0 0;
	}

	.tile-mark {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		font-size: 0.875rem;
		font-weight: 700;
		line-height: 1;
	}

	.tile-body :global(.product-avatar) {
		margin-bottom: 0;
	}

	.tile-name {
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1.2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: anywhere;
		width: 100%;
	}

	.product-tile:not(.overflow) .tile-name {
		min-height: calc(2 * 1.2em);
	}

	.tile-detail {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.625rem;
		color: var(--color-text-muted);
		line-height: 1.2;
	}

	.product-tile.warn .tile-detail {
		color: color-mix(in srgb, var(--color-warning) 35%, var(--color-text));
		font-weight: 600;
	}

	.product-tile:not(.warn) .tile-detail.missing-expiry-detail {
		color: var(--color-text-muted);
	}

	.tile-actions {
		display: flex;
		align-items: stretch;
		justify-content: center;
		gap: var(--space-xs);
		width: 100%;
		padding: 0 var(--space-xs) var(--space-xs);
	}

	.tile-use,
	.tile-menu {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		min-height: 2rem;
		padding: 0 0.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		color: var(--color-text);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.625rem;
		font-weight: 700;
		line-height: 1;
	}

	.tile-use {
		flex: 1;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
	}

	.tile-menu {
		flex-shrink: 0;
		width: 2rem;
		padding: 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.tile-use:hover,
	.tile-menu:hover,
	.tile-menu[aria-expanded='true'] {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.tile-use:focus-visible,
	.tile-menu:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}

	@media (max-width: 360px) {
		.tile-use-label {
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

		.tile-use::before {
			content: '−';
			font-size: 0.875rem;
			font-weight: 700;
		}
	}

	.tile-menu-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.menu-panel {
		position: absolute;
		bottom: calc(100% + 0.25rem);
		right: 0;
		z-index: 30;
		min-width: 10rem;
		padding: var(--space-xs);
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
