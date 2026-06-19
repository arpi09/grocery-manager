<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import HomeDashboard from '$lib/components/organisms/HomeDashboard.svelte';
	import HomeV2Page from '$lib/components/organisms/HomeV2Page.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<PageContainer>
		{#if data.homeUxV2Enabled}
			<HomeV2Page
				summary={data.summary}
				intelligence={data.intelligence}
				displayName={data.user?.displayName}
				shoppingListCount={data.shoppingListCount}
				shoppingCadence={data.shoppingCadence}
			/>
		{:else}
			<HomeDashboard
				summary={data.summary}
				intelligence={data.intelligence}
				celebration={data.celebration}
				canWrite={data.canWrite}
				displayName={data.user?.displayName}
				householdId={data.activeHousehold?.id ?? null}
				shoppingListCount={data.shoppingListCount}
				shoppingCadence={data.shoppingCadence}
				homeRedesignV1={Boolean(data.homeRedesignV1Enabled)}
			/>
		{/if}
	</PageContainer>
</AppLayout>
