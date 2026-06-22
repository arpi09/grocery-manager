<script lang="ts">
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import NearbyShareReportButton from '$lib/components/molecules/NearbyShareReportButton.svelte';
	import MarketListingPriceBadge from '$lib/components/molecules/MarketListingPriceBadge.svelte';
	import MarketListingQuantityLabel from '$lib/components/molecules/MarketListingQuantityLabel.svelte';
	import MarketSharerProfile from '$lib/components/molecules/MarketSharerProfile.svelte';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	let { data } = $props();

	const locale = getLocale();
	let startingChat = $state(false);

	const expiresAtLabel = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			data.preview.expiresAt
		)
	);

	async function startChat() {
		if (data.needsAvatarSetup) {
			return;
		}

		startingChat = true;
		try {
			const response = await fetch('/api/market/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ shareId: data.shareId })
			});
			const payload = (await response.json()) as { ok?: boolean; thread?: { id: string } };
			if (!response.ok || !payload.ok || !payload.thread?.id) {
				showClientToast(t('marketV01.startChatFailed'), { variant: 'error' });
				return;
			}
			await goto(`/grannskafferiet/marknad/chatt/${payload.thread.id}`);
		} catch {
			showClientToast(t('marketV01.startChatFailed'), { variant: 'error' });
		} finally {
			startingChat = false;
		}
	}
</script>

<svelte:head>
	<title>{t('marketV01.listingTitle')}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AppLayout user={data.user}>
	<PageContainer>
		<header class="preview-header">
			<p class="eyebrow">{t('expiringShare.publicEyebrow')}</p>
			<h1>{t('marketV01.listingTitle')}</h1>
			<p class="pantry-note">{t('nearbySharing.sharePreviewPantryNote')}</p>
			<p class="expires">{t('expiringShare.publicExpires', { date: expiresAtLabel })}</p>
		</header>

		{#if data.sharer}
			<MarketSharerProfile
				firstName={data.sharer.firstName}
				avatarUrl={data.sharer.avatarUrl}
				rating={data.sharer.rating}
				reviews={data.sharer.reviews}
			/>
		{/if}

		<ul class="item-list">
			{#each data.preview.items as item, index (index)}
				<li>
					<Card class="item-card">
						<div class="item-main">
							<span class="item-name">{item.name}</span>
							<span class="item-location">{locationLabel(locale, item.location)}</span>
						</div>
						<div class="item-meta">
							<MarketListingPriceBadge item={item} />
							{#if item.expiresOn}
								{@const daysLeft = daysUntilExpiry(item.expiresOn)}
								<Badge tone="warning">{formatDaysLeft(daysLeft, locale)}</Badge>
							{/if}
							<MarketListingQuantityLabel
								quantity={item.quantity}
								unit={item.unit}
								portionPercent={item.portionPercent}
							/>
							{#if item.portionNote}
								<span class="portion-note">{item.portionNote}</span>
							{/if}
						</div>
					</Card>
				</li>
			{/each}
		</ul>

		{#if data.needsAvatarSetup}
			<section class="avatar-gate" data-testid="market-avatar-gate">
				<p>{t('marketV01.avatarGateLead')}</p>
				<a class="cta-link" href="/profile">{t('marketV01.avatarGateCta')}</a>
			</section>
		{/if}

		<div class="actions">
			<Button
				type="button"
				disabled={startingChat || data.needsAvatarSetup}
				onclick={() => void startChat()}
				data-testid="market-start-chat-btn"
			>
				{startingChat ? t('common.loading') : t('marketV01.startChatBtn')}
			</Button>
			<Button type="button" variant="secondary" onclick={() => goto('/grannskafferiet/marknad')}>
				{t('marketV01.backToMarketBtn')}
			</Button>
			<NearbyShareReportButton shareId={data.shareId} variant="secondary" />
		</div>
	</PageContainer>
</AppLayout>

<style>
	.preview-header {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.eyebrow {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-primary);
	}

	h1 {
		margin: 0;
	}

	.expires,
	.pantry-note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.pantry-note {
		font-weight: 600;
		color: var(--color-text);
	}

	.item-list {
		margin: 0 0 var(--space-lg);
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	:global(.item-card) {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		align-items: center;
	}

	.item-main {
		display: grid;
		gap: var(--space-2xs);
	}

	.item-name {
		font-weight: 600;
	}

	.item-location,
	.quantity,
	.portion-note {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.portion-note {
		max-width: 16rem;
		text-align: right;
	}

	.item-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-2xs);
	}

	.avatar-gate {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.avatar-gate p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.cta-link {
		justify-self: start;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.cta-link:hover {
		text-decoration: underline;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
