<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import RecipeDetailView from '$lib/components/organisms/RecipeDetailView.svelte';
	import { canEditInventory } from '$lib/domain/household';

	let { data } = $props();

	const canEdit = $derived(
		data.householdRole ? canEditInventory(data.householdRole) : false
	);
</script>

<AppLayout user={data.user}>
	<PageContainer>
		<RecipeDetailView idea={data.idea} {canEdit} />
	</PageContainer>
</AppLayout>
