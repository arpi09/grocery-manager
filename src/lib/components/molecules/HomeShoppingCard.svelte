<script lang="ts">
	import HomeDashboardCard from '$lib/components/molecules/HomeDashboardCard.svelte';
	import { formatCadenceWeekday, type HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		shoppingListCount: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
	}

	let { shoppingListCount, shoppingCadence = null }: Props = $props();

	const locale = $derived(getLocale());

	const primaryLine = $derived(
		shoppingListCount > 0
			? t('home.dashboard.shoppingCount', { count: shoppingListCount })
			: t('home.shoppingTeaserEmpty')
	);

	const cadenceLine = $derived.by(() => {
		if (!shoppingCadence) return null;
		const weekday = formatCadenceWeekday(shoppingCadence.weekday, locale);
		return shoppingCadence.storeLabel
			? t('home.cadenceLineStore', { weekday, store: shoppingCadence.storeLabel })
			: t('home.cadenceLine', { weekday });
	});
</script>

<HomeDashboardCard
	title={t('home.dashboard.shoppingTitle')}
	href="/inkop"
	testId="home-card-shopping"
	footerLabel={t('home.dashboard.shoppingFooter')}
>
	{#snippet meta()}
		<p class="meta-line">{primaryLine}</p>
	{/snippet}
	{#snippet body()}
		{#if cadenceLine}
			<p class="cadence-line">{cadenceLine}</p>
		{/if}
	{/snippet}
</HomeDashboardCard>

<style>
	.meta-line,
	.cadence-line {
		margin: 0;
	}

	.cadence-line {
		color: var(--color-text-muted);
	}
</style>
