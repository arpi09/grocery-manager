<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import DashboardSummary from '$lib/components/organisms/DashboardSummary.svelte';

	let { data } = $props();
</script>

<AppLayout>
	<AppHeader title="Home Pantry" subtitle="What's in your kitchen" user={data.user} />
	<DashboardSummary summary={data.summary} />
</AppLayout>
