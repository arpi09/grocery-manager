<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
	import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
	import ConsumeItemPanel from '$lib/components/molecules/ConsumeItemPanel.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
	import { daysUntilExpiry, formatExpiryDate, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		item: InventoryItem;
		canWrite?: boolean;
		finished?: boolean;
		autoExpired?: boolean;
	}

	let { item, canWrite = false, finished = false, autoExpired = false }: Props = $props();

	let menuOpen = $state(false);
	let consumeOpen = $state(false);

	function formatQuantityLine(item: InventoryItem, showRemaining: boolean) {
		const unitSuffix = item.unit ? ` ${item.unit}` : '';
		const amount = `${item.quantity}${unitSuffix}`.trim();
		if (!showRemaining) return amount;
		return t('inventory.quantityLeft', { amount });
	}

	const showRemainingLabel = $derived.by(() => {
		if (finished) return false;
		const stock = parseNumericQuantity(item.quantity);
		return stock !== null && stock > 0;
	});

	const quantityLine = $derived(formatQuantityLine(item, showRemainingLabel));

	function expiryTone(date: string) {
		const days = daysUntilExpiry(date);
		return days >= 0 && days <= EXPIRING_SOON_DAYS ? 'warning' : 'default';
	}

	function closeMenu() {
		menuOpen = false;
		consumeOpen = false;
	}

	$effect(() => {
		if (!menuOpen && !consumeOpen) return;

		function handlePointerDown(event: PointerEvent) {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest('.menu-wrap') || target.closest('.consume-panel')) return;
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

<article class="row" class:finished class:autoExpired={autoExpired}>
	<div class="content">
		<div class="primary-line">
			<a href="/item/{item.id}/edit" class="name">{item.name}</a>
			{#if canWrite}
				<div class="menu-wrap">
					<button
						type="button"
						class="menu-trigger"
						aria-label={t('inventory.itemActionsNamed', { name: item.name })}
						aria-expanded={menuOpen}
						aria-haspopup="menu"
						onclick={(event) => {
							event.stopPropagation();
							menuOpen = !menuOpen;
						}}
					>
						<span aria-hidden="true">⋯</span>
					</button>
					{#if menuOpen}
						<div class="menu-panel">
							<a class="menu-item" href="/item/{item.id}/edit" onclick={closeMenu}>
								{t('inventory.editItem')}
							</a>
							{#if !finished}
								<button
									type="button"
									class="menu-item menu-consume"
									onclick={(event) => {
										event.stopPropagation();
										consumeOpen = true;
										menuOpen = true;
									}}
								>
									{t('consume.logUsage')}
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="meta-line">
			<span class="quantity">{quantityLine}</span>
			<div class="badges">
				{#if finished}
					<Badge tone="default">{t('inventory.finishedBadge')}</Badge>
				{:else if autoExpired}
					<Badge tone="warning">{t('inventory.autoExpiredBadge')}</Badge>
				{/if}
				{#if item.expiresOn && !finished}
					<Badge tone={autoExpired ? 'default' : expiryTone(item.expiresOn)}>
						{formatExpiryDate(item.expiresOn, getLocale())}
					</Badge>
					{#if isEstimatedExpirySource(item.expiresOnSource) && !autoExpired}
						<EstimatedBadge source={item.expiresOnSource} />
					{/if}
				{/if}
			</div>
		</div>

		{#if item.notes}
			<p class="notes" title={item.notes}>{item.notes}</p>
		{/if}

		{#if canWrite && consumeOpen && !finished}
			<div class="consume-overlay">
				<ConsumeItemPanel
					{item}
					action="/item/{item.id}/edit?/markAsFinished"
					onClose={closeMenu}
				/>
			</div>
		{/if}
	</div>
</article>

<style>
	.row {
		padding: var(--space-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
	}

	.row.finished {
		border-style: dashed;
		box-shadow: none;
		background: color-mix(in srgb, var(--color-surface-muted) 45%, var(--color-surface));
	}

	.row.autoExpired {
		border-color: color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-warning) 6%, var(--color-surface));
	}

	.content {
		min-width: 0;
	}

	.primary-line {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.name {
		font-weight: 600;
		font-size: 1rem;
		line-height: 1.35;
		color: var(--color-text);
		text-decoration: none;
		min-width: 0;
	}

	.name:hover {
		color: var(--color-primary);
	}

	.meta-line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-xs) var(--space-sm);
		margin-top: var(--space-xs);
	}

	.quantity {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
		justify-content: flex-end;
		min-width: 0;
	}

	.notes {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		word-break: break-word;
	}

	.menu-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.menu-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
	}

	.menu-trigger:hover,
	.menu-trigger[aria-expanded='true'] {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.menu-panel {
		position: absolute;
		top: calc(100% + 0.25rem);
		right: 0;
		z-index: 20;
		min-width: 11rem;
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
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
	}

	.menu-item:hover {
		background: var(--color-surface-muted);
		color: var(--color-primary);
		text-decoration: none;
	}

	.menu-consume {
		width: 100%;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
	}

	.consume-overlay {
		margin-top: var(--space-sm);
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}
</style>
