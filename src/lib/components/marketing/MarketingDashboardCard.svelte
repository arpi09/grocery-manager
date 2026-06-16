<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { MarketingDashboardCard } from '$lib/marketing/content';

	interface Props {
		card: MarketingDashboardCard;
		seeMoreLabel: string;
	}

	let { card, seeMoreLabel }: Props = $props();
</script>

<a class="dashboard-card" href={card.href}>
	<h3 class="title">{card.title}</h3>
	<ul class="preview-lines">
		{#each card.previewLines as line (line)}
			<li>{line}</li>
		{/each}
	</ul>
	<span class="footer-link">
		{seeMoreLabel}
		<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
	</span>
</a>

<style>
	.dashboard-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
		min-height: 100%;
	}

	.dashboard-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-md);
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
	}

	.dashboard-card:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}

	.title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.preview-lines {
		margin: 0;
		padding: 0;
		list-style: none;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.preview-lines li {
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: 1.45;
		padding-left: 0.85rem;
		position: relative;
	}

	.preview-lines li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 0.3rem;
		height: 0.3rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 70%, var(--color-text-muted));
	}

	.footer-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: var(--space-sm);
		color: var(--color-primary);
		font-weight: 600;
		font-size: var(--font-size-body-sm);
	}

	@media (prefers-reduced-motion: reduce) {
		.dashboard-card:hover {
			transform: none;
		}
	}
</style>
