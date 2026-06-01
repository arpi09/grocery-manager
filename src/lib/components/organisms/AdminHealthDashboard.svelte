<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { ACTIVE_USER_WINDOW_MS, formatLastSeen } from '$lib/domain/presence';
	import { t } from '$lib/i18n';
	import type { AdminDashboardStats } from '$lib/infrastructure/repositories/admin.repository';

	interface Props {
		stats: AdminDashboardStats;
	}

	let { stats }: Props = $props();

	const activeWindowMinutes = Math.round(ACTIVE_USER_WINDOW_MS / 60_000);
	const databaseLabel = $derived(stats.databaseBackend === 'pglite' ? 'PGlite' : 'PostgreSQL');
</script>

<section class="health-dashboard" aria-labelledby="health-dashboard-heading">
	<div class="dashboard-header">
		<h2 id="health-dashboard-heading">{t('admin.healthTitle')}</h2>
		<span class="db-badge" title={t('admin.dbEngine')}>{databaseLabel}</span>
	</div>

	<div class="stats-grid">
		<Card>
			<p class="stat-label">{t('admin.statUsers')}</p>
			<p class="stat-value">{stats.userCount}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.statHouseholds')}</p>
			<p class="stat-value">{stats.householdCount}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.statMemberships')}</p>
			<p class="stat-value">{stats.membershipCount}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.statInventory')}</p>
			<p class="stat-value">{stats.inventoryCount}</p>
		</Card>

		{#if stats.shoppingListItemCount !== null}
			<Card>
				<p class="stat-label">{t('admin.statShopping')}</p>
				<p class="stat-value">{stats.shoppingListItemCount}</p>
			</Card>
		{/if}

		<Card>
			<p class="stat-label">{t('admin.statErrors7d')}</p>
			<p class="stat-value">{stats.errorCount7Days}</p>
		</Card>

		<Card href="/admin?tab=logs" interactive>
			<p class="stat-label">{t('admin.statErrorsTotal')}</p>
			<p class="stat-value">{stats.errorCountTotal}</p>
			<p class="stat-note">{t('admin.viewErrorLogs')}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.statActiveNow')}</p>
			<p class="stat-value">{stats.activeNowCount}</p>
			<p class="stat-note">{t('admin.statRecentWindow', { minutes: activeWindowMinutes })}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.statLoggedInSessions')}</p>
			<p class="stat-value">{stats.activeSessionCount}</p>
		</Card>

		<Card>
			<p class="stat-label">{t('admin.statLastActivity')}</p>
			<p class="stat-value stat-value--compact">{formatLastSeen(stats.lastActivityAt)}</p>
		</Card>
	</div>
</section>

<style>
	.health-dashboard {
		margin-bottom: var(--space-lg);
	}

	.dashboard-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.dashboard-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.db-badge {
		display: inline-block;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		background: #eceff1;
		color: #37474f;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-md);
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

	.stat-value--compact {
		font-size: 1.1rem;
		font-weight: 600;
		line-height: 1.35;
	}

	.stat-note {
		margin: 0.2rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}
</style>
