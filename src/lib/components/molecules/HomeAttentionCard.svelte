<script lang="ts">
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import HomeDashboardCard, {
		type HomeDashboardCardSize
	} from '$lib/components/molecules/HomeDashboardCard.svelte';
	import type { PantryStatusSummary } from '$lib/application/inventory.service';
	import { t } from '$lib/i18n';

	interface Props {
		pantryStatus: PantryStatusSummary;
		size?: HomeDashboardCardSize;
	}

	let { pantryStatus, size = 'default' }: Props = $props();

	const issueLine = $derived.by(() => {
		if (pantryStatus.staleCount > 0) {
			return t('home.pantryStatusStale', { count: pantryStatus.staleCount });
		}
		if (pantryStatus.autoExpiredCount > 0) {
			return t('home.pantryStatusAutoExpired', { count: pantryStatus.autoExpiredCount });
		}
		if (pantryStatus.withoutExpiryCount > 0) {
			return t('home.pantryStatusWithoutExpiry', { count: pantryStatus.withoutExpiryCount });
		}
		return t('home.pantryStatusAllGood');
	});

	const href = $derived.by(() => {
		if (pantryStatus.staleCount > 0 || pantryStatus.autoExpiredCount > 0) {
			return '/inventory/synk';
		}
		return '/inventory/fridge?filter=noExpiry';
	});
</script>

<HomeDashboardCard
	title={t('home.dashboard.attentionTitle')}
	{href}
	testId="home-card-attention"
	tone="attention"
	{size}
	footerLabel={t('home.dashboard.attentionFooter')}
>
	{#snippet icon()}
		<FeatureIcon id="alert" size={18} />
	{/snippet}
	{#snippet meta()}
		<p class="meta-line">{issueLine}</p>
	{/snippet}
</HomeDashboardCard>

<style>
	.meta-line {
		margin: 0;
	}
</style>
