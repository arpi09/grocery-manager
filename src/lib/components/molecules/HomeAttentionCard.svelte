<script lang="ts">
	import HomeDashboardCard from '$lib/components/molecules/HomeDashboardCard.svelte';
	import type { PantryStatusSummary } from '$lib/application/inventory.service';
	import { t } from '$lib/i18n';

	interface Props {
		pantryStatus: PantryStatusSummary;
	}

	let { pantryStatus }: Props = $props();

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
	footerLabel={t('home.dashboard.attentionFooter')}
>
	{#snippet meta()}
		<p class="meta-line">{issueLine}</p>
	{/snippet}
</HomeDashboardCard>

<style>
	.meta-line {
		margin: 0;
	}
</style>
