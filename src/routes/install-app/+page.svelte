<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import InstallAppGuide from '$lib/components/organisms/InstallAppGuide.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('pwa.page.title')} subtitle={t('pwa.page.subtitle')} />
	<PageContainer>
		<InstallAppGuide />
	</PageContainer>
</AppLayout>
