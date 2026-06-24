<script lang="ts">
	import { t } from '$lib/i18n';
	import { eatFirstWeekBackHref } from '$lib/domain/eat-first-week';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import WeeklyRitualFlow from '$lib/components/organisms/WeeklyRitualFlow.svelte';

	let { data, form } = $props();

	const backFallback = $derived(eatFirstWeekBackHref(data.inboundSource));
	const backLabel = $derived(
		data.inboundSource === 'hero' ||
			data.inboundSource === 'push' ||
			data.inboundSource === 'email'
			? t('weeklyRitual.backToHome')
			: t('weeklyRitual.backToPlaner')
	);
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('weeklyRitual.pageTitle')}
		subtitle={t('weeklyRitual.pageSubtitle')}
		{backFallback}
		{backLabel}
	/>

	<PageContainer>
		<WeeklyRitualFlow
			expiringItems={data.expiringSoon}
			planningDates={data.planningDates}
			todayIso={data.todayIso}
			plannedMeals={data.plannedMealsThisWeek}
			savings={data.savings}
			canEdit={data.canWrite}
			householdId={data.activeHousehold?.id ?? null}
			inboundSource={data.inboundSource}
			expiringCount={data.expiringCount}
			hasInventory={data.hasInventory}
			{form}
		/>
	</PageContainer>
</AppLayout>
