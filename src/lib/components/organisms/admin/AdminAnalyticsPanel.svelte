<script lang="ts">
	import AdminPmfFunnelPanel from '$lib/components/organisms/admin/AdminPmfFunnelPanel.svelte';
	import PmfDashboard from '$lib/components/organisms/PmfDashboard.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import {
		PMF_FUNNEL_PERIOD_DAYS,
		type PmfFunnelPeriodDays,
		type PmfFunnelSnapshot
	} from '$lib/domain/pmf-funnel';
	import { t } from '$lib/i18n';
	import type { PmfWeeklyReview } from '$lib/domain/pmf';

	interface AnalyticsPayload {
		pmfWeeklyReview: PmfWeeklyReview;
		pmfFunnel: PmfFunnelSnapshot;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let pmfWeeklyReview = $state<PmfWeeklyReview | null>(null);
	let pmfFunnel = $state<PmfFunnelSnapshot | null>(null);
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
			loadedFunnelDays = days;
		} catch {
			error = t('admin.loadError');
			pmfWeeklyReview = null;
			pmfFunnel = null;
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
</script>

{#if loading && !pmfFunnel}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else if pmfFunnel && pmfWeeklyReview}
	<AdminPmfFunnelPanel
		snapshot={pmfFunnel}
		periodDays={funnelDays}
		loading={loading}
		onPeriodChange={selectFunnelPeriod}
	/>
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
</style>
