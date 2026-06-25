<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import AppSettingsPanel from '$lib/components/organisms/AppSettingsPanel.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.app.title')}
	subtitle={t('settings.app.description')}
>
	<AppSettingsPanel
		userId={data.user?.id}
		petsEnabled={data.petsEnabled}
		pets={data.pets}
		autoFinishExpiredEnabled={data.autoFinishExpiredEnabled}
	/>
</SettingsDrilldownLayout>
