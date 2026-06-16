<script lang="ts">
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import HomeDashboardCard, {
		type HomeDashboardCardSize
	} from '$lib/components/molecules/HomeDashboardCard.svelte';
	import HomeExpiringList from '$lib/components/molecules/HomeExpiringList.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { HomeState } from '$lib/domain/home-state';
	import { t } from '$lib/i18n';

	interface Props {
		expiringSoon: DashboardSummary['expiringSoon'];
		homeState: HomeState;
		size?: HomeDashboardCardSize;
	}

	let { expiringSoon, homeState, size = 'default' }: Props = $props();

	const tone = $derived(homeState === 'expiry' ? 'attention' : 'default');
</script>

<HomeDashboardCard
	title={t('home.dashboard.expiringTitle')}
	href="/inventory/fridge?filter=expiring"
	testId="home-card-expiring"
	{tone}
	{size}
	footerLabel={t('home.dashboard.expiringFooter')}
>
	{#snippet icon()}
		<FeatureIcon id="clock" size={18} />
	{/snippet}
	{#snippet body()}
		{#if expiringSoon.length > 0}
			<HomeExpiringList {expiringSoon} />
		{:else}
			<p class="empty-line">{t('home.dashboard.expiringEmpty')}</p>
		{/if}
	{/snippet}
</HomeDashboardCard>

<style>
	.empty-line {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}
</style>
