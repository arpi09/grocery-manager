<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import ExpandableCopy from '$lib/components/molecules/ExpandableCopy.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { expiringItemsHref } from '$lib/navigation/context-hrefs';
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

	const homeHref = expiringItemsHref();
</script>

<section class="planer-context" aria-labelledby="planer-context-heading">
	<Card>
		<h2 id="planer-context-heading" class="heading">{t('planer.contextTitle')}</h2>

		<!-- Outline, not filled: the hero's "Generera maträtt" is the page's single primary CTA. -->
		<div class="actions" role="group" aria-label={t('planer.contextActionsAria')}>
			<a class="action-btn" href="/planer/vecka">
				{t('planer.contextWeeklyLink')}
			</a>
			<a class="text-action home-link" href={homeHref}>{t('planer.contextHomeLink')}</a>
			<a class="text-action" href="#ata-calendar">{t('planer.contextWeekViewLink')}</a>
		</div>
		<p class="cta-hint">{t('planer.contextWeeklyHint')}</p>

		<ExpandableCopy preview={t('planer.contextLeadShort')} class="details">
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
		</ExpandableCopy>
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

	.details {
		margin-top: var(--space-sm);
		font-size: 0.9rem;
	}

	.lead {
		margin: 0;
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

	.cta-hint {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.names {
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.5rem;
		padding: 0.4rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}

	.action-btn:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
		text-decoration: none;
	}

	.action-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.text-action {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.text-action:hover {
		color: var(--color-primary-hover);
	}
</style>
