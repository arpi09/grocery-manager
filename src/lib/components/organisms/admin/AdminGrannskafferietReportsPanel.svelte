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
		marketMetrics?: {
			periodDays: number;
			periodStart: string;
			periodEnd: string;
			activeAutoListings: number;
			counts: {
				market_auto_listing_published: number;
				market_listing_viewed: number;
				market_chat_started: number;
				market_chat_message_sent: number;
				market_exchange_rated: number;
			};
			listingToChatConversion: number | null;
		};
		limit: number;
	}

	interface SyncResult {
		processed: number;
		published: number;
		cleared: number;
		skipped: number;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let reports = $state<ReportRow[]>([]);
	let loaded = $state(false);
	let syncing = $state(false);
	let syncMessage = $state<string | null>(null);
	let syncError = $state<string | null>(null);
	let marketMetrics = $state<ReportsPayload['marketMetrics'] | null>(null);

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
			marketMetrics = payload.marketMetrics ?? null;
			loaded = true;
		} catch {
			error = t('admin.loadError');
		} finally {
			loading = false;
		}
	}

	async function syncAutoListing() {
		syncing = true;
		syncMessage = null;
		syncError = null;
		try {
			const response = await fetch('/api/admin/market/sync-auto-listing', { method: 'POST' });
			const payload = (await response.json()) as SyncResult & { ok?: boolean };
			if (!response.ok || !payload.ok) {
				syncError = t('admin.grannskafferietReports.syncAutoListingFailed');
				return;
			}
			syncMessage = t('admin.grannskafferietReports.syncAutoListingSuccess', {
				published: payload.published,
				cleared: payload.cleared,
				processed: payload.processed
			});
		} catch {
			syncError = t('admin.grannskafferietReports.syncAutoListingFailed');
		} finally {
			syncing = false;
		}
	}

	function formatDate(value: Date) {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		return new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short' }).format(value);
	}

	function formatPercent(value: number | null): string {
		if (value === null) {
			return t('pmf.noData');
		}
		return new Intl.NumberFormat(getLocale(), {
			style: 'percent',
			maximumFractionDigits: 1
		}).format(value);
	}
</script>

<section class="reports-panel" aria-labelledby="gs-reports-heading">
	<h2 id="gs-reports-heading">{t('admin.grannskafferietReports.title')}</h2>
	<p class="note">{t('admin.grannskafferietReports.note')}</p>
	<p class="market-link-row">
		<a class="market-link" href="/grannskafferiet/marknad">{t('admin.grannskafferietReports.marketLink')}</a>
	</p>

	{#if marketMetrics}
		<section class="metrics-grid" aria-labelledby="market-metrics-heading">
			<h3 id="market-metrics-heading">{t('admin.grannskafferietReports.marketMetricsTitle')}</h3>
			<div class="stats-grid">
				<Card>
					<p class="stat-label">{t('admin.grannskafferietReports.activeAutoListings')}</p>
					<p class="stat-value">{marketMetrics.activeAutoListings}</p>
				</Card>
				<Card>
					<p class="stat-label">{t('admin.grannskafferietReports.chatsStarted')}</p>
					<p class="stat-value">{marketMetrics.counts.market_chat_started}</p>
				</Card>
				<Card>
					<p class="stat-label">{t('admin.grannskafferietReports.messagesSent')}</p>
					<p class="stat-value">{marketMetrics.counts.market_chat_message_sent}</p>
				</Card>
				<Card>
					<p class="stat-label">{t('admin.grannskafferietReports.ratingsGiven')}</p>
					<p class="stat-value">{marketMetrics.counts.market_exchange_rated}</p>
				</Card>
				<Card>
					<p class="stat-label">{t('admin.grannskafferietReports.listingViews')}</p>
					<p class="stat-value">{marketMetrics.counts.market_listing_viewed}</p>
					<p class="stat-context">
						{t('admin.grannskafferietReports.listingToChatConversion', {
							rate: formatPercent(marketMetrics.listingToChatConversion)
						})}
					</p>
				</Card>
			</div>
		</section>
	{/if}
	<div class="sync-row">
		<button type="button" class="sync-btn" disabled={syncing} onclick={() => void syncAutoListing()}>
			{syncing ? t('admin.grannskafferietReports.syncing') : t('admin.grannskafferietReports.syncAutoListing')}
		</button>
		<p class="note">{t('admin.grannskafferietReports.syncAutoListingNote')}</p>
		{#if syncMessage}
			<p class="sync-ok" role="status">{syncMessage}</p>
		{/if}
		{#if syncError}
			<p class="sync-error" role="alert">{syncError}</p>
		{/if}
	</div>

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

	h3 {
		margin: 0;
		font-size: 1rem;
	}

	.metrics-grid {
		display: grid;
		gap: var(--space-sm);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-sm);
	}

	.stat-label {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.stat-value {
		margin: var(--space-2xs) 0 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.stat-context {
		margin: var(--space-2xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.market-link-row {
		margin: 0;
	}

	.market-link {
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.market-link:hover {
		text-decoration: underline;
	}

	.sync-row {
		display: grid;
		gap: var(--space-xs);
	}

	.sync-btn {
		justify-self: start;
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font-weight: 600;
		cursor: pointer;
	}

	.sync-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.sync-ok {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-success, var(--color-primary));
	}

	.sync-error {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-danger);
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
