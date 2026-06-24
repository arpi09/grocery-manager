<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { getLocale, t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';

	let { data } = $props();

	const scanHref = $derived(scanHubHref('/inventory/merge'));
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('merge.pageTitle')}
		subtitle={t('merge.pageSubtitle')}
		backFallback="/inventory"
		backLabel={t('dataGrid.backToPantry')}
	/>

	<PageContainer>
		{#if data.duplicateGroups.length === 0}
			<EmptyState
				iconId="box"
				title={t('merge.emptyTitle')}
				description={t('merge.emptyDescription')}
				actionLabel={t('merge.emptyAction')}
				actionHref={scanHref}
				primaryAnalyticsId="merge.empty_scan"
			/>
		{:else}
			<section class="merge-list" aria-label={t('merge.listAria')}>
				<p class="intro">{t('merge.intro')}</p>
				<ul class="groups">
					{#each data.duplicateGroups as group (group.location + group.displayName)}
						<li>
							<Card href="/inventory/{group.location}" interactive class="group-card">
								<span class="name">{group.displayName}</span>
								<span class="meta">
									{locationLabel(getLocale(), group.location)} ·
									{t('merge.itemCount', { count: group.count })}
								</span>
							</Card>
						</li>
					{/each}
				</ul>
				{#if data.canWrite}
					<p class="scan-hint">
						<a href={scanHref} data-analytics-id="merge.scan_hint">{t('merge.scanHint')}</a>
					</p>
				{/if}
			</section>
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.intro {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.groups {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	:global(.group-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.name {
		font-weight: 700;
		font-size: 1.05rem;
	}

	.meta {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.scan-hint {
		margin: var(--space-md) 0 0;
		font-size: 0.875rem;
	}

	.scan-hint a {
		font-weight: 600;
	}
</style>
