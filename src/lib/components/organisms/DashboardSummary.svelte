<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import ExpiringSoonSection from '$lib/components/organisms/ExpiringSoonSection.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import { LOCATION_LABELS, LOCATION_COLORS } from '$lib/domain/location';

	interface Props {
		summary: DashboardSummary;
		canWrite?: boolean;
	}

	let { summary, canWrite = false }: Props = $props();

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

	<ExpiringSoonSection items={summary.expiringSoon} />

	<Card href="/inkop" interactive>
		<div class="ai-card">
			<span class="ai-icon">✨</span>
			<div>
				<h2>AI inventarie & ICA</h2>
				<p>Få tips om vad som håller på att ta slut och en inköpslista för ICA.</p>
			</div>
		</div>
	</Card>

	{#if canWrite}
		<div class="cta-row">
			<a class="scan-link" href="/scan?from=%2F">📷 Skanna</a>
			<a class="add-link" href="/item/new?from=%2F">
				<span>+ Lägg till vara</span>
			</a>
		</div>
	{/if}
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

	.cta-row {
		display: grid;
		gap: var(--space-sm);
	}

	.scan-link,
	.add-link {
		display: flex;
		justify-content: center;
		padding: var(--space-md);
		font-weight: 600;
		border-radius: var(--radius-md);
		text-decoration: none;
	}

	.scan-link {
		background: var(--color-primary);
		color: #fff;
		border: none;
	}

	.scan-link:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	.add-link {
		border: 1px solid var(--color-primary);
		color: var(--color-primary);
		background: var(--color-surface);
	}

	.add-link:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
	}
</style>
