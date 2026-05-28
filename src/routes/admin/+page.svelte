<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { ACTIVE_USER_WINDOW_MS, formatLastSeen } from '$lib/domain/presence';

	let { data, form } = $props();

	const activeWindowMinutes = Math.round(ACTIVE_USER_WINDOW_MS / 60_000);

	function formatDate(value: Date) {
		return new Intl.DateTimeFormat('sv-SE', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(value);
	}

	function statusLabel(account: (typeof data.users)[number]) {
		if (account.isActiveNow) {
			return 'Aktiv nu';
		}
		if (account.hasActiveSession) {
			return 'Inloggad';
		}
		return 'Offline';
	}
</script>

<AppLayout wide user={data.user}>
	<AppHeader title="Admin" subtitle="Hantera användare och översikt" />

	{#if form?.message}
		<p class="banner" role="alert">{form.message}</p>
	{/if}

	<section class="stats">
		<Card>
			<p class="stat-label">Användare</p>
			<p class="stat-value">{data.stats.userCount}</p>
		</Card>
		<Card>
			<p class="stat-label">Aktiva nu</p>
			<p class="stat-value">{data.stats.activeNowCount}</p>
			<p class="stat-note">Senaste {activeWindowMinutes} min</p>
		</Card>
		<Card>
			<p class="stat-label">Inloggade sessioner</p>
			<p class="stat-value">{data.stats.activeSessionCount}</p>
		</Card>
		<Card>
			<p class="stat-label">Inventarieposter</p>
			<p class="stat-value">{data.stats.inventoryCount}</p>
		</Card>
	</section>

	<section class="error-logs">
		<Card>
			<div class="error-logs-header">
				<h2>Felloggar</h2>
				<form method="GET" class="error-limit-form">
					<label>
						Visa senaste
						<select name="errorLimit" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
							{#each [25, 50, 100] as limit}
								<option value={limit} selected={data.errorLimit === limit}>{limit}</option>
							{/each}
						</select>
					</label>
				</form>
			</div>
			<p class="error-logs-note">
				Senaste serverfel (max 200 poster / 7 dagar). Lösenord och tokens lagras aldrig.
			</p>
			{#if data.errors.length === 0}
				<p class="error-empty">Inga fel loggade ännu.</p>
			{:else}
				<ul class="error-list">
					{#each data.errors as entry}
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
							{#if entry.stack}
								<details>
									<summary>Stack</summary>
									<pre>{entry.stack}</pre>
								</details>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</section>

	<section class="session-mgmt">
	<Card>
		<h2>Sessionshantering</h2>
		<p class="logout-note">
			Logga ut alla avslutar varje aktiv session, inklusive din egen. Användare måste logga in igen.
		</p>
		<form method="POST" action="?/logoutAll" class="logout-all-form">
			<label>
				Skriv <strong>yes</strong> för att bekräfta
				<input name="confirm" required autocomplete="off" placeholder="yes" />
			</label>
			<Button type="submit" variant="danger">Logga ut alla</Button>
		</form>
	</Card>
	</section>

	<Card>
		<h2>Användare</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>E-post</th>
						<th>Status</th>
						<th>Senast sedd</th>
						<th>Roll</th>
						<th>Husdjur</th>
						<th>Inventarie</th>
						<th>Skapad</th>
						<th>Åtgärder</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as account}
						<tr>
							<td>
								{account.email}
								{#if account.id === data.user?.id}
									<span class="you">(du)</span>
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
									{account.role === 'admin' ? 'Admin' : 'Användare'}
								</span>
							</td>
							<td>{account.petsEnabled ? 'På' : 'Av'}</td>
							<td>{account.inventoryCount}</td>
							<td>{formatDate(account.createdAt)}</td>
							<td class="actions">
								<form method="POST" action="?/logoutUser">
									<input type="hidden" name="userId" value={account.id} />
									<Button type="submit" variant="danger">Logga ut</Button>
								</form>

								{#if account.role === 'admin'}
									<form method="POST" action="?/setRole">
										<input type="hidden" name="userId" value={account.id} />
										<input type="hidden" name="role" value="user" />
										<Button
											type="submit"
											variant="secondary"
											disabled={account.id === data.user?.id}
										>
											Ta bort admin
										</Button>
									</form>
								{:else}
									<form method="POST" action="?/setRole">
										<input type="hidden" name="userId" value={account.id} />
										<input type="hidden" name="role" value="admin" />
										<Button type="submit" variant="secondary">Gör admin</Button>
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
										{account.petsEnabled ? 'Stäng av husdjur' : 'Aktivera husdjur'}
									</Button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>
</AppLayout>

<style>
	.banner {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: #fde8e8;
		color: #8a1f1f;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.stat-label {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.stat-value {
		margin: var(--space-xs) 0 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.stat-note {
		margin: 0.2rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	.error-logs {
		margin-bottom: var(--space-lg);
	}

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
	}

	.error-limit-form label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.error-limit-form select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.error-logs-note,
	.error-empty {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
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

	.session-mgmt {
		margin-bottom: var(--space-lg);
	}

	h2 {
		margin: 0 0 var(--space-md);
		font-size: 1.1rem;
	}

	.logout-note {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.logout-all-form {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: flex-end;
	}

	.logout-all-form label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		min-width: 12rem;
	}

	.logout-all-form input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
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

	@media (max-width: 900px) {
		.actions {
			min-width: 8rem;
		}
	}
</style>
