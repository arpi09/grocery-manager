<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import SuggestionsSettingsPanel from '$lib/components/organisms/SuggestionsSettingsPanel.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.suggestions.title')}
	subtitle={t('settings.suggestions.description')}
>
	<SuggestionsSettingsPanel
		shelfLifeRules={data.suggestionsSnapshot.shelfLifeRules}
		locationRules={data.suggestionsSnapshot.locationRules}
		canReset={data.canResetSuggestions}
		showKivraHint={Boolean(data.kivraForwardAddress)}
	/>
</SettingsDrilldownLayout>
