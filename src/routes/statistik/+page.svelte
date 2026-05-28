<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import AnalyticsDashboard from '$lib/components/organisms/AnalyticsDashboard.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader
		title="Så här ser skafferiet ut"
		subtitle="Snabb överblick — typ haha, men faktiskt användbart"
	/>
	<AnalyticsDashboard analytics={data.analytics} />
</AppLayout>
