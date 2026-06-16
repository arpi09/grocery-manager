<script lang="ts">
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import SkaffuList from '$lib/components/molecules/SkaffuList.svelte';
	import SkaffuListItem from '$lib/components/molecules/SkaffuListItem.svelte';
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
		<SkaffuList>
			{#each visible as item (item.id)}
				<SkaffuListItem data-testid="home-expiring-row-{item.id}">
					<span class="name">{item.name}</span>
					<span class="meta" aria-hidden="true">·</span>
					<span class="days">
						{#if item.expiresOn}
							{t('home.expiring.daysLeft', { days: daysUntilExpiry(item.expiresOn) })}
						{/if}
					</span>
				</SkaffuListItem>
			{/each}
		</SkaffuList>
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

	:global(.expiring-list .skaffu-list-item .mdc-deprecated-list-item__wrapper) {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.name {
		flex: 1;
		min-width: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		color: var(--color-text-muted);
	}

	.days {
		flex-shrink: 0;
		font-size: 0.75rem;
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
