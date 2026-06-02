<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ScanModeTabs from '$lib/components/molecules/ScanModeTabs.svelte';
	import ReceiptBulkAddFlow from '$lib/components/organisms/ReceiptBulkAddFlow.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';

	let { data } = $props();

	const hubHref = $derived(scanHubHref(data.returnTo));
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('scan.receiptPage.title')}
		subtitle={t('scan.receiptPage.subtitle')}
		backHref={hubHref}
		backLabel={t('scan.allModes')}
	/>
	<PageContainer>
		<ScanModeTabs active="receipt" returnTo={data.returnTo} />
		{#if !data.canWrite}
			<p class="readonly" role="status">
				{t('scan.receiptPage.readonly')}
			</p>
			<p><a href={data.returnTo}>← {t('common.back')}</a></p>
		{:else}
			<ReceiptBulkAddFlow returnTo={data.returnTo} />
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.readonly {
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
	}
</style>
