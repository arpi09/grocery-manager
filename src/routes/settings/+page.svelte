<script lang="ts">
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ProUpgradeCta from '$lib/components/molecules/ProUpgradeCta.svelte';
	import SettingsHub from '$lib/components/organisms/SettingsHub.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
	<PageContainer>
		<div class="settings-page">
			{#if !data.isPro}
				<ProUpgradeCta variant="banner" class="settings-pro-banner" />
			{/if}

			<SettingsHub
				household={data.household}
				kivraForwardAddress={data.kivraForwardAddress}
				showSuggestions={data.showSuggestions}
				showPriceMemory={data.showPriceMemory}
			/>
		</div>
	</PageContainer>
</AppLayout>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
	}

	:global(.settings-pro-banner) {
		margin-bottom: var(--space-md);
	}
</style>
