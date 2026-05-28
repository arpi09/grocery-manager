<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import AddItemForm from '$lib/components/organisms/AddItemForm.svelte';

	let { data, form } = $props();
</script>

<AppLayout>
	<AppHeader title="Edit item" showPetsNav={Boolean(data.user?.petsEnabled)} />
	<AddItemForm item={data.item} errors={form?.errors} />
</AppLayout>
