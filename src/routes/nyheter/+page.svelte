<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import NewsTimeline from '$lib/components/organisms/NewsTimeline.svelte';
	import { APP_NEWS_ITEMS } from '$lib/data/app-news';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<svelte:head>
	<meta name="description" content={t('news.metaDescription')} />
</svelte:head>

<AppLayout user={data.user}>
	<AppHeader title={t('news.title')} subtitle={t('news.subtitle')} />
	<PageContainer>
		<p class="lead">{t('news.lead')}</p>
		<NewsTimeline items={APP_NEWS_ITEMS} />
	</PageContainer>
</AppLayout>

<style>
	.lead {
		margin: 0;
		font-size: var(--font-size-body);
		line-height: var(--line-height-body);
		color: var(--color-text-muted);
		max-width: 42rem;
	}
</style>
