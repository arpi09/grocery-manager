<script lang="ts">
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import AnalyticsDashboard from '$lib/components/organisms/AnalyticsDashboard.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('stats.title')} subtitle={t('stats.subtitle')} />
	<PageContainer>
		<AnalyticsDashboard />
	</PageContainer>
</AppLayout>
