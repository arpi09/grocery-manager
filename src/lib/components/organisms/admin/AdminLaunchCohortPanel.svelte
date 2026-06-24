<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import {
		LAUNCH_COHORT_UNKNOWN_CAMPAIGN,
		type LaunchCohortSnapshot
	} from '$lib/domain/launch-cohort';
	import {
		PMF_FUNNEL_PERIOD_OPTIONS,
		type PmfFunnelPeriodDays
	} from '$lib/domain/pmf-funnel';
	import { getLocale, t } from '$lib/i18n';

	interface LaunchCohortPayload {
		launchCohort: {
			periodDays: PmfFunnelPeriodDays;
			periodStart: string;
			periodEnd: string;
			totalSignups: number;
			rows: Array<{
				weekStart: string;
				utmCampaign: string;
				signups: number;
			}>;
		};
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let snapshot = $state<LaunchCohortSnapshot | null>(null);
	let periodDays = $state<PmfFunnelPeriodDays>(7);
	let loadedPeriod: PmfFunnelPeriodDays | null = $state(null);

	$effect(() => {
		if (!active) {
			return;
		}
		if (loadedPeriod === periodDays || loading) {
			return;
		}
		void load(periodDays);
	});

	function parseSnapshot(raw: LaunchCohortPayload['launchCohort']): LaunchCohortSnapshot {
		return {
			periodDays: raw.periodDays,
			periodStart: parseIsoDate(raw.periodStart),
			periodEnd: parseIsoDate(raw.periodEnd),
			totalSignups: raw.totalSignups,
			rows: raw.rows.map((row) => ({
				weekStart: parseIsoDate(row.weekStart),
				utmCampaign: row.utmCampaign,
				signups: row.signups
			}))
		};
	}

	async function load(days: PmfFunnelPeriodDays) {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<LaunchCohortPayload>('launch-cohort', {
				periodDays: days
			});
			snapshot = parseSnapshot(payload.launchCohort);
			loadedPeriod = days;
		} catch {
			error = t('admin.loadError');
			snapshot = null;
			loadedPeriod = null;
		} finally {
			loading = false;
		}
	}

	function selectPeriod(days: PmfFunnelPeriodDays) {
		if (days === periodDays) {
			return;
		}
		periodDays = days;
	}

	function formatCount(value: number): string {
		return new Intl.NumberFormat(getLocale()).format(value);
	}

	function formatWeekRange(weekStart: Date): string {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		const formatter = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
		const weekEnd = new Date(weekStart);
		weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
		return t('admin.launchCohort.weekRange', {
			start: formatter.format(weekStart),
			end: formatter.format(weekEnd)
		});
	}

	function formatPeriodRange(current: LaunchCohortSnapshot): string {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		const formatter = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
		return t('admin.launchCohort.periodRange', {
			start: formatter.format(current.periodStart),
			end: formatter.format(current.periodEnd),
			days: current.periodDays
		});
	}

	function formatCampaign(value: string): string {
		if (value === LAUNCH_COHORT_UNKNOWN_CAMPAIGN) {
			return t('admin.launchCohort.unknownCampaign');
		}
		return value;
	}
</script>

<section class="launch-cohort" aria-labelledby="launch-cohort-heading">
	<div class="cohort-header">
		<div>
			<h2 id="launch-cohort-heading">{t('admin.launchCohort.title')}</h2>
			<p class="lead">{t('admin.launchCohort.subtitle')}</p>
			{#if snapshot}
				<p class="period-note">{formatPeriodRange(snapshot)}</p>
			{/if}
		</div>
		<div class="period-toggle" role="group" aria-label={t('admin.launchCohort.periodToggle')}>
			{#each PMF_FUNNEL_PERIOD_OPTIONS as days}
				<button
					type="button"
					class="period-btn"
					class:active={periodDays === days}
					disabled={loading}
					aria-pressed={periodDays === days}
					onclick={() => selectPeriod(days)}
				>
					{t('admin.launchCohort.periodOption', { days })}
				</button>
			{/each}
		</div>
	</div>

	{#if loading && !snapshot}
		<p class="panel-status">{t('admin.loading')}</p>
	{:else if error}
		<p class="panel-status panel-error" role="alert">{error}</p>
	{:else if snapshot}
		<Card>
			<p class="summary">
				{t('admin.launchCohort.totalSignups', { count: formatCount(snapshot.totalSignups) })}
			</p>

			{#if snapshot.rows.length === 0}
				<p class="empty">{t('admin.launchCohort.empty')}</p>
			{:else}
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">{t('admin.launchCohort.weekCol')}</th>
								<th scope="col">{t('admin.launchCohort.campaignCol')}</th>
								<th scope="col">{t('admin.launchCohort.signupsCol')}</th>
							</tr>
						</thead>
						<tbody>
							{#each snapshot.rows as row (row.weekStart.toISOString() + row.utmCampaign)}
								<tr>
									<td>{formatWeekRange(row.weekStart)}</td>
									<td>{formatCampaign(row.utmCampaign)}</td>
									<td>{formatCount(row.signups)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Card>
	{/if}
</section>

<style>
	.launch-cohort {
		margin-bottom: var(--space-xl);
	}

	.cohort-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	h2 {
		margin: 0 0 var(--space-xs);
		font-size: 1.25rem;
	}

	.lead,
	.period-note,
	.summary,
	.empty,
	.panel-status {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.period-note {
		margin-top: var(--space-xs);
	}

	.period-toggle {
		display: inline-flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.period-btn {
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.85rem;
		cursor: pointer;
	}

	.period-btn.active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		font-weight: 600;
	}

	.period-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.summary {
		margin-bottom: var(--space-md);
		font-weight: 600;
		color: var(--color-text);
	}

	.empty {
		font-style: italic;
	}

	.panel-error {
		color: var(--color-danger);
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th,
	td {
		padding: 0.65rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}
</style>
