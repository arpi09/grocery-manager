<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import MemoryExplorerPage from '$lib/components/organisms/MemoryExplorerPage.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('memory.title')}
		subtitle={t('memory.subtitle')}
		backHref="/settings"
		backLabel={t('memory.backToSettings')}
	/>
	<PageContainer>
		<MemoryExplorerPage memorySnapshot={data.memorySnapshot} canEdit={data.canEdit} />
	</PageContainer>
</AppLayout>
