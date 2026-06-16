<script lang="ts">
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import PlanSettingsPanel from '$lib/components/organisms/PlanSettingsPanel.svelte';
	import ProActivationCelebration from '$lib/components/organisms/ProActivationCelebration.svelte';
	import { t } from '$lib/i18n';

	let { data, form } = $props();
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.plan.title')}
	subtitle={t('settings.plan.description')}
>
	<PlanSettingsPanel
		isPro={data.isPro}
		isAdmin={data.isAdmin}
		isOwner={data.isOwner}
		stripeCheckoutEnabled={data.stripeCheckoutEnabled}
		checkoutStatus={data.checkoutStatus}
		planLimits={data.planLimits}
		billing={data.billing}
		userEmail={data.user?.email ?? ''}
		{form}
	/>
</SettingsDrilldownLayout>

<ProActivationCelebration show={data.checkoutStatus === 'success'} isPro={data.isPro} />
