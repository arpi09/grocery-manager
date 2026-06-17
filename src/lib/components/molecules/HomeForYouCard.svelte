<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import HomeOverviewCard from '$lib/components/molecules/HomeOverviewCard.svelte';
	import HomeForYouIllustration from '$lib/components/organisms/illustrations/HomeForYouIllustration.svelte';
	import type { HomeForYouRecommendation } from '$lib/domain/home-for-you';
	import { trackProductEvent } from '$lib/client/product-events';
	import { t } from '$lib/i18n';
	import { onMount } from 'svelte';

	interface Props {
		recommendation: HomeForYouRecommendation;
		canWrite?: boolean;
	}

	let { recommendation, canWrite = false }: Props = $props();
	let accepting = $state(false);

	const title = $derived(t('home.v5.forYou.title'));
	const forYouBody = $derived(
		recommendation.kind === 'replenishment'
			? t('home.v5.forYou.replenishment.body', { name: recommendation.suggestion.displayName })
			: t('home.v5.forYou.expiring.body', { name: recommendation.item.name })
	);

	onMount(() => {
		void trackProductEvent('recommendation_viewed', { kind: recommendation.kind });
	});

	async function addToList() {
		if (!canWrite || recommendation.kind !== 'replenishment' || accepting) return;
		accepting = true;
		void trackProductEvent('recommendation_clicked', { kind: 'replenishment' });
		try {
			await fetch('/api/replenishment/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					normalizedKey: recommendation.suggestion.normalizedKey,
					surface: 'hem'
				})
			});
		} finally {
			accepting = false;
		}
	}

	function handleExpiringClick() {
		void trackProductEvent('recommendation_clicked', { kind: 'expiring' });
	}
</script>

<section id="home-for-you" class="home-for-you" aria-labelledby="home-for-you-title">
	<HomeOverviewCard tone="dominant" {title} testId="home-for-you-card">
		{#snippet illustration()}
			<HomeForYouIllustration />
		{/snippet}
		{#snippet body()}
			<p id="home-for-you-title">{forYouBody}</p>
		{/snippet}
		{#snippet cta()}
			{#if recommendation.kind === 'replenishment' && canWrite}
				<Button type="button" loading={accepting} onclick={addToList}>
					{t('home.v5.forYou.replenishment.cta')}
				</Button>
			{:else if recommendation.kind === 'expiring'}
				<a
					class="btn btn-primary"
					href="/item/{recommendation.item.id}/edit"
					onclick={handleExpiringClick}
				>
					{t('home.v5.forYou.expiring.cta')}
				</a>
			{/if}
		{/snippet}
	</HomeOverviewCard>
</section>
