<script lang="ts">
	import SkaffuCard from '$lib/components/molecules/SkaffuCard.svelte';
	import type { Snippet } from 'svelte';

	export type HomeDashboardCardSize = 'hero' | 'default' | 'compact';

	interface Props {
		title: string;
		href: string;
		testId?: string;
		tone?: 'default' | 'attention';
		size?: HomeDashboardCardSize;
		icon?: Snippet;
		meta?: Snippet;
		body?: Snippet;
		footerLabel: string;
	}

	let {
		title,
		href,
		testId,
		tone = 'default',
		size = 'default',
		icon,
		meta,
		body,
		footerLabel
	}: Props = $props();
</script>

<div class="dashboard-card" data-card-size={size}>
	<SkaffuCard {href} clickable {tone} data-testid={testId}>
		<div class="card-inner">
			<div class="card-header">
				{#if icon}
					<div class="card-icon" aria-hidden="true">
						{@render icon()}
					</div>
				{/if}
				<h2 class="card-title">{title}</h2>
			</div>
			{#if meta}
				<div class="card-meta">
					{@render meta()}
				</div>
			{/if}
			{#if body}
				<div class="card-body">
					{@render body()}
				</div>
			{/if}
		</div>
		{#snippet actions()}
			<span class="card-footer">{footerLabel} →</span>
		{/snippet}
	</SkaffuCard>
</div>

<style>
	.dashboard-card {
		display: block;
		min-width: 0;
	}

	.dashboard-card :global(.skaffu-card-link) {
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	@media (prefers-reduced-motion: no-preference) {
		.dashboard-card :global(.skaffu-card-link:hover),
		.dashboard-card :global(.skaffu-card-link:focus-visible) {
			transform: translateY(-2px);
		}

		.dashboard-card :global(.skaffu-card-link:hover .skaffu-card--clickable),
		.dashboard-card :global(.skaffu-card-link:focus-visible .skaffu-card--clickable) {
			box-shadow: var(--shadow-sm) !important;
		}
	}

	.card-inner {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}

	.card-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 650;
		line-height: 1.25;
		color: var(--color-text);
	}

	.dashboard-card[data-card-size='hero'] .card-title {
		font-size: 1.125rem;
	}

	.dashboard-card[data-card-size='hero'] .card-icon {
		width: 2.25rem;
		height: 2.25rem;
	}

	.dashboard-card[data-card-size='compact'] .card-inner {
		gap: var(--space-xs);
	}

	.dashboard-card[data-card-size='compact'] .card-title {
		font-size: 0.9375rem;
	}

	.dashboard-card[data-card-size='compact'] .card-icon {
		width: 1.75rem;
		height: 1.75rem;
	}

	.dashboard-card[data-card-size='compact'] :global(.skaffu-card__content) {
		padding: var(--space-sm) var(--space-md) !important;
	}

	.dashboard-card[data-card-size='compact'] :global(.skaffu-card__actions) {
		padding: 0 var(--space-md) var(--space-sm) !important;
	}

	.card-meta {
		font-size: var(--font-size-label);
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.card-body {
		font-size: var(--font-size-body-sm);
		color: var(--color-text);
		line-height: 1.4;
	}

	.card-footer {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
	}
</style>
