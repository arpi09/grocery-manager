<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import NearbySharingSettingsPanel from '$lib/components/organisms/NearbySharingSettingsPanel.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('nearbySharing.settingsTitle')}
	subtitle={t('nearbySharing.settingsDescription')}
>
	<NearbySharingSettingsPanel
		nearbySharingEnabled={data.nearbySharingEnabled}
		nearbyPushEnabled={data.nearbyPushEnabled}
		pushNotificationsEnabled={data.pushNotificationsEnabled}
	/>
</SettingsDrilldownLayout>
