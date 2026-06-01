<script lang="ts">
	import PmfDashboard from '$lib/components/organisms/PmfDashboard.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import { t } from '$lib/i18n';
	import type { PmfWeeklyReview } from '$lib/domain/pmf';

	interface AnalyticsPayload {
		pmfWeeklyReview: PmfWeeklyReview;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let pmfWeeklyReview = $state<PmfWeeklyReview | null>(null);
	let loaded = $state(false);

	$effect(() => {
		if (!active || loaded || loading) {
			return;
		}
		void load();
	});

	async function load() {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<AnalyticsPayload>('analytics');
			pmfWeeklyReview = {
				...payload.pmfWeeklyReview,
				currentWeekEnd: parseIsoDate(payload.pmfWeeklyReview.currentWeekEnd as unknown as string),
				previousWeekEnd: parseIsoDate(payload.pmfWeeklyReview.previousWeekEnd as unknown as string)
			};
			loaded = true;
		} catch {
			error = t('admin.loadError');
		} finally {
			loading = false;
		}
	}
</script>

{#if loading}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else if pmfWeeklyReview}
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
