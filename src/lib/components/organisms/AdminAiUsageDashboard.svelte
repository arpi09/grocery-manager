<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { AI_USAGE_KINDS } from '$lib/domain/ai-usage';
	import { t } from '$lib/i18n';
	import type { AdminAiUsageSummary } from '$lib/domain/ai-usage-admin';

	interface Props {
		summary: AdminAiUsageSummary;
	}

	let { summary }: Props = $props();
</script>

<section class="ai-usage-dashboard" aria-labelledby="ai-usage-heading">
	<div class="dashboard-header">
		<h2 id="ai-usage-heading">{t('admin.aiUsage.title')}</h2>
	</div>
	<p class="ai-usage-note">{t('admin.aiUsage.note')}</p>

	<div class="stats-grid">
		<Card>
			<p class="stat-label">{t('admin.aiUsage.monthlyTotal')}</p>
			<p class="stat-value">{summary.monthlyTotal}</p>
			<p class="stat-note">{summary.monthKey}</p>
		</Card>

		{#each AI_USAGE_KINDS as kind}
			<Card>
				<p class="stat-label">{t(`admin.aiUsage.kinds.${kind}`)}</p>
				<p class="stat-value">{summary.byKind[kind]}</p>
				<p class="stat-note">
					{t('admin.aiUsage.periodDays', { days: summary.periodDays })}
				</p>
			</Card>
		{/each}
	</div>

	<Card>
		<h3>{t('admin.aiUsage.topHouseholdsTitle')}</h3>
		<p class="top-note">{t('admin.aiUsage.topHouseholdsNote')}</p>
		{#if summary.topHouseholdCounts.length === 0}
			<p class="top-empty">{t('admin.aiUsage.empty')}</p>
		{:else}
			<ol class="top-list">
				{#each summary.topHouseholdCounts as count, index}
					<li>
						<span class="rank">{t('admin.aiUsage.rank', { rank: index + 1 })}</span>
						<span class="count">{t('admin.aiUsage.usageCount', { count })}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</Card>
</section>

<style>
	.ai-usage-dashboard {
		margin-bottom: var(--space-lg);
	}

	.dashboard-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.dashboard-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.ai-usage-note {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.stat-label {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.stat-value {
		margin: var(--space-xs) 0 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.stat-note {
		margin: 0.2rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	h3 {
		margin: 0 0 var(--space-sm);
		font-size: 1rem;
	}

	.top-note,
	.top-empty {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.top-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.top-list li {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: baseline;
		padding: var(--space-xs) 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.top-list li:last-child {
		border-bottom: none;
	}

	.rank {
		font-weight: 600;
		min-width: 2.5rem;
	}

	.count {
		color: var(--color-text-muted);
	}
</style>
