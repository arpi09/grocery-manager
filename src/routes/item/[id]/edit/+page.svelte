<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import AddItemForm from '$lib/components/organisms/AddItemForm.svelte';

	let { data, form } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title="Redigera vara" />
	<AddItemForm item={data.item} errors={form?.errors} />
</AppLayout>
