<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import { getLocale, t } from '$lib/i18n';

	interface ReportRow {
		id: string;
		shareId: string;
		reporterUserId: string;
		reason: string | null;
		createdAt: Date;
	}

	interface ReportsPayload {
		reports: Array<Omit<ReportRow, 'createdAt'> & { createdAt: string }>;
		limit: number;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let reports = $state<ReportRow[]>([]);
	let loaded = $state(false);

	$effect(() => {
		if (!active) {
			return;
		}
		void loadReports();
	});

	async function loadReports() {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<ReportsPayload>('grannskafferiet-reports', { limit: 50 });
			reports = payload.reports.map((row) => ({
				...row,
				createdAt: parseIsoDate(row.createdAt)
			}));
			loaded = true;
		} catch {
			error = t('admin.loadError');
		} finally {
			loading = false;
		}
	}

	function formatDate(value: Date) {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		return new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short' }).format(value);
	}
</script>

<section class="reports-panel" aria-labelledby="gs-reports-heading">
	<h2 id="gs-reports-heading">{t('admin.grannskafferietReports.title')}</h2>
	<p class="note">{t('admin.grannskafferietReports.note')}</p>

	{#if loading && !loaded}
		<p>{t('common.loading')}</p>
	{:else if error}
		<p role="alert">{error}</p>
	{:else if reports.length === 0}
		<p>{t('admin.grannskafferietReports.empty')}</p>
	{:else}
		<Card class="reports-table-card">
			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th scope="col">{t('admin.grannskafferietReports.date')}</th>
							<th scope="col">{t('admin.grannskafferietReports.shareId')}</th>
							<th scope="col">{t('admin.grannskafferietReports.reason')}</th>
						</tr>
					</thead>
					<tbody>
						{#each reports as report (report.id)}
							<tr>
								<td>{formatDate(report.createdAt)}</td>
								<td><code>{report.shareId.slice(0, 8)}…</code></td>
								<td>{report.reason ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</section>

<style>
	.reports-panel {
		display: grid;
		gap: var(--space-md);
	}

	h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	:global(.reports-table-card) {
		padding: 0 !important;
		overflow: hidden;
	}

	.table-scroll {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-weight: 600;
		background: var(--color-surface-muted);
	}

	code {
		font-size: 0.8125rem;
	}
</style>
