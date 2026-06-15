<script lang="ts">
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import { daysUntilExpiry } from '$lib/domain/expiry';
	import { t } from '$lib/i18n';

	interface Props {
		expiringSoon: DashboardSummary['expiringSoon'];
	}

	let { expiringSoon }: Props = $props();

	const visible = $derived(expiringSoon.slice(0, 3));
</script>

{#if visible.length > 0}
	<section class="expiring-list" aria-label={t('home.expiring.ariaLabel')} data-testid="home-expiring-list">
		<ul class="rows">
			{#each visible as item (item.id)}
				<li class="row product-row">
					<span class="name">{item.name}</span>
					<span class="meta" aria-hidden="true">·</span>
					<span class="days">
						{#if item.expiresOn}
							{t('home.expiring.daysLeft', { days: daysUntilExpiry(item.expiresOn) })}
						{/if}
					</span>
				</li>
			{/each}
		</ul>
		{#if expiringSoon.length > 3}
			<a class="more-link" href="/inventory/fridge?filter=expiring">{t('home.expiring.moreLink')}</a>
		{/if}
	</section>
{/if}

<style>
	.expiring-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		min-height: var(--touch-target-min);
	}

	.row:last-child {
		border-bottom: none;
	}

	.name {
		flex: 1;
		min-width: 0;
		font-size: 0.875rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		color: var(--color-text-muted);
	}

	.days {
		flex-shrink: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.more-link {
		align-self: flex-start;
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		padding: var(--space-xs) var(--space-xs);
		min-height: var(--touch-target-min);
		display: inline-flex;
		align-items: center;
	}
</style>
