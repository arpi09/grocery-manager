<script lang="ts">
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import ProgressRing from '$lib/components/atoms/ProgressRing.svelte';
	import HomeDashboardCard, {
		type HomeDashboardCardSize
	} from '$lib/components/molecules/HomeDashboardCard.svelte';
	import { formatCadenceWeekday, shouldShowCadenceWeekday, type HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		shoppingListCount: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
		size?: HomeDashboardCardSize;
	}

	let { shoppingListCount, shoppingCadence = null, size = 'default' }: Props = $props();

	const locale = $derived(getLocale());

	const primaryLine = $derived(
		shoppingListCount > 0
			? t('home.dashboard.shoppingCount', { count: shoppingListCount })
			: t('home.shoppingTeaserEmpty')
	);

	const cadenceLine = $derived.by(() => {
		if (!shoppingCadence || !shouldShowCadenceWeekday(shoppingCadence)) return null;
		const weekday = formatCadenceWeekday(shoppingCadence.weekday, locale);
		return shoppingCadence.storeLabel
			? t('home.cadenceLineStore', { weekday, store: shoppingCadence.storeLabel })
			: t('home.cadenceLine', { weekday });
	});

	const listFillRatio = $derived(
		shoppingListCount <= 0 ? 0 : Math.min(1, Math.max(0.12, shoppingListCount / 8))
	);
</script>

<HomeDashboardCard
	title={t('home.dashboard.shoppingTitle')}
	href="/inkop"
	testId="home-card-shopping"
	footerLabel={t('home.dashboard.shoppingFooter')}
	{size}
>
	{#snippet icon()}
		<FeatureIcon id="shopping" size={18} />
	{/snippet}
	{#snippet meta()}
		<p class="meta-line">{primaryLine}</p>
		{#if cadenceLine}
			<p class="cadence-line">{cadenceLine}</p>
		{/if}
	{/snippet}
	{#snippet viz()}
		<ProgressRing
			ratio={listFillRatio}
			size={size === 'hero' ? 64 : size === 'compact' ? 48 : 56}
			label={String(shoppingListCount)}
			ariaLabel={primaryLine}
		/>
	{/snippet}
</HomeDashboardCard>

<style>
	.meta-line,
	.cadence-line {
		margin: 0;
	}

	.cadence-line {
		margin-top: var(--space-xs);
		color: var(--color-text-muted);
	}
</style>
