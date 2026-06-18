<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import PantryV2Page from '$lib/components/organisms/PantryV2Page.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('pantry.v2.title')} />

	<PageContainer>
		<PantryV2Page items={data.items} canWrite={data.canWrite} loadFailed={data.loadFailed} />
	</PageContainer>
</AppLayout>
