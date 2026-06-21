<script lang="ts">
	import AdminAcquisitionPanel from '$lib/components/organisms/admin/AdminAcquisitionPanel.svelte';
	import AdminLaunchCohortPanel from '$lib/components/organisms/admin/AdminLaunchCohortPanel.svelte';
	import AdminPmfFunnelPanel from '$lib/components/organisms/admin/AdminPmfFunnelPanel.svelte';
	import AdminSyncFunnelPanel from '$lib/components/organisms/admin/AdminSyncFunnelPanel.svelte';
	import PmfDashboard from '$lib/components/organisms/PmfDashboard.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import {
		PMF_FUNNEL_PERIOD_DAYS,
		type PmfFunnelPeriodDays,
		type PmfFunnelSnapshot
	} from '$lib/domain/pmf-funnel';
	import { ANALYTICS_BEHAVIOR_PERIOD_DAYS } from '$lib/domain/analytics-behavior';
	import { t } from '$lib/i18n';
	import type { PmfWeeklyReview } from '$lib/domain/pmf';
	import type { AcquisitionMetricsSnapshot } from '$lib/domain/acquisition-metrics';
	import type { SyncFunnelSnapshot } from '$lib/domain/sync-funnel-admin';

	interface AnalyticsPayload {
		pmfWeeklyReview: PmfWeeklyReview;
		pmfFunnel: PmfFunnelSnapshot;
		syncFunnel: SyncFunnelSnapshot;
		acquisition: AcquisitionMetricsSnapshot;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let pmfWeeklyReview = $state<PmfWeeklyReview | null>(null);
	let pmfFunnel = $state<PmfFunnelSnapshot | null>(null);
	let syncFunnel = $state<SyncFunnelSnapshot | null>(null);
	let acquisition = $state<AcquisitionMetricsSnapshot | null>(null);
	let funnelDays = $state<PmfFunnelPeriodDays>(PMF_FUNNEL_PERIOD_DAYS);
	let loadedFunnelDays: PmfFunnelPeriodDays | null = $state(null);

	$effect(() => {
		if (!active) {
			return;
		}
		if (loadedFunnelDays === funnelDays || loading) {
			return;
		}
		void load(funnelDays);
	});

	function parseFunnelSnapshot(raw: PmfFunnelSnapshot): PmfFunnelSnapshot {
		return {
			...raw,
			periodStart: parseIsoDate(raw.periodStart as unknown as string),
			periodEnd: parseIsoDate(raw.periodEnd as unknown as string)
		};
	}

	function parseAcquisitionSnapshot(raw: AcquisitionMetricsSnapshot): AcquisitionMetricsSnapshot {
		return {
			...raw,
			periodStart: parseIsoDate(raw.periodStart as unknown as string),
			periodEnd: parseIsoDate(raw.periodEnd as unknown as string)
		};
	}

	async function load(days: PmfFunnelPeriodDays) {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<AnalyticsPayload>('analytics', { funnelDays: days });
			pmfWeeklyReview = {
				...payload.pmfWeeklyReview,
				currentWeekEnd: parseIsoDate(payload.pmfWeeklyReview.currentWeekEnd as unknown as string),
				previousWeekEnd: parseIsoDate(payload.pmfWeeklyReview.previousWeekEnd as unknown as string)
			};
			pmfFunnel = parseFunnelSnapshot(payload.pmfFunnel);
			syncFunnel = payload.syncFunnel;
			acquisition = parseAcquisitionSnapshot(payload.acquisition);
			loadedFunnelDays = days;
		} catch {
			error = t('admin.loadError');
			pmfWeeklyReview = null;
			pmfFunnel = null;
			syncFunnel = null;
			acquisition = null;
			loadedFunnelDays = null;
		} finally {
			loading = false;
		}
	}

	function selectFunnelPeriod(days: PmfFunnelPeriodDays) {
		if (days === funnelDays) {
			return;
		}
		funnelDays = days;
	}

	function exportDataUrl(days: (typeof ANALYTICS_BEHAVIOR_PERIOD_DAYS)[number]) {
		return `/api/admin/data?section=export&period=${days}`;
	}
</script>

{#if loading && !pmfFunnel}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else if pmfFunnel && pmfWeeklyReview && syncFunnel && acquisition}
	<div class="panel-actions">
		{#each ANALYTICS_BEHAVIOR_PERIOD_DAYS as days}
			<a class="export-link" href={exportDataUrl(days)} download>
				{t('admin.analytics.exportCsv', { days })}
			</a>
		{/each}
	</div>
	<AdminAcquisitionPanel snapshot={acquisition} />
	<AdminPmfFunnelPanel
		snapshot={pmfFunnel}
		periodDays={funnelDays}
		loading={loading}
		onPeriodChange={selectFunnelPeriod}
	/>
	<AdminSyncFunnelPanel snapshot={syncFunnel} />
	<AdminLaunchCohortPanel active={active} />
	<PmfDashboard review={pmfWeeklyReview} />
{/if}

<style>
	.panel-status {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.panel-error {
		color: #8a1f1f;
	}

	.panel-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin: 0 0 var(--space-lg);
	}

	.export-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.5rem;
		padding: 0 var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		text-decoration: none;
	}

	.export-link:hover {
		background: var(--color-surface-muted);
	}
</style>
