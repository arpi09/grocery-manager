<script lang="ts">
	import {
		buildPantryTileDetailPresentation,
		formatPantryTileQuantityLine
	} from '$lib/domain/pantry-shelf-presenter';
	import type { PantryTilePresentation } from '$lib/domain/pantry-shelf';
	import { t } from '$lib/i18n';

	interface Props {
		tile: PantryTilePresentation;
		href: string;
		variant?: 'item' | 'overflow';
		overflowLabel?: string;
		onNavigate?: () => void;
	}

	let { tile, href, variant = 'item', overflowLabel, onNavigate }: Props = $props();

	const detailPresentation = $derived(buildPantryTileDetailPresentation(tile));
	const quantityLine = $derived(formatPantryTileQuantityLine(tile));
	const detailLine = $derived.by(() => {
		if (variant === 'overflow' && overflowLabel) {
			return overflowLabel;
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

	const initial = $derived(tile.name.trim().charAt(0).toLocaleUpperCase() || '?');
</script>

<a
	class="product-tile"
	class:warn={tile.warn && variant === 'item'}
	class:overflow={variant === 'overflow'}
	{href}
	aria-label={ariaLabel}
	onclick={onNavigate}
	data-testid={variant === 'overflow' ? 'pantry-v2-overflow-tile' : 'pantry-v2-product-tile'}
>
	{#if variant === 'overflow'}
		<span class="tile-mark" aria-hidden="true">+</span>
	{:else}
		<span class="tile-mark" aria-hidden="true">{initial}</span>
	{/if}
	<span class="tile-name">{tile.name}</span>
	{#if detailLine}
		<span class="tile-detail">{detailLine}</span>
	{/if}
</a>

<style>
	.product-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-height: var(--touch-target-min);
		aspect-ratio: 1;
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		text-align: center;
		text-decoration: none;
		color: inherit;
	}

	.product-tile:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.product-tile.warn {
		border-color: color-mix(in srgb, var(--color-warning) 50%, var(--color-border));
		background: color-mix(in srgb, var(--color-warning) 8%, var(--color-surface));
	}

	.product-tile.warn::after {
		content: '';
		position: absolute;
		top: 6px;
		right: 6px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-warning);
	}

	.product-tile.overflow {
		color: var(--color-text-muted);
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

	.tile-name {
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1.2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tile-detail {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		line-height: 1.2;
	}
</style>
