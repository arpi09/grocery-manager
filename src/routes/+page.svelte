<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import DashboardSummary from '$lib/components/organisms/DashboardSummary.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title="Hem" subtitle="Översikt över skafferiet" />
	<PageContainer>
		<DashboardSummary summary={data.summary} canWrite={data.canWrite} />
	</PageContainer>
</AppLayout>
