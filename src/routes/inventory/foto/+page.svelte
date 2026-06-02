<script lang="ts">
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import PhotoRoundFlow from '$lib/components/organisms/PhotoRoundFlow.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('photoRound.title')}
		subtitle={t('photoRound.subtitle')}
		backHref={data.returnTo}
		backLabel={t('inventory.title')}
	/>
	<PageContainer>
		{#if !data.canWrite}
			<p class="readonly" role="status">
				{t('inventory.readonly')}
			</p>
		{:else}
			<PhotoRoundFlow returnTo={data.returnTo} />
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.readonly {
		margin: 0;
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
	}
</style>
