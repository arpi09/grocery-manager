<script lang="ts">
	import type { HouseholdActivityEvent } from '$lib/domain/household-activity';
	import { t } from '$lib/i18n';

	interface Props {
		events: HouseholdActivityEvent[];
	}

	let { events }: Props = $props();

	function eventLabel(event: HouseholdActivityEvent): string {
		if (event.eventType === 'inventory_write' && event.action) {
			return t(`home.activity.inventoryWrite.${event.action}` as never);
		}
		if (event.eventType === 'batch_review_completed') return t('home.activity.batchReview');
		if (event.eventType === 'staleness_confirmed') return t('home.activity.stalenessConfirmed');
		if (event.eventType === 'receipt_finish_accepted') return t('home.activity.receiptFinishAccepted');
		return event.eventType;
	}

	function timeLabel(date: Date): string {
		return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(date);
	}
</script>

<section class="activity-feed" aria-label={t('home.activity.title')}>
	<h2>{t('home.activity.title')}</h2>
	{#if events.length === 0}
		<p class="empty">{t('home.activity.empty')}</p>
	{:else}
		<ul>
			{#each events as event (event.id)}
				<li>
					<span>{eventLabel(event)}</span>
					<time>{timeLabel(event.createdAt)}</time>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.activity-feed ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.activity-feed li {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
	}
	.empty {
		margin: 0;
		color: var(--color-text-muted);
	}
</style>
