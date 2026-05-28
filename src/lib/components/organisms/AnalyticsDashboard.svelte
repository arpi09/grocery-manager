<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { InventoryAnalytics } from '$lib/application/inventory.service';
	import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';

	interface Props {
		analytics: InventoryAnalytics;
	}

	let { analytics }: Props = $props();

	const locationLabelsSv: Record<StorageLocation, string> = {
		fridge: 'Kylskåp',
		freezer: 'Frys',
		cupboard: 'Skafferi'
	};

	const locationIcons: Record<StorageLocation, string> = {
		fridge: '❄',
		freezer: '🧊',
		cupboard: '🫙'
	};

	function formatTotalQuantity(value: string): string {
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) {
			return value;
		}
		return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2).replace(/\.?0+$/, '');
	}
</script>

<section class="analytics">
	<div class="hero">
		<p class="hero-number">{analytics.totalItems}</p>
		<p class="hero-label">
			{analytics.totalItems === 1 ? 'rad i skafferiet' : 'rader i skafferiet'}
			{#if analytics.totalItems > 0}
				<span class="hero-muted">
					({formatTotalQuantity(analytics.totalQuantity)} enheter totalt)
				</span>
			{/if}
		</p>
	</div>

	<div class="stat-grid">
		<Card>
			<p class="stat-value">{analytics.distinctProducts}</p>
			<p class="stat-label">Unika produkter</p>
		</Card>
		<Card>
			<p class="stat-value">{analytics.expiringSoonCount}</p>
			<p class="stat-label">Går ut inom {EXPIRING_SOON_DAYS} dagar</p>
		</Card>
		<Card>
			<p class="stat-value">{analytics.addedLast7Days}</p>
			<p class="stat-label">Tillagda senaste veckan</p>
		</Card>
		<Card>
			<p class="stat-value">{analytics.withoutExpiryCount}</p>
			<p class="stat-label">Utan utgångsdatum</p>
		</Card>
		{#if analytics.lowStockCount > 0}
			<Card>
				<p class="stat-value">{analytics.lowStockCount}</p>
				<p class="stat-label">Lågt saldo (&lt; 1)</p>
			</Card>
		{/if}
	</div>

	<Card>
		<h2 class="section-title">Per förvaringsplats</h2>
		{#if analytics.totalItems === 0}
			<p class="empty">Inget inlagt än — börja på startsidan så fylls statistiken på.</p>
		{:else}
			<ul class="bars">
				{#each analytics.byLocationBars as bar}
					<li>
						<div class="bar-header">
							<span class="bar-label">
								<span class="icon" style="color: {LOCATION_COLORS[bar.location]}">
									{locationIcons[bar.location]}
								</span>
								{locationLabelsSv[bar.location]}
							</span>
							<span class="bar-count">{bar.count}</span>
						</div>
						<div class="bar-track" aria-hidden="true">
							<div
								class="bar-fill"
								style="width: {bar.percent}%; background: {LOCATION_COLORS[bar.location]}"
							></div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>
</section>

<style>
	.analytics {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.hero {
		text-align: center;
		padding: var(--space-md) 0;
	}

	.hero-number {
		margin: 0;
		font-size: 3rem;
		font-weight: 800;
		line-height: 1;
		color: var(--color-primary);
	}

	.hero-label {
		margin: var(--space-sm) 0 0;
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	.hero-muted {
		display: block;
		margin-top: var(--space-xs);
		font-size: 0.875rem;
	}

	.stat-grid {
		display: grid;
		gap: var(--space-md);
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (min-width: 640px) {
		.stat-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.stat-value {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.stat-label {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.3;
	}

	.section-title {
		margin: 0 0 var(--space-md);
		font-size: 1rem;
		font-weight: 600;
	}

	.empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.bar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xs);
		font-size: 0.9rem;
	}

	.bar-label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-weight: 600;
	}

	.icon {
		font-size: 1.1rem;
	}

	.bar-count {
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.bar-track {
		height: 0.5rem;
		background: var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		min-width: 0;
		border-radius: var(--radius-sm);
		transition: width 0.2s ease;
	}
</style>
