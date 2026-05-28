<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { LOCATION_LABELS } from '$lib/domain/location';

	interface Props {
		item: InventoryItem;
	}

	let { item }: Props = $props();

	function formatQuantity(item: InventoryItem) {
		const unit = item.unit ? ` ${item.unit}` : '';
		return `${item.quantity}${unit}`;
	}

	function isExpiringSoon(date: string | null) {
		if (!date) return false;
		const expires = new Date(date);
		const now = new Date();
		const diff = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
		return diff >= 0 && diff <= 7;
	}
</script>

<article class="row">
	<div class="main">
		<a href="/item/{item.id}/edit" class="name">{item.name}</a>
		<p class="meta">{formatQuantity(item)} · {LOCATION_LABELS[item.location]}</p>
		{#if item.notes}
			<p class="notes">{item.notes}</p>
		{/if}
	</div>
	<div class="aside">
		{#if item.expiresOn}
			<Badge tone={isExpiringSoon(item.expiresOn) ? 'warning' : 'default'}>
				Expires {item.expiresOn}
			</Badge>
		{/if}
	</div>
</article>

<style>
	.row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.name {
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
	}

	.name:hover {
		color: var(--color-primary);
	}

	.meta {
		margin: var(--space-xs) 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.notes {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.aside {
		flex-shrink: 0;
	}
</style>
