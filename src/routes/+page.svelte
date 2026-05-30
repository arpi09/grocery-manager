<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import DashboardSummary from '$lib/components/organisms/DashboardSummary.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();

	const title = $derived(t('dashboard.title'));
	const subtitle = $derived(t('dashboard.subtitle'));
</script>

<AppLayout user={data.user}>
	<AppHeader {title} {subtitle} />
	<PageContainer>
		<DashboardSummary summary={data.summary} canWrite={data.canWrite} />
	</PageContainer>
</AppLayout>
