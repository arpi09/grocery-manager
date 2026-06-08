<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import HomeDashboard from '$lib/components/organisms/HomeDashboard.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<PageContainer>
		<HomeDashboard
			summary={data.summary}
			engagement={data.engagement}
			savings={data.savings}
			showWeeklyRitual={data.showWeeklyRitual}
			celebration={data.celebration}
			canWrite={data.canWrite}
			displayName={data.user?.displayName}
			householdId={data.activeHousehold?.id ?? null}
			receiptAutopilotSuggestions={data.receiptAutopilotSuggestions}
			receiptFinishSuggestions={data.receiptFinishSuggestions}
			recentItemNames={data.recentItemNames}
			duplicateGroups={data.duplicateGroups}
			activityEvents={data.activityEvents}
			lastUpdatedByDisplayName={data.lastUpdatedByDisplayName}
			shoppingListCount={data.shoppingListCount}
		/>
	</PageContainer>
</AppLayout>
