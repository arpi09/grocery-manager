<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
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

	function formatQuantityCell(item: InventoryItem, showRemaining: boolean) {
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

	const quantityCell = $derived(formatQuantityCell(item, showRemainingLabel));

	function expiryTone(date: string) {
		const days = daysUntilExpiry(date);
		return days >= 0 && days <= EXPIRING_SOON_DAYS ? 'warning' : 'default';
	}

	function closeMenu() {
		menuOpen = false;
		consumeOpen = false;
	}

	const expiryLabel = $derived(
		item.expiresOn && !finished ? formatExpiryDate(item.expiresOn, getLocale()) : null
	);

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

<tr class="data-row" class:finished class:autoExpired={autoExpired}>
	<td class="col-name">
		<a href="/item/{item.id}/edit" class="name">{item.name}</a>
		{#if canWrite && !finished}
			<button
				type="button"
				class="mobile-log-usage"
				onclick={(event) => {
					event.stopPropagation();
					consumeOpen = true;
					menuOpen = false;
				}}
			>
				{t('consume.logUsage')}
			</button>
		{/if}
		{#if item.notes}
			<p class="notes" title={item.notes}>{item.notes}</p>
		{/if}
		<div class="row-badges">
			{#if finished}
				<Badge tone="default">{t('inventory.finishedBadge')}</Badge>
			{:else if autoExpired}
				<Badge tone="warning">{t('inventory.autoExpiredBadge')}</Badge>
			{/if}
			{#if item.expiresOnSource === 'ai_inferred' && item.expiresOn && !finished && !autoExpired}
				<Badge tone="default">{t('inventory.aiExpiryBadge')}</Badge>
			{/if}
		</div>
	</td>
	<td class="col-qty" data-label={t('inventory.columnQuantity')}>
		<span class="qty">{quantityCell}</span>
	</td>
	<td class="col-expiry" data-label={t('inventory.columnExpiry')}>
		{#if expiryLabel}
			<Badge tone={autoExpired ? 'default' : expiryTone(item.expiresOn!)}>
				{expiryLabel}
			</Badge>
		{:else}
			<span class="muted">—</span>
		{/if}
	</td>
	<td class="col-actions">
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
	</td>
</tr>
{#if canWrite && consumeOpen && !finished}
	<tr class="detail-row">
		<td colspan="4">
			<ConsumeItemPanel
				{item}
				action="/item/{item.id}/edit?/markAsFinished"
				onClose={closeMenu}
			/>
		</td>
	</tr>
{/if}

<style>
	.data-row {
		transition: background-color 0.12s ease;
	}

	.data-row.finished {
		opacity: 0.78;
	}

	.data-row.autoExpired {
		background: color-mix(in srgb, var(--color-warning) 5%, transparent);
	}

	.data-row td {
		padding: 0.4rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	.col-name {
		min-width: 8rem;
		max-width: 1px;
		width: 42%;
	}

	.name {
		display: inline-block;
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.35;
		color: var(--color-text);
		text-decoration: none;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name:hover {
		color: var(--color-primary);
	}

	.mobile-log-usage {
		display: none;
		margin-top: 0.35rem;
		padding: 0.35rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		font-family: inherit;
	}

	.notes {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.35;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		margin-top: 0.2rem;
	}

	.col-qty {
		width: 18%;
		white-space: nowrap;
	}

	.qty {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.col-expiry {
		width: 22%;
		white-space: nowrap;
	}

	.muted {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.col-actions {
		width: 2.75rem;
		text-align: right;
	}

	.menu-wrap {
		position: relative;
		display: inline-flex;
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
		background: var(--color-surface);
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
		padding: 0.5rem 0.6rem;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
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

	.detail-row td {
		padding: 0 0.5rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface-muted) 55%, transparent);
	}

	@media (max-width: 559px) {
		.data-row {
			display: block;
			border-bottom: 1px solid var(--color-border);
		}

		.data-row:hover {
			background: transparent;
		}

		.data-row td {
			display: grid;
			grid-template-columns: minmax(5rem, 34%) 1fr;
			gap: 0.25rem 0.5rem;
			padding: 0.35rem 0.5rem;
			border-bottom: none;
		}

		.data-row td::before {
			content: attr(data-label);
			font-size: 0.7rem;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: var(--color-text-muted);
		}

		.col-name {
			display: block;
			width: auto;
			max-width: none;
			padding-top: 0.5rem;
		}

		.col-name::before {
			display: none;
		}

		.col-actions {
			display: flex;
			justify-content: flex-end;
		}

		.col-actions::before {
			display: none;
		}

		.detail-row {
			display: block;
		}

		.detail-row td {
			display: block;
			padding: 0 0.5rem 0.65rem;
		}

		.mobile-log-usage {
			display: inline-flex;
			align-items: center;
			min-height: 2.75rem;
		}
	}
</style>
