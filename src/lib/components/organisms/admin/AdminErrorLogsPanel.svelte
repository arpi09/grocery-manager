<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import {
		ERROR_LOG_ADMIN_LIST_DEFAULT,
		ERROR_LOG_ADMIN_LIST_MAX,
		type AppErrorPathCount,
		type AppErrorSummary
	} from '$lib/domain/error-log';
	import { getLocale, t } from '$lib/i18n';

	interface ErrorsPayload {
		errors: (Omit<AppErrorSummary, 'createdAt'> & { createdAt: string })[];
		limit: number;
		path?: string | null;
	}

	interface ErrorPathStatsPayload {
		paths: AppErrorPathCount[];
		limit: number;
		windowHours: number;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let errors = $state<AppErrorSummary[]>([]);
	let pathStats = $state<AppErrorPathCount[]>([]);
	let limit = $state(ERROR_LOG_ADMIN_LIST_DEFAULT);
	let pathFilter = $state<string | null>(null);
	let loaded = $state(false);
	let stackById = $state<Record<string, string | null>>({});
	let stackLoadingId = $state<string | null>(null);

	$effect(() => {
		if (!active) {
			return;
		}
		void loadPanel();
	});

	async function loadPanel(nextLimit = limit, nextPath = pathFilter) {
		loading = true;
		error = null;
		try {
			const params: Record<string, string | number> = { limit: nextLimit };
			if (nextPath) params.path = nextPath;
			const [errorsPayload, statsPayload] = await Promise.all([
				fetchAdminData<ErrorsPayload>('errors', params),
				fetchAdminData<ErrorPathStatsPayload>('errorPathStats')
			]);
			errors = errorsPayload.errors.map((entry) => ({
				...entry,
				createdAt: parseIsoDate(entry.createdAt)
			}));
			pathStats = statsPayload.paths;
			limit = errorsPayload.limit;
			pathFilter = errorsPayload.path ?? nextPath ?? null;
			stackById = {};
			loaded = true;
		} catch {
			error = t('admin.loadError');
		} finally {
			loading = false;
		}
	}

	async function loadStack(id: string) {
		if (stackById[id] !== undefined || stackLoadingId === id) {
			return;
		}
		stackLoadingId = id;
		try {
			const payload = await fetchAdminData<{ stack: string | null }>('errorStack', { id });
			stackById = { ...stackById, [id]: payload.stack };
		} catch {
			stackById = { ...stackById, [id]: null };
		} finally {
			stackLoadingId = null;
		}
	}

	function formatDate(value: Date) {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		return new Intl.DateTimeFormat(tag, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(value);
	}
</script>

<Card>
	<div class="error-logs-header">
		<h2>{t('admin.errorLogs')}</h2>
		<label>
			{t('admin.showLatest')}
			<select
				value={limit}
				disabled={loading}
				onchange={(e) => loadPanel(Number(e.currentTarget.value), pathFilter)}
			>
				{#each [25, 50, 100] as option}
					<option value={option} disabled={option > ERROR_LOG_ADMIN_LIST_MAX}>{option}</option>
				{/each}
			</select>
		</label>
	</div>
	<p class="error-logs-note">{t('admin.errorLogsNote')}</p>

	{#if pathStats.length > 0}
		<section class="path-stats" aria-label={t('admin.errorPathStatsTitle')}>
			<h3>{t('admin.errorPathStatsTitle')}</h3>
			<ul class="path-stats-list">
				{#each pathStats as row (row.path)}
					<li>
						<button
							type="button"
							class="path-stat"
							onclick={() => {
								pathFilter = row.path;
								void loadPanel(limit, row.path);
							}}
						>
							<code>{row.path}</code>
							<span>{t('admin.errorPathCount', { count: row.count })}</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if pathFilter}
		<p class="path-filter-active">
			{t('admin.errorPathFilterActive', { path: pathFilter })}
			<button
				type="button"
				class="path-filter-clear"
				onclick={() => {
					pathFilter = null;
					void loadPanel(limit, null);
				}}
			>
				{t('admin.errorPathClear')}
			</button>
		</p>
	{/if}

	{#if loading && !loaded}
		<p class="panel-status">{t('admin.loading')}</p>
	{:else if error}
		<p class="panel-status panel-error" role="alert">{error}</p>
	{:else if errors.length === 0}
		<p class="error-empty">{t('admin.noErrors')}</p>
	{:else}
		<ul class="error-list">
			{#each errors as entry (entry.id)}
				<li class="error-item">
					<div class="error-summary">
						<time datetime={entry.createdAt.toISOString()}>
							{formatDate(entry.createdAt)}
						</time>
						<span class="error-status">{entry.statusCode ?? '—'}</span>
						<code class="error-path">{entry.path}</code>
						{#if entry.userId}
							<span class="error-user">user: {entry.userId}</span>
						{/if}
					</div>
					<p class="error-message">{entry.message}</p>
					{#if entry.hasStack}
						<details
							ontoggle={(e) => {
								if (e.currentTarget.open) {
									void loadStack(entry.id);
								}
							}}
						>
							<summary>{t('admin.stack')}</summary>
							{#if stackLoadingId === entry.id}
								<p class="stack-loading">{t('admin.loading')}</p>
							{:else if stackById[entry.id]}
								<pre>{stackById[entry.id]}</pre>
							{:else if stackById[entry.id] === null}
								<p class="stack-empty">{t('admin.noStack')}</p>
							{/if}
						</details>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</Card>

<style>
	.error-logs-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.error-logs-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.error-logs-header label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.error-logs-header select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.error-logs-note,
	.error-empty,
	.panel-status,
	.path-filter-active {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.path-stats {
		margin-bottom: var(--space-md);
	}

	.path-stats h3 {
		margin: 0 0 var(--space-sm);
		font-size: 0.95rem;
	}

	.path-stats-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.path-stat {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 0.35rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		cursor: pointer;
		font: inherit;
	}

	.path-stat code {
		font-size: 0.8rem;
	}

	.path-filter-clear {
		margin-left: var(--space-sm);
		font: inherit;
		cursor: pointer;
		text-decoration: underline;
		background: none;
		border: none;
		padding: 0;
		color: inherit;
	}

	.panel-error {
		color: var(--color-danger);
	}

	.error-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.error-item {
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.error-item:last-child {
		border-bottom: none;
	}

	.error-summary {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: baseline;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.error-status {
		font-weight: 700;
		color: var(--color-danger);
	}

	.error-path {
		font-size: 0.8rem;
	}

	.error-user {
		font-size: 0.8rem;
	}

	.error-message {
		margin: var(--space-xs) 0 0;
		font-weight: 600;
	}

	.error-item details {
		margin-top: var(--space-xs);
	}

	.error-item pre {
		margin: var(--space-xs) 0 0;
		padding: var(--space-sm);
		overflow-x: auto;
		font-size: 0.75rem;
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
	}

	.stack-loading,
	.stack-empty {
		margin: var(--space-xs) 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
