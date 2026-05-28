<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';

	let { data, form } = $props();

	function formatDate(value: Date) {
		return new Intl.DateTimeFormat('sv-SE', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(value);
	}
</script>

<AppLayout wide>
	<AppHeader title="Admin" subtitle="Hantera användare och översikt" user={data.user} />

	{#if form?.message}
		<p class="banner" role="alert">{form.message}</p>
	{/if}

	<section class="stats">
		<Card>
			<p class="stat-label">Användare</p>
			<p class="stat-value">{data.stats.userCount}</p>
		</Card>
		<Card>
			<p class="stat-label">Inventarieposter</p>
			<p class="stat-value">{data.stats.inventoryCount}</p>
		</Card>
		<Card>
			<p class="stat-label">Måltidsplaner</p>
			<p class="stat-value">{data.stats.mealPlanCount}</p>
		</Card>
		<Card>
			<p class="stat-label">Husdjur</p>
			<p class="stat-value">{data.stats.petCount}</p>
		</Card>
	</section>

	<Card>
		<h2>Användare</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>E-post</th>
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
								<span class:admin-badge={account.role === 'admin'}>
									{account.role === 'admin' ? 'Admin' : 'Användare'}
								</span>
							</td>
							<td>{account.petsEnabled ? 'På' : 'Av'}</td>
							<td>{account.inventoryCount}</td>
							<td>{formatDate(account.createdAt)}</td>
							<td class="actions">
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

	h2 {
		margin: 0 0 var(--space-md);
		font-size: 1.1rem;
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
