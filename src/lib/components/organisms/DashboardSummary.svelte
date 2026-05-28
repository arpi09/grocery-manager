<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import { LOCATION_LABELS, LOCATION_COLORS } from '$lib/domain/location';

	interface Props {
		summary: DashboardSummary;
	}

	let { summary }: Props = $props();

	const locationIcons: Record<string, string> = {
		fridge: '❄',
		freezer: '🧊',
		cupboard: '🫙'
	};
</script>

<section class="dashboard">
	<div class="stats">
		<p class="total">{summary.totalItems} items tracked</p>
	</div>

	<div class="grid">
		{#each summary.counts as { location, count }}
			<Card href="/inventory/{location}" interactive>
				<div class="location-card">
					<span class="icon" style="color: {LOCATION_COLORS[location]}">{locationIcons[location]}</span>
					<div>
						<h2>{LOCATION_LABELS[location]}</h2>
						<p>{count} {count === 1 ? 'item' : 'items'}</p>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<Card href="/inkop" interactive>
		<div class="ai-card">
			<span class="ai-icon">✨</span>
			<div>
				<h2>AI inventarie & ICA</h2>
				<p>Få tips om vad som håller på att ta slut och en inköpslista för ICA.</p>
			</div>
		</div>
	</Card>

	{#if summary.expiringSoon.length > 0}
		<section class="expiring">
			<h3>Expiring within 7 days</h3>
			<ul>
				{#each summary.expiringSoon as item}
					<li>
						<a href="/item/{item.id}/edit">{item.name}</a>
						<Badge tone="warning">{item.expiresOn}</Badge>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<a class="add-link" href="/item/new?from=%2F">
		<span>+ Add item</span>
	</a>
</section>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.total {
		margin: 0;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.grid {
		display: grid;
		gap: var(--space-md);
	}

	@media (min-width: 560px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.location-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.icon {
		font-size: 1.75rem;
	}

	.location-card h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.location-card p {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.ai-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.ai-icon {
		font-size: 1.75rem;
	}

	.ai-card h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.ai-card p {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.expiring h3 {
		margin: 0 0 var(--space-md);
		font-size: 1rem;
	}

	.expiring ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.expiring li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.add-link {
		display: flex;
		justify-content: center;
		padding: var(--space-md);
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
		border-radius: var(--radius-md);
		text-decoration: none;
	}

	.add-link:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}
</style>
