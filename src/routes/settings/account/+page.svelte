<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import AccountSettingsPanel from '$lib/components/organisms/AccountSettingsPanel.svelte';
	import { t } from '$lib/i18n';

	let { data, form } = $props();
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.account.title')}
	subtitle={t('settings.account.description')}
>
	<AccountSettingsPanel
		email={data.user?.email ?? ''}
		deletionImpact={data.deletionImpact}
		accountError={form?.accountError}
	/>
</SettingsDrilldownLayout>
