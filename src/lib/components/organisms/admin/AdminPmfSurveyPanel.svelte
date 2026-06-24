<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import type { PmfSurveyResponseEntry, PmfSurveySummary } from '$lib/domain/pmf-survey';
	import { PMF_SURVEY_LIST_DEFAULT, PMF_SURVEY_LIST_MAX } from '$lib/domain/pmf-survey';
	import { getLocale, t, type MessageKey } from '$lib/i18n';
	import type { PmfSurveyTrigger } from '$lib/domain/pmf-survey';

	interface PmfSurveyPayload {
		responses: (Omit<PmfSurveyResponseEntry, 'createdAt'> & { createdAt: string })[];
		summary: PmfSurveySummary;
		limit: number;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let responses = $state<PmfSurveyResponseEntry[]>([]);
	let summary = $state<PmfSurveySummary | null>(null);
	let limit = $state(PMF_SURVEY_LIST_DEFAULT);
	let loaded = $state(false);

	const triggerLabelKeys: Record<PmfSurveyTrigger, MessageKey> = {
		post_onboarding: 'admin.pmfSurvey.trigger.post_onboarding',
		periodic: 'admin.pmfSurvey.trigger.periodic'
	};

	const wouldMissLabelKeys: Record<PmfSurveyResponseEntry['wouldMiss'], MessageKey> = {
		yes: 'pmfSurvey.wouldMiss.yes',
		somewhat: 'pmfSurvey.wouldMiss.somewhat',
		no: 'pmfSurvey.wouldMiss.no'
	};

	$effect(() => {
		if (!active) {
			return;
		}
		void loadResponses();
	});

	async function loadResponses(nextLimit = limit) {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<PmfSurveyPayload>('pmf-survey', { limit: nextLimit });
			responses = payload.responses.map((entry) => ({
				...entry,
				createdAt: parseIsoDate(entry.createdAt)
			}));
			summary = payload.summary;
			limit = payload.limit;
			loaded = true;
		} catch {
			error = t('admin.loadError');
		} finally {
			loading = false;
		}
	}

	function formatDate(value: Date) {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		return new Intl.DateTimeFormat(tag, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(value);
	}

	function exportCsv() {
		if (responses.length === 0) {
			return;
		}

		const header = ['createdAt', 'email', 'trigger', 'npsScore', 'wouldMiss', 'comment'];
		const rows = responses.map((entry) => [
			entry.createdAt.toISOString(),
			entry.userEmail,
			entry.trigger,
			String(entry.npsScore),
			entry.wouldMiss,
			entry.comment ?? ''
		]);

		const csv = [header, ...rows]
			.map((row) =>
				row
					.map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
					.join(',')
			)
			.join('\n');

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `pmf-survey-${new Date().toISOString().slice(0, 10)}.csv`;
		anchor.click();
		URL.revokeObjectURL(url);
	}
</script>

{#if loading && !loaded}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else if summary}
	<section class="summary-grid">
		<Card>
			<h2>{t('admin.pmfSurvey.summaryTitle')}</h2>
			<dl class="stats">
				<div>
					<dt>{t('admin.pmfSurvey.totalResponses')}</dt>
					<dd>{summary.totalResponses}</dd>
				</div>
				<div>
					<dt>{t('admin.pmfSurvey.nps')}</dt>
					<dd>{summary.nps ?? '—'}</dd>
				</div>
				<div>
					<dt>{t('admin.pmfSurvey.promoters')}</dt>
					<dd>{summary.promoters}</dd>
				</div>
				<div>
					<dt>{t('admin.pmfSurvey.passives')}</dt>
					<dd>{summary.passives}</dd>
				</div>
				<div>
					<dt>{t('admin.pmfSurvey.detractors')}</dt>
					<dd>{summary.detractors}</dd>
				</div>
				<div>
					<dt>{t('admin.pmfSurvey.wouldMissYes')}</dt>
					<dd>{summary.wouldMiss.yes}</dd>
				</div>
				<div>
					<dt>{t('admin.pmfSurvey.wouldMissSomewhat')}</dt>
					<dd>{summary.wouldMiss.somewhat}</dd>
				</div>
				<div>
					<dt>{t('admin.pmfSurvey.wouldMissNo')}</dt>
					<dd>{summary.wouldMiss.no}</dd>
				</div>
			</dl>
		</Card>
	</section>

	<section class="responses">
		<Card>
			<div class="panel-header">
				<h2>{t('admin.pmfSurvey.tableTitle')}</h2>
				<div class="panel-actions">
					<label>
						{t('admin.showLatest')}
						<select
							value={limit}
							disabled={loading}
							onchange={(e) => loadResponses(Number(e.currentTarget.value))}
						>
							{#each [25, 50, 100, 200] as option}
								<option value={option} disabled={option > PMF_SURVEY_LIST_MAX}>
									{option}
								</option>
							{/each}
						</select>
					</label>
					<Button type="button" variant="secondary" disabled={responses.length === 0} onclick={exportCsv}>
						{t('admin.pmfSurvey.exportCsv')}
					</Button>
				</div>
			</div>
			<p class="panel-note">{t('admin.pmfSurvey.note')}</p>

			{#if responses.length === 0}
				<p class="panel-empty">{t('admin.pmfSurvey.empty')}</p>
			{:else}
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th>{t('admin.pmfSurvey.colDate')}</th>
								<th>{t('admin.email')}</th>
								<th>{t('admin.pmfSurvey.colTrigger')}</th>
								<th>{t('admin.pmfSurvey.colNps')}</th>
								<th>{t('admin.pmfSurvey.colWouldMiss')}</th>
								<th>{t('admin.pmfSurvey.colComment')}</th>
							</tr>
						</thead>
						<tbody>
							{#each responses as entry (entry.id)}
								<tr>
									<td>
										<time datetime={entry.createdAt.toISOString()}>
											{formatDate(entry.createdAt)}
										</time>
									</td>
									<td>{entry.userEmail}</td>
									<td>{t(triggerLabelKeys[entry.trigger])}</td>
									<td>{entry.npsScore}</td>
									<td>{t(wouldMissLabelKeys[entry.wouldMiss])}</td>
									<td class="comment-cell">{entry.comment ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Card>
	</section>
{/if}

<style>
	.panel-status {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.panel-error {
		color: var(--color-danger);
	}

	.summary-grid {
		margin-bottom: var(--space-lg);
	}

	.summary-grid h2,
	.panel-header h2 {
		margin: 0 0 var(--space-sm);
		font-size: 1.1rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: var(--space-sm) var(--space-md);
		margin: 0;
	}

	.stats div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stats dt {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.stats dd {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
	}

	.panel-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.panel-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
	}

	.panel-actions label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.panel-actions select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.panel-note,
	.panel-empty {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
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
		padding: 0.5rem 0.65rem;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
	}

	.comment-cell {
		max-width: 16rem;
		white-space: pre-wrap;
	}
</style>
