<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import {
		ERROR_LOG_ADMIN_LIST_DEFAULT,
		ERROR_LOG_ADMIN_LIST_MAX,
		type AppErrorSummary
	} from '$lib/domain/error-log';
	import { getLocale, t } from '$lib/i18n';

	interface ErrorsPayload {
		errors: (Omit<AppErrorSummary, 'createdAt'> & { createdAt: string })[];
		limit: number;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let errors = $state<AppErrorSummary[]>([]);
	let limit = $state(ERROR_LOG_ADMIN_LIST_DEFAULT);
	let loaded = $state(false);
	let stackById = $state<Record<string, string | null>>({});
	let stackLoadingId = $state<string | null>(null);

	$effect(() => {
		if (!active) {
			return;
		}
		void loadErrors();
	});

	async function loadErrors(nextLimit = limit) {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<ErrorsPayload>('errors', { limit: nextLimit });
			errors = payload.errors.map((entry) => ({
				...entry,
				createdAt: parseIsoDate(entry.createdAt)
			}));
			limit = payload.limit;
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
				onchange={(e) => loadErrors(Number(e.currentTarget.value))}
			>
				{#each [25, 50, 100] as option}
					<option value={option} disabled={option > ERROR_LOG_ADMIN_LIST_MAX}>{option}</option>
				{/each}
			</select>
		</label>
	</div>
	<p class="error-logs-note">{t('admin.errorLogsNote')}</p>

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
	.panel-status {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.panel-error {
		color: #8a1f1f;
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
		color: #8a1f1f;
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
		background: #f5f5f5;
		border-radius: var(--radius-sm);
	}

	.stack-loading,
	.stack-empty {
		margin: var(--space-xs) 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
