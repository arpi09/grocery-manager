<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import KivraForwardSettingsPanel from '$lib/components/organisms/KivraForwardSettingsPanel.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.receiptForward.title')}
	subtitle={t('settings.receiptForward.description')}
>
	{#if data.kivraForwardAddress}
		<SettingsSection
			id="settings-kivra-forward"
			title={t('settings.receiptForward.title')}
			description={t('settings.receiptForward.description')}
		>
			<KivraForwardSettingsPanel forwardAddress={data.kivraForwardAddress} />
		</SettingsSection>
	{/if}
</SettingsDrilldownLayout>
