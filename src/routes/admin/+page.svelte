<script lang="ts">
	import { getLocale, t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import AdminHealthDashboard from '$lib/components/organisms/AdminHealthDashboard.svelte';
	import AdminAiUsageDashboard from '$lib/components/organisms/AdminAiUsageDashboard.svelte';
	import PmfDashboard from '$lib/components/organisms/PmfDashboard.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { formatLastSeen } from '$lib/domain/presence';
	import type { ChurnReason } from '$lib/domain/product-feedback';

	let { data, form } = $props();

	function formatDate(value: Date) {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		return new Intl.DateTimeFormat(tag, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(value);
	}

	function statusLabel(account: (typeof data.users)[number]) {
		if (account.isActiveNow) {
			return t('admin.activeNow');
		}
		if (account.hasActiveSession) {
			return t('admin.loggedIn');
		}
		return t('admin.offline');
	}
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />

	<PageContainer>
	{#if form?.message}
		<p class="banner" role="alert">{form.message}</p>
	{/if}

	<AdminHealthDashboard stats={data.stats} />
	<AdminAiUsageDashboard summary={data.aiUsage} />
	<PmfDashboard review={data.pmfWeeklyReview} />

	<section class="pro-waitlist" id="waitlist">
		<Card>
			<div class="waitlist-header">
				<h2>{t('admin.waitlist.title')}</h2>
				<form method="GET" class="waitlist-limit-form">
					<label>
						{t('admin.showLatest')}
						<select name="waitlistLimit" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
							{#each [25, 50, 100] as limit}
								<option value={limit} selected={data.waitlistLimit === limit}>{limit}</option>
							{/each}
						</select>
					</label>
				</form>
			</div>
			<p class="waitlist-note">{t('admin.waitlist.note')}</p>
			<p class="waitlist-count">
				{t('admin.waitlist.count', { count: data.waitlistCount, target: data.waitlistTarget })}
			</p>
			{#if data.waitlistEntries.length === 0}
				<p class="waitlist-empty">{t('admin.waitlist.empty')}</p>
			{:else}
				<ul class="waitlist-list">
					{#each data.waitlistEntries as entry}
						<li class="waitlist-item">
							<time datetime={entry.createdAt.toISOString()}>{formatDate(entry.createdAt)}</time>
							<span class="waitlist-source">{entry.source}</span>
							<span class="waitlist-email">{entry.email}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</section>

	<section class="product-feedback" id="feedback">
		<Card>
			<div class="feedback-header">
				<h2>{t('admin.feedback.title')}</h2>
				<form method="GET" class="feedback-limit-form">
					<label>
						{t('admin.showLatest')}
						<select name="feedbackLimit" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
							{#each [25, 50, 100] as limit}
								<option value={limit} selected={data.feedbackLimit === limit}>{limit}</option>
							{/each}
						</select>
					</label>
				</form>
			</div>
			<p class="feedback-note">{t('admin.feedback.note')}</p>
			{#if data.productFeedback.length === 0}
				<p class="feedback-empty">{t('admin.feedback.empty')}</p>
			{:else}
				<ul class="feedback-list">
					{#each data.productFeedback as entry}
						<li class="feedback-item">
							<div class="feedback-summary">
								<time datetime={entry.createdAt.toISOString()}>
									{formatDate(entry.createdAt)}
								</time>
								<span class="feedback-source">{entry.source}</span>
								{#if entry.churnReason}
									<span class="feedback-reason">
										{t(`feedback.churnReasons.${entry.churnReason as ChurnReason}`)}
									</span>
								{/if}
								<span class="feedback-user">{entry.userEmail}</span>
							</div>
							<p class="feedback-message">{entry.message}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</section>

	<section class="error-logs" id="felloggar">
		<Card>
			<div class="error-logs-header">
				<h2>{t('admin.errorLogs')}</h2>
				<form method="GET" class="error-limit-form">
					<label>
						{t('admin.showLatest')}
						<select name="errorLimit" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
							{#each [25, 50, 100] as limit}
								<option value={limit} selected={data.errorLimit === limit}>{limit}</option>
							{/each}
						</select>
					</label>
				</form>
			</div>
			<p class="error-logs-note">
				{t('admin.errorLogsNote')}
			</p>
			{#if data.errors.length === 0}
				<p class="error-empty">{t('admin.noErrors')}</p>
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
									<summary>{t('admin.stack')}</summary>
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
		<h2>{t('admin.sessionManagement')}</h2>
		<p class="logout-note">
			{t('admin.logoutAllNote')}
		</p>
		<form method="POST" action="?/logoutAll" class="logout-all-form">
			<label>
				{t('admin.confirmYes', { yes: 'yes' })}
				<input name="confirm" required autocomplete="off" placeholder="yes" />
			</label>
			<Button type="submit" variant="danger">{t('admin.logoutAll')}</Button>
		</form>
	</Card>
	</section>

	<Card>
		<h2>{t('admin.users')}</h2>
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
					{#each data.users as account}
						<tr>
							<td>
								{account.email}
								{#if account.id === data.user?.id}
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
											disabled={account.id === data.user?.id}
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
	</Card>
	</PageContainer>
</AppLayout>

<style>
	.banner {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: #fde8e8;
		color: #8a1f1f;
	}

	.product-feedback {
		margin-bottom: var(--space-lg);
	}

	.pro-waitlist {
		margin-bottom: var(--space-lg);
	}

	.waitlist-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.waitlist-header h2 {
		margin: 0;
	}

	.waitlist-limit-form label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.waitlist-limit-form select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.waitlist-note,
	.waitlist-empty,
	.waitlist-count {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.waitlist-count {
		font-weight: 600;
		color: var(--color-text);
	}

	.waitlist-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.waitlist-item {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.waitlist-item:last-child {
		border-bottom: none;
	}

	.waitlist-source {
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.waitlist-email {
		font-weight: 500;
	}

	.feedback-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.feedback-header h2 {
		margin: 0;
	}

	.feedback-limit-form label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.feedback-limit-form select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.feedback-note,
	.feedback-empty {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.feedback-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.feedback-item {
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.feedback-item:last-child {
		border-bottom: none;
	}

	.feedback-summary {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: baseline;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.feedback-reason {
		font-weight: 600;
		color: var(--color-text);
	}

	.feedback-message {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		white-space: pre-wrap;
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
