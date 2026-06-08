<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import StalenessBatchReview from '$lib/components/organisms/StalenessBatchReview.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('staleness.pageTitle')} subtitle={t('staleness.pageSubtitle')} />

	<PageContainer>
		<StalenessBatchReview
			initialItems={data.items}
			initialRemaining={data.remaining}
			canWrite={data.canWrite}
		/>
	</PageContainer>
</AppLayout>
