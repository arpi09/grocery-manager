<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import {
		EXPIRING_SOON_DAYS,
		daysUntilExpiry,
		formatDaysLeft,
		formatExpiryDate
	} from '$lib/domain/expiry';
	import { LOCATION_COLORS } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	interface Props {
		items: InventoryItem[];
		showEmpty?: boolean;
	}

	let { items, showEmpty = true }: Props = $props();
</script>

<section class="expiring-soon" aria-labelledby="expiring-soon-heading">
	<header class="header">
		<h2 id="expiring-soon-heading">{t('expiring.title')}</h2>
		<p class="subtitle">{t('expiring.subtitle', { days: EXPIRING_SOON_DAYS })}</p>
	</header>

	{#if items.length === 0}
		{#if showEmpty}
			<Card>
				<p class="empty">
					{t('expiring.empty', { days: EXPIRING_SOON_DAYS })}
				</p>
			</Card>
		{/if}
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
										{locationLabel(getLocale(), item.location)}
									</span>
									{#if item.expiresOn}
										<span class="dot" aria-hidden="true">·</span>
										<span>{formatExpiryDate(item.expiresOn, getLocale())}</span>
									{/if}
								</p>
							</div>
							{#if item.expiresOn && daysLeft !== null}
								<Badge tone="warning">{formatDaysLeft(daysLeft, getLocale())}</Badge>
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
