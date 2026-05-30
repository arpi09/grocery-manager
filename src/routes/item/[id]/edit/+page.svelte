<script lang="ts">
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import AddItemForm from '$lib/components/organisms/AddItemForm.svelte';

	let { data, form } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('item.editTitle')} />
	<PageContainer>
		<AddItemForm item={data.item} errors={form?.errors} />
	</PageContainer>
</AppLayout>
