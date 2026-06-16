<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import NotificationSettingsPanel from '$lib/components/organisms/NotificationSettingsPanel.svelte';
	import { t } from '$lib/i18n';

	let { data, form } = $props();

	const shoppingPushError = $derived(
		(form as { shoppingPushError?: string } | null)?.shoppingPushError ?? null
	);
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.notifications.title')}
	subtitle={t('settings.notifications.description')}
>
	<NotificationSettingsPanel
		expiryRemindersEnabled={data.expiryRemindersEnabled}
		expiryReminderDays={data.expiryReminderDays}
		autoExpiredGraceDays={data.autoExpiredGraceDays}
		pushNotificationsEnabled={data.pushNotificationsEnabled}
		shoppingPushEnabled={data.shoppingPushEnabled}
		shoppingToPantryMode={data.shoppingToPantryMode}
		{shoppingPushError}
	/>
</SettingsDrilldownLayout>
