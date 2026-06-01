<script lang="ts">
	import AdminAiUsageDashboard from '$lib/components/organisms/AdminAiUsageDashboard.svelte';
	import { fetchAdminData } from '$lib/client/admin-data';
	import {
		ADMIN_AI_USAGE_PERIOD_OPTIONS,
		type AdminAiUsagePeriodDays,
		type AdminAiUsageSummary
	} from '$lib/domain/ai-usage-admin';
	import { t } from '$lib/i18n';

	interface AiUsagePayload {
		aiUsage: AdminAiUsageSummary;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let summary = $state<AdminAiUsageSummary | null>(null);
	let periodDays = $state<AdminAiUsagePeriodDays>(30);
	let loadedPeriod: AdminAiUsagePeriodDays | null = $state(null);

	$effect(() => {
		if (!active) {
			return;
		}
		if (loadedPeriod === periodDays || loading) {
			return;
		}
		void load(periodDays);
	});

	async function load(days: AdminAiUsagePeriodDays) {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<AiUsagePayload>('ai-usage', { days });
			summary = payload.aiUsage;
			loadedPeriod = days;
		} catch {
			error = t('admin.loadError');
			summary = null;
			loadedPeriod = null;
		} finally {
			loading = false;
		}
	}

	function selectPeriod(days: AdminAiUsagePeriodDays) {
		if (days === periodDays) {
			return;
		}
		periodDays = days;
	}
</script>

<div class="ai-usage-panel">
	<div class="period-toggle" role="group" aria-label={t('admin.aiUsage.periodToggle')}>
		{#each ADMIN_AI_USAGE_PERIOD_OPTIONS as days}
			<button
				type="button"
				class="period-btn"
				class:active={periodDays === days}
				disabled={loading}
				aria-pressed={periodDays === days}
				onclick={() => selectPeriod(days)}
			>
				{t('admin.aiUsage.periodOption', { days })}
			</button>
		{/each}
	</div>

	{#if loading}
		<p class="panel-status">{t('admin.loading')}</p>
	{:else if error}
		<p class="panel-status panel-error" role="alert">{error}</p>
	{:else if summary}
		<AdminAiUsageDashboard {summary} />
	{/if}
</div>

<style>
	.ai-usage-panel {
		margin-bottom: var(--space-lg);
	}

	.period-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.period-btn {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.period-btn:hover:not(:disabled) {
		color: var(--color-text);
	}

	.period-btn.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.period-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.panel-status {
		margin: 0;
		color: var(--color-text-muted);
	}

	.panel-error {
		color: #8a1f1f;
	}
</style>
