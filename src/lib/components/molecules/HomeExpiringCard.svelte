<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import ProgressRing from '$lib/components/atoms/ProgressRing.svelte';
	import HomeDashboardCard, {
		type HomeDashboardCardSize
	} from '$lib/components/molecules/HomeDashboardCard.svelte';
	import HomeExpiringList from '$lib/components/molecules/HomeExpiringList.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { HomeState } from '$lib/domain/home-state';
	import { getLocale, t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		buildExpiringShareCardRows,
		downloadBlob,
		renderExpiringShareCardPng
	} from '$lib/utils/expiring-share-export';

	interface Props {
		expiringSoon: DashboardSummary['expiringSoon'];
		homeState: HomeState;
		size?: HomeDashboardCardSize;
		canWrite?: boolean;
	}

	let { expiringSoon, homeState, size = 'default', canWrite = false }: Props = $props();

	const tone = $derived(homeState === 'expiry' ? 'attention' : 'default');
	const expiringCount = $derived(expiringSoon.length);
	const expiringRatio = $derived(
		expiringCount <= 0 ? 0 : Math.min(1, Math.max(0.15, expiringCount / 6))
	);
	let sharingImage = $state(false);

	async function shareExpiringCard() {
		if (!canWrite || expiringSoon.length === 0) {
			return;
		}

		sharingImage = true;
		try {
			const locale = getLocale();
			const { rows, overflowCount } = buildExpiringShareCardRows(
				expiringSoon.map((item) => ({ name: item.name, expiresOn: item.expiresOn })),
				locale
			);
			const labels = {
				brand: t('nav.brandName'),
				badge: t('eatFirst.badge'),
				headline: t('eatFirst.shareCardHeadline', { count: expiringSoon.length }),
				items: rows,
				overflowText:
					overflowCount > 0 ? t('eatFirst.shareCardOverflow', { count: overflowCount }) : undefined,
				footer: t('eatFirst.shareCardFooter')
			};
			const blob = await renderExpiringShareCardPng(labels);
			const filename = `skaffu-eat-first-${new Date().toISOString().slice(0, 10)}.png`;
			const file = new File([blob], filename, { type: 'image/png' });

			if (navigator.share && navigator.canShare?.({ files: [file] })) {
				await navigator.share({
					title: t('eatFirst.shareCardTitle'),
					text: t('eatFirst.shareCardText', { count: expiringSoon.length }),
					files: [file]
				});
				showClientToast(t('eatFirst.shareCardSuccess'), { variant: 'success' });
			} else if (navigator.share) {
				await navigator.share({
					title: t('eatFirst.shareCardTitle'),
					text: t('eatFirst.shareCardText', { count: expiringSoon.length }),
					url: window.location.origin
				});
				showClientToast(t('eatFirst.shareCardSuccess'), { variant: 'success' });
			} else {
				downloadBlob(blob, filename);
				showClientToast(t('eatFirst.shareCardDownloaded'), { variant: 'success' });
			}
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				showClientToast(t('eatFirst.shareCardFailed'), { variant: 'error' });
			}
		} finally {
			sharingImage = false;
		}
	}
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
	{#snippet meta()}
		{#if expiringCount > 0}
			<p class="meta-line">{t('eatFirst.shareCardHeadline', { count: expiringCount })}</p>
		{:else}
			<p class="meta-line">{t('home.dashboard.expiringEmpty')}</p>
		{/if}
	{/snippet}
	{#snippet viz()}
		<div class="expiring-viz">
			<ProgressRing
				ratio={expiringRatio}
				size={size === 'hero' ? 64 : size === 'compact' ? 48 : 56}
				label={String(expiringCount)}
				active={expiringCount > 0 && homeState === 'expiry'}
				ariaLabel={t('eatFirst.shareCardHeadline', { count: expiringCount })}
			/>
		</div>
	{/snippet}
	{#snippet body()}
		{#if size === 'hero' && expiringCount > 0}
			<HomeExpiringList {expiringSoon} />
		{/if}
	{/snippet}
</HomeDashboardCard>

{#if canWrite && expiringSoon.length > 0}
	<div class="share-action">
		<Button
			type="button"
			data-analytics-id="home.expiring_share_card"
			onclick={shareExpiringCard}
			loading={sharingImage}
			loadingLabel={t('eatFirst.shareCardLoading')}
			variant="secondary"
			fullWidth
		>
			{t('eatFirst.shareCardBtn')}
		</Button>
	</div>
{/if}

<style>
	.meta-line {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.expiring-viz :global(.ring-fill) {
		stroke: var(--color-warning);
	}

	.expiring-viz :global(.progress-ring.active .ring-fill) {
		stroke: var(--color-warning);
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-warning) 35%, transparent));
	}

	.share-action {
		margin-top: var(--space-sm);
	}
</style>
