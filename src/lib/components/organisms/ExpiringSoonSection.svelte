<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import {
		EXPIRING_SOON_DAYS,
		daysUntilExpiry,
		formatDaysLeftSv,
		formatExpiryDateSv
	} from '$lib/domain/expiry';
	import type { StorageLocation } from '$lib/domain/location';
	import { LOCATION_COLORS } from '$lib/domain/location';

	interface Props {
		items: InventoryItem[];
	}

	let { items }: Props = $props();

	const locationLabelsSv: Record<StorageLocation, string> = {
		fridge: 'Kylskåp',
		freezer: 'Frys',
		cupboard: 'Skafferi'
	};
</script>

<section class="expiring-soon" aria-labelledby="expiring-soon-heading">
	<header class="header">
		<h2 id="expiring-soon-heading">Går ut snart</h2>
		<p class="subtitle">Inom {EXPIRING_SOON_DAYS} dagar</p>
	</header>

	{#if items.length === 0}
		<Card>
			<p class="empty">
				Inget går ut de närmaste {EXPIRING_SOON_DAYS} dagarna — bra jobbat!
			</p>
		</Card>
	{:else}
		<ul class="list">
			{#each items as item (item.id)}
				{@const daysLeft = item.expiresOn ? daysUntilExpiry(item.expiresOn) : null}
				<li>
					<Card href="/item/{item.id}/edit" interactive class="item-card">
						<div class="item">
							<div class="main">
								<span class="name">{item.name}</span>
								<p class="meta">
									<span
										class="location"
										style="color: {LOCATION_COLORS[item.location]}"
									>
										{locationLabelsSv[item.location]}
									</span>
									{#if item.expiresOn}
										<span class="dot" aria-hidden="true">·</span>
										<span>{formatExpiryDateSv(item.expiresOn)}</span>
									{/if}
								</p>
							</div>
							{#if item.expiresOn && daysLeft !== null}
								<Badge tone="warning">{formatDaysLeftSv(daysLeft)}</Badge>
							{/if}
						</div>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.expiring-soon {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.header h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.subtitle {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	:global(.item-card) {
		padding: var(--space-md) var(--space-lg);
	}

	.item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
	}

	.name {
		font-weight: 600;
		color: var(--color-text);
	}

	.meta {
		margin: var(--space-xs) 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.location {
		font-weight: 500;
	}

	.dot {
		margin: 0 0.25rem;
	}
</style>
