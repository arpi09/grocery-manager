<script lang="ts">

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import HomeV2Page from '$lib/components/organisms/HomeV2Page.svelte';

	let { data } = $props();

</script>

<AppLayout user={data.user}>

	<PageContainer>

		<HomeV2Page

			summary={data.summary}

			intelligence={data.intelligence}

			displayName={data.user?.displayName}

			shoppingListCount={data.shoppingListCount}

			shoppingCadence={data.shoppingCadence}

			recipeSuggestion={data.recipeSuggestion}

			briefingRecipeChip={data.briefingRecipeChip}

			briefingFunFact={data.briefingFunFact}

			briefingOneLiner={data.briefingOneLiner}

			canWrite={data.canWrite}

			brainTimeline={data.brainTimeline}

			brainScore={data.brainScore}

			loadFailed={Boolean(data.loadFailed)}
		/>

	</PageContainer>

</AppLayout>
