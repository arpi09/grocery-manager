<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { InventoryInsight } from '$lib/server/inventory-insights';
	import { t } from '$lib/i18n';

	interface Props {
		insights: InventoryInsight[];
		missingExpiryCount: number;
		estimatedCount: number;
		loading?: boolean;
		canWrite?: boolean;
		bulkInferAction?: string | null;
		onDeepen?: () => Promise<void>;
		deepening?: boolean;
		deepenError?: string | null;
	}

	let {
		insights,
		missingExpiryCount,
		estimatedCount,
		loading = false,
		canWrite = false,
		bulkInferAction = null,
		onDeepen,
		deepening = false,
		deepenError = null
	}: Props = $props();

	const visible = $derived(insights.length > 0 || missingExpiryCount > 0 || estimatedCount > 0);

	function actionLabel(action: InventoryInsight['suggestedAction']): string {
		switch (action) {
			case 'eat_first':
				return t('brain.insights.actionEatFirst');
			case 'add_expiry':
				return t('brain.insights.actionAddExpiry');
			case 'plan_recipe':
				return t('brain.insights.actionPlanRecipe');
			default:
				return t('brain.insights.actionReviewEstimated');
		}
	}

	function actionHref(action: InventoryInsight['suggestedAction']): string {
		switch (action) {
			case 'eat_first':
				return '/inventory/all?filter=expiring';
			case 'add_expiry':
				return '/inventory/all?filter=noExpiry';
			case 'plan_recipe':
				return '/planer/vecka';
			default:
				return '/inventory/all?filter=dated';
		}
	}

	function actionCtaLabel(action: InventoryInsight['suggestedAction']): string {
		switch (action) {
			case 'eat_first':
				return t('brain.insights.ctaExpiring');
			case 'add_expiry':
				return t('brain.insights.ctaNoExpiry');
			case 'plan_recipe':
				return t('brain.insights.ctaWeekPlan');
			default:
				return t('brain.insights.ctaEstimated');
		}
	}
</script>

{#if loading}
	<section class="insights-panel insights-panel--loading" aria-busy="true" data-testid="inventory-insights-loading">
		<div class="skeleton-title" aria-hidden="true"></div>
		<div class="skeleton-grid" aria-hidden="true">
			<div class="skeleton-card"></div>
			<div class="skeleton-card"></div>
		</div>
	</section>
{:else if visible}
	<section class="insights-panel" aria-labelledby="inventory-insights-heading" data-testid="inventory-insights">
		<div class="insights-header">
			<h2 id="inventory-insights-heading" class="insights-title">{t('brain.insights.title')}</h2>
			{#if onDeepen}
				<button
					type="button"
					class="insight-deepen"
					disabled={deepening}
					title={t('brain.insights.deepenTitle')}
					onclick={() => void onDeepen()}
					data-testid="inventory-insights-deepen"
				>
					{deepening ? t('brain.insights.deepening') : t('brain.insights.deepen')}
				</button>
			{/if}
		</div>
		{#if deepenError}
			<p class="insight-error" role="alert">{deepenError}</p>
		{/if}
		<div class="insights-grid">
			{#if missingExpiryCount > 0}
				<Card class="insight-card">
					<div class="insight-card-body">
						<p class="insight-stat">{missingExpiryCount}</p>
						<p class="insight-label">{t('brain.insights.missingExpiry')}</p>
					</div>
					{#if canWrite && bulkInferAction}
						<form method="POST" action={bulkInferAction} class="insight-action-form">
							<button type="submit" class="insight-link">{t('inventory.bulkExpiryAction')}</button>
						</form>
					{:else}
						<a class="insight-link" href="/inventory/all?filter=noExpiry">
							{t('brain.insights.ctaNoExpiry')}
						</a>
					{/if}
				</Card>
			{/if}
			{#if estimatedCount > 0}
				<Card class="insight-card">
					<div class="insight-card-body">
						<p class="insight-stat">{estimatedCount}</p>
						<p class="insight-label">{t('brain.insights.estimatedCount')}</p>
						<p class="insight-hint">{t('brain.insights.estimatedHint')}</p>
					</div>
					<a class="insight-link" href="/inventory/all?filter=dated" data-testid="inventory-insights-estimated-cta">
						{t('brain.insights.ctaEstimated')}
					</a>
				</Card>
			{/if}
		</div>
		<ul class="insight-actions">
			{#each insights as insight, index (`${insight.suggestedAction}:${insight.actionDate}:${index}`)}
				<li class="insight-row">
					<div class="insight-row-main">
						<strong>{actionLabel(insight.suggestedAction)}</strong>
						<span>{insight.relatedItemNames.join(', ')}</span>
						{#if insight.daysUntilExpiry != null}
							<span class="insight-days">{t('brain.insights.daysUntil', { count: insight.daysUntilExpiry })}</span>
						{/if}
					</div>
					<a
						class="insight-link"
						href={actionHref(insight.suggestedAction)}
						data-testid="inventory-insight-cta-{insight.suggestedAction}"
					>
						{actionCtaLabel(insight.suggestedAction)}
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.insights-panel {
		margin-bottom: var(--space-lg);
	}

	.insights-panel--loading .skeleton-title {
		height: 1rem;
		width: 8rem;
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		margin-bottom: var(--space-sm);
	}

	.skeleton-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-sm);
	}

	.skeleton-card {
		height: 4.5rem;
		border-radius: var(--radius-md);
		background: linear-gradient(
			90deg,
			var(--color-surface-muted) 0%,
			color-mix(in srgb, var(--color-surface-muted) 70%, var(--color-border)) 50%,
			var(--color-surface-muted) 100%
		);
		background-size: 200% 100%;
		animation: insight-skeleton 1.2s ease-in-out infinite;
	}

	@keyframes insight-skeleton {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: -100% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-card {
			animation: none;
		}
	}

	.insights-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.insights-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
	}

	.insight-deepen {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		padding: 0.35rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.insight-deepen:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.insight-error {
		margin: 0 0 var(--space-sm);
		font-size: 0.8125rem;
		color: var(--color-danger);
	}

	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.insight-card {
		padding: var(--space-sm) var(--space-md);
		text-align: center;
	}

	.insight-card-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	@media (min-width: 640px) {
		.insight-card {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--space-sm);
			text-align: left;
		}

		.insight-card-body {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: baseline;
			gap: var(--space-xs) var(--space-sm);
		}

		.insight-stat {
			margin-right: 0.125rem;
		}

		.insight-hint {
			flex-basis: 100%;
		}
	}

	.insight-stat {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.1;
	}

	.insight-label {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.insight-hint {
		margin: 0.125rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.3;
	}

	.insight-action-form {
		display: inline;
		margin: 0;
		padding: 0;
	}

	.insight-link {
		display: inline-block;
		margin-top: var(--space-xs);
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		text-decoration: underline;
	}

	a.insight-link {
		text-decoration: underline;
	}

	@media (min-width: 640px) {
		.insight-link {
			margin-top: 0;
			flex-shrink: 0;
		}
	}

	.insight-actions {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-xs);
	}

	.insight-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		font-size: 0.8125rem;
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	@media (min-width: 640px) {
		.insight-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.insight-row-main {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	.insight-days {
		color: var(--color-text-muted);
	}
</style>
