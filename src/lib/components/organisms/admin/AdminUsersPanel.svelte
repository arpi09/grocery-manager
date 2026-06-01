<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import { ADMIN_USER_LIST_DEFAULT, ADMIN_USER_LIST_MAX } from '$lib/domain/admin-users';
	import { formatLastSeen } from '$lib/domain/presence';
	import { getLocale, t } from '$lib/i18n';
	import type { AdminUserSummary } from '$lib/infrastructure/repositories/admin.repository';

	interface UsersPayload {
		users: (Omit<AdminUserSummary, 'createdAt' | 'lastSeenAt'> & {
			createdAt: string;
			lastSeenAt: string | null;
		})[];
		total: number;
		limit: number;
		offset: number;
	}

	interface Props {
		active: boolean;
		currentUserId: string;
	}

	let { active, currentUserId }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let users = $state<AdminUserSummary[]>([]);
	let total = $state(0);
	let limit = $state(ADMIN_USER_LIST_DEFAULT);
	let offset = $state(0);
	let loaded = $state(false);

	const pageCount = $derived(Math.max(1, Math.ceil(total / limit)));
	const currentPage = $derived(Math.floor(offset / limit) + 1);

	$effect(() => {
		if (!active) {
			return;
		}
		void loadUsers();
	});

	async function loadUsers(nextOffset = offset, nextLimit = limit) {
		loading = true;
		error = null;
		try {
			const payload = await fetchAdminData<UsersPayload>('users', {
				limit: nextLimit,
				offset: nextOffset
			});
			users = payload.users.map((user) => ({
				...user,
				createdAt: parseIsoDate(user.createdAt),
				lastSeenAt: user.lastSeenAt ? parseIsoDate(user.lastSeenAt) : null
			}));
			total = payload.total;
			limit = payload.limit;
			offset = payload.offset;
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

	function statusLabel(account: AdminUserSummary) {
		if (account.isActiveNow) {
			return t('admin.activeNow');
		}
		if (account.hasActiveSession) {
			return t('admin.loggedIn');
		}
		return t('admin.offline');
	}

	function changeLimit(nextLimit: number) {
		void loadUsers(0, nextLimit);
	}

	function goToPage(page: number) {
		const nextOffset = (page - 1) * limit;
		void loadUsers(nextOffset, limit);
	}
</script>

<Card>
	<div class="users-header">
		<h2>{t('admin.users')}</h2>
		<label>
			{t('admin.showLatest')}
			<select
				value={limit}
				disabled={loading}
				onchange={(e) => changeLimit(Number(e.currentTarget.value))}
			>
				{#each [25, 50, 100] as option}
					<option value={option} disabled={option > ADMIN_USER_LIST_MAX}>{option}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if loading && !loaded}
		<p class="panel-status">{t('admin.loading')}</p>
	{:else if error}
		<p class="panel-status panel-error" role="alert">{error}</p>
	{:else}
		<p class="users-count">{t('admin.usersCount', { count: total })}</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>{t('admin.email')}</th>
						<th>{t('admin.status')}</th>
						<th>{t('admin.lastSeen')}</th>
						<th>{t('admin.roleCol')}</th>
						<th>{t('admin.petsCol')}</th>
						<th>{t('admin.inventoryCol')}</th>
						<th>{t('admin.utmSourceCol')}</th>
						<th>{t('admin.createdCol')}</th>
						<th>{t('admin.actionsCol')}</th>
					</tr>
				</thead>
				<tbody>
					{#each users as account (account.id)}
						<tr>
							<td>
								{account.email}
								{#if account.id === currentUserId}
									<span class="you">{t('admin.you')}</span>
								{/if}
							</td>
							<td>
								<span
									class="status-pill"
									class:active={account.isActiveNow}
									class:logged-in={!account.isActiveNow && account.hasActiveSession}
								>
									{statusLabel(account)}
								</span>
							</td>
							<td>{formatLastSeen(account.lastSeenAt)}</td>
							<td>
								<span class:admin-badge={account.role === 'admin'}>
									{account.role === 'admin' ? t('admin.title') : t('admin.userRole')}
								</span>
							</td>
							<td>{account.petsEnabled ? t('admin.on') : t('admin.off')}</td>
							<td>{account.inventoryCount}</td>
							<td>{account.signupUtmSource ?? '—'}</td>
							<td>{formatDate(account.createdAt)}</td>
							<td class="actions">
								<form method="POST" action="?/logoutUser">
									<input type="hidden" name="userId" value={account.id} />
									<Button type="submit" variant="danger">{t('admin.logoutUser')}</Button>
								</form>

								{#if account.role === 'admin'}
									<form method="POST" action="?/setRole">
										<input type="hidden" name="userId" value={account.id} />
										<input type="hidden" name="role" value="user" />
										<Button
											type="submit"
											variant="secondary"
											disabled={account.id === currentUserId}
										>
											{t('admin.removeAdmin')}
										</Button>
									</form>
								{:else}
									<form method="POST" action="?/setRole">
										<input type="hidden" name="userId" value={account.id} />
										<input type="hidden" name="role" value="admin" />
										<Button type="submit" variant="secondary">{t('admin.makeAdmin')}</Button>
									</form>
								{/if}

								<form method="POST" action="?/setPets">
									<input type="hidden" name="userId" value={account.id} />
									<input
										type="hidden"
										name="enabled"
										value={account.petsEnabled ? 'false' : 'true'}
									/>
									<Button type="submit" variant="secondary">
										{account.petsEnabled ? t('admin.disablePets') : t('admin.enablePets')}
									</Button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if pageCount > 1}
			<nav class="pagination" aria-label={t('admin.pagination')}>
				<Button
					type="button"
					variant="secondary"
					disabled={loading || currentPage <= 1}
					onclick={() => goToPage(currentPage - 1)}
				>
					{t('admin.prevPage')}
				</Button>
				<span>{t('admin.pageOf', { page: currentPage, total: pageCount })}</span>
				<Button
					type="button"
					variant="secondary"
					disabled={loading || currentPage >= pageCount}
					onclick={() => goToPage(currentPage + 1)}
				>
					{t('admin.nextPage')}
				</Button>
			</nav>
		{/if}
	{/if}
</Card>

<style>
	.users-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.users-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.users-header label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.users-header select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.panel-status {
		margin: 0;
		color: var(--color-text-muted);
	}

	.panel-error {
		color: #8a1f1f;
	}

	.users-count {
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
		padding: var(--space-sm);
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		vertical-align: top;
	}

	th {
		color: var(--color-text-muted);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.you {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.status-pill {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: #eceff1;
		color: #546e7a;
		font-weight: 600;
		font-size: 0.8rem;
	}

	.status-pill.active {
		background: #e8f5e9;
		color: #1b5e20;
	}

	.status-pill.logged-in {
		background: #fff8e1;
		color: #f57f17;
	}

	.admin-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: #e8f5e9;
		color: #1b5e20;
		font-weight: 600;
		font-size: 0.8rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-width: 11rem;
	}

	.pagination {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-top: var(--space-md);
	}

	@media (max-width: 900px) {
		.actions {
			min-width: 8rem;
		}
	}
</style>
