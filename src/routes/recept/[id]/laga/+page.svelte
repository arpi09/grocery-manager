<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import RecipeCookMode from '$lib/components/organisms/RecipeCookMode.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user} hideNav>
	<RecipeCookMode
		recipeId={data.idea.id}
		recipeTitle={data.idea.title}
		steps={data.idea.steps}
	/>
</AppLayout>
