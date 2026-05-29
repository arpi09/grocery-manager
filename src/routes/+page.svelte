<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import DashboardSummary from '$lib/components/organisms/DashboardSummary.svelte';
	import ScanFab from '$lib/components/molecules/ScanFab.svelte';
	import InventoryScanToast from '$lib/components/molecules/InventoryScanToast.svelte';

	let { data } = $props();

	const scanHref = '/scan?from=%2F';
</script>

<AppLayout user={data.user}>
	<AppHeader title="Hem" subtitle="Översikt över skafferiet" />
	<PageContainer>
		<DashboardSummary summary={data.summary} canWrite={data.canWrite} />
	</PageContainer>
	<InventoryScanToast />
	<ScanFab canWrite={data.canWrite} href={scanHref} />
</AppLayout>
