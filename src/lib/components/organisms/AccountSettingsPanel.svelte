<script lang="ts">
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		email: string;
	}

	let { email }: Props = $props();
</script>

<SettingsSection
	id="settings-account"
	title={t('settings.account.title')}
	description={t('settings.account.description')}
>
	<SettingsRow title={email} note={t('settings.account.loggedInEmail')} />
	<SettingsRow
		href="/profile"
		title={t('settings.account.editProfile')}
		note={t('settings.account.editProfileNote')}
	/>
	<SettingsRow
		href="/privacy"
		title={t('settings.legal.privacyLink')}
		note={t('settings.legal.privacyNote')}
		last
	/>
</SettingsSection>
