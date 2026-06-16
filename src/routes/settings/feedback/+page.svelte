<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import FeedbackSettingsPanel from '$lib/components/organisms/FeedbackSettingsPanel.svelte';
	import { t } from '$lib/i18n';

	let { data, form } = $props();

	const feedbackErrors = $derived(form?.feedbackErrors ?? {});
	const feedbackSuccess = $derived(form?.feedbackSuccess === true);
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.nav.feedback')}
>
	<FeedbackSettingsPanel {feedbackSuccess} {feedbackErrors} />
</SettingsDrilldownLayout>
