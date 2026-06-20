<script lang="ts">
	import { page } from '$app/state';
	import Card from '$lib/components/atoms/Card.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { PANTRY_SHELF_PATH } from '$lib/navigation/nav-config';
	import { t } from '$lib/i18n';

	interface Props {
		expiringSoon: InventoryItem[];
		plannedMealCount: number;
	}

	let { expiringSoon, plannedMealCount }: Props = $props();

	const expiringCount = $derived(expiringSoon.length);
	const previewNames = $derived(
		expiringSoon
			.slice(0, 3)
			.map((item) => item.name)
			.join(', ')
	);

	const homeHref = $derived(
		page.data.homeUxV2Enabled
			? APP_HOME_PATH
			: page.data.pantryUxV2Enabled
				? `${PANTRY_SHELF_PATH}?filter=expiring`
				: APP_HOME_PATH
	);
</script>

<section class="planer-context" aria-labelledby="planer-context-heading">
	<Card>
		<h2 id="planer-context-heading" class="heading">{t('planer.contextTitle')}</h2>
		<p class="lead">{t('planer.contextLead', { days: EXPIRING_SOON_DAYS })}</p>

		{#if expiringCount > 0}
			<p class="expiring">
				{t('planer.contextExpiring', { count: expiringCount, days: EXPIRING_SOON_DAYS })}
				{#if previewNames}
					<span class="names">— {previewNames}</span>
				{/if}
			</p>
		{:else}
			<p class="expiring muted">{t('planer.contextNoExpiring', { days: EXPIRING_SOON_DAYS })}</p>
		{/if}

		{#if plannedMealCount > 0}
			<p class="planned">{t('planer.contextPlanned', { count: plannedMealCount })}</p>
		{/if}

		<p class="actions">
			<a class="weekly-link" href="/planer/vecka">{t('planer.contextWeeklyLink')}</a>
			<a class="home-link" href={homeHref}>{t('planer.contextHomeLink')}</a>
			<a class="calendar-link" href="#ata-calendar">{t('planer.contextWeekViewLink')}</a>
		</p>
	</Card>
</section>

<style>
	.planer-context {
		margin-bottom: var(--page-section-gap);
	}

	.heading {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
	}

	.lead {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.expiring,
	.planned {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.expiring.muted {
		color: var(--color-text-muted);
	}

	.names {
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin: var(--space-xs) 0 0;
	}

	.weekly-link,
	.home-link,
	.calendar-link {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.weekly-link:hover,
	.home-link:hover,
	.calendar-link:hover {
		text-decoration: underline;
	}
</style>
