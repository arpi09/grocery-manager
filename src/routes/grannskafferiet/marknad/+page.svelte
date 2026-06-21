<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import NearbySharesMap from '$lib/components/organisms/NearbySharesMap.svelte';
	import MarketAutoListingPanel from '$lib/components/organisms/MarketAutoListingPanel.svelte';
	import NearbyShareReportButton from '$lib/components/molecules/NearbyShareReportButton.svelte';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	let { data } = $props();

	const locale = getLocale();

	type NearbyShare = {
		id: string;
		itemCount: number;
		previewItems: Array<{ name: string; expiresOn: string | null }>;
		approximateDistanceM: number;
		mapLat: number;
		mapLng: number;
	};

	type ChatThread = {
		id: string;
		shareId: string;
		createdAt: string;
		closedAt: string | null;
	};

	let loading = $state(true);
	let radiusM = $state(500);
	let viewerLat = $state<number | null>(null);
	let viewerLng = $state<number | null>(null);
	let shares = $state<NearbyShare[]>([]);
	let selectedShareId = $state<string | null>(null);
	let chatThreads = $state<ChatThread[]>([]);
	let chatsLoading = $state(false);

	const selectedShare = $derived(shares.find((share) => share.id === selectedShareId) ?? null);
	const radiusLabel = $derived(
		data.isPro
			? t('nearbySharing.radiusPro', { metres: radiusM })
			: t('nearbySharing.radiusFree', { metres: radiusM })
	);

	function formatDistance(metres: number): string {
		return t('nearbySharing.approxDistance', { metres });
	}

	function marketSharePath(shareId: string): string {
		return `/grannskafferiet/marknad/share/${shareId}`;
	}

	async function loadChats() {
		chatsLoading = true;
		try {
			const response = await fetch('/api/market/chats');
			const payload = (await response.json()) as { ok?: boolean; threads?: ChatThread[] };
			chatThreads = response.ok && payload.ok ? (payload.threads ?? []) : [];
		} catch {
			chatThreads = [];
		} finally {
			chatsLoading = false;
		}
	}

	async function loadShares() {
		loading = true;
		try {
			const [settingsResponse, nearbyResponse] = await Promise.all([
				fetch('/api/expiring-share/nearby-settings'),
				fetch('/api/expiring-share/nearby')
			]);

			if (settingsResponse.ok) {
				const settings = (await settingsResponse.json()) as {
					enabled?: boolean;
					latitude?: number | null;
					longitude?: number | null;
				};
				viewerLat = settings.latitude ?? null;
				viewerLng = settings.longitude ?? null;
			}

			const nearby = (await nearbyResponse.json()) as {
				ok?: boolean;
				optedIn?: boolean;
				radiusM?: number;
				shares?: Array<
					NearbyShare & {
						openPath: string;
					}
				>;
			};

			if (!nearbyResponse.ok || !nearby.ok) {
				shares = [];
				return;
			}

			radiusM = nearby.radiusM ?? 500;
			shares = (nearby.shares ?? []).map(({ id, itemCount, previewItems, approximateDistanceM, mapLat, mapLng }) => ({
				id,
				itemCount,
				previewItems,
				approximateDistanceM,
				mapLat,
				mapLng
			}));
		} catch {
			shares = [];
			showClientToast(t('nearbySharing.loadFailed'), { variant: 'error' });
		} finally {
			loading = false;
		}
	}

	function selectShare(shareId: string) {
		selectedShareId = shareId;
	}

	function closeSheet() {
		selectedShareId = null;
	}

	async function openShare(shareId: string) {
		await goto(marketSharePath(shareId));
	}

	onMount(() => {
		void loadShares();
		if (data.nearbyOptedIn) {
			void loadChats();
		}
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
	<title>{t('marketV01.pageTitle')}</title>
</svelte:head>

<AppLayout user={data.user}>
	<PageContainer>
		<header class="discovery-header" data-testid="market-v01-page">
			<h1>{t('marketV01.pageTitle')}</h1>
			<p class="lead">{t('marketV01.pageLead')}</p>
			{#if data.nearbyOptedIn}
				<p class="radius-note">{radiusLabel}</p>
				{#if !data.isPro && data.stripeCheckoutEnabled}
					<p class="pro-hint">
						{t('nearbySharing.proRadiusHint')}
						<a href="/priser">{t('nearbySharing.proRadiusLink')}</a>
					</p>
				{/if}
			{/if}
		</header>

		{#if !data.nearbyOptedIn}
			<p class="note">{t('marketV01.nearbyOptInPrompt')}</p>
			<p class="note">
				<a href="/settings#settings-nearby-sharing">{t('marketV01.nearbyOptInLink')}</a>
			</p>
		{:else}
			<MarketAutoListingPanel
				autoNearbyListingEnabled={data.autoNearbyListingEnabled}
				nearbySharingEnabled={data.nearbyOptedIn}
			/>

			<section class="chats-section" aria-labelledby="market-chats-heading">
				<h2 id="market-chats-heading">{t('marketV01.myChatsTitle')}</h2>
				{#if chatsLoading}
					<p class="status">{t('common.loading')}</p>
				{:else if chatThreads.length === 0}
					<p class="note">{t('marketV01.myChatsEmpty')}</p>
				{:else}
					<ul class="chat-list">
						{#each chatThreads as thread (thread.id)}
							<li>
								<Card class="chat-card" interactive onclick={() => goto(`/grannskafferiet/marknad/chatt/${thread.id}`)}>
									<span class="chat-share-id">{thread.shareId.slice(0, 8)}…</span>
									{#if thread.closedAt}
										<Badge>{t('marketV01.chatClosedBadge')}</Badge>
									{/if}
								</Card>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			{#if loading}
				<p class="status">{t('common.loading')}</p>
			{:else}
				<NearbySharesMap
					{shares}
					centerLat={viewerLat}
					centerLng={viewerLng}
					{selectedShareId}
					onSelectShare={selectShare}
				/>

				{#if shares.length === 0}
					<section class="empty-panel">
						<h2>{t('nearbySharing.discoveryEmptyTitle')}</h2>
						<p>{t('marketV01.discoveryEmptyLead')}</p>
					</section>
				{:else}
					<section class="share-list" aria-labelledby="market-list-heading">
						<h2 id="market-list-heading">{t('nearbySharing.discoveryListTitle')}</h2>
						<ul>
							{#each shares as share (share.id)}
								<li>
									<Card class="share-list-card" interactive onclick={() => selectShare(share.id)}>
										<div class="share-list-main">
											<span class="distance">{formatDistance(share.approximateDistanceM)}</span>
											<span class="count">{t('nearbySharing.itemCount', { count: share.itemCount })}</span>
											<ul class="preview">
												{#each share.previewItems as item, index (index)}
													<li class="preview-item">
														<span>{item.name}</span>
														{#if item.expiresOn}
															{@const daysLeft = daysUntilExpiry(item.expiresOn)}
															<Badge tone="warning">{formatDaysLeft(daysLeft, locale)}</Badge>
														{/if}
													</li>
												{/each}
											</ul>
										</div>
										<div class="share-list-actions">
											<Button
												type="button"
												variant="secondary"
												onclick={(event) => {
													event.stopPropagation();
													void openShare(share.id);
												}}
											>
												{t('marketV01.openListingBtn')}
											</Button>
											<NearbyShareReportButton shareId={share.id} />
										</div>
									</Card>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			{/if}
		{/if}
	</PageContainer>
</AppLayout>

{#if selectedShare}
	<div class="bottom-sheet-backdrop" role="presentation" onclick={closeSheet}></div>
	<aside class="bottom-sheet" aria-labelledby="market-sheet-title">
		<div class="sheet-handle" aria-hidden="true"></div>
		<h2 id="market-sheet-title">{formatDistance(selectedShare.approximateDistanceM)}</h2>
		<p class="sheet-count">{t('nearbySharing.itemCount', { count: selectedShare.itemCount })}</p>
		<ul class="sheet-preview">
			{#each selectedShare.previewItems as item, index (index)}
				<li class="sheet-preview-item">
					<span>{item.name}</span>
					{#if item.expiresOn}
						{@const daysLeft = daysUntilExpiry(item.expiresOn)}
						<Badge tone="warning">{formatDaysLeft(daysLeft, locale)}</Badge>
					{/if}
				</li>
			{/each}
		</ul>
		<div class="sheet-actions">
			<Button type="button" onclick={() => openShare(selectedShare.id)}>
				{t('marketV01.openListingBtn')}
			</Button>
			<NearbyShareReportButton shareId={selectedShare.id} variant="secondary" />
			<Button type="button" variant="ghost" onclick={closeSheet}>{t('common.close')}</Button>
		</div>
	</aside>
{/if}

<style>
	.discovery-header {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	h1 {
		margin: 0;
		font-size: 1.35rem;
	}

	.lead,
	.note,
	.status {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
	}

	.note a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.note a:hover {
		text-decoration: underline;
	}

	.radius-note {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.pro-hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.chats-section {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.chats-section h2,
	.share-list h2,
	.empty-panel h2 {
		margin: 0;
		font-size: 1rem;
	}

	.chat-list,
	.share-list ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	:global(.chat-card) {
		display: flex !important;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.chat-share-id {
		font-family: var(--font-mono, monospace);
		font-size: 0.875rem;
	}

	.empty-panel {
		display: grid;
		gap: var(--space-md);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		margin-top: var(--space-lg);
	}

	.share-list {
		margin-top: var(--space-lg);
		display: grid;
		gap: var(--space-sm);
	}

	:global(.share-list-card) {
		display: grid !important;
		gap: var(--space-sm);
	}

	.share-list-main {
		display: grid;
		gap: var(--space-2xs);
	}

	.distance {
		font-weight: 700;
	}

	.count,
	.preview {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.preview {
		margin: 0;
		padding-left: 0;
		list-style: none;
		display: grid;
		gap: var(--space-2xs);
	}

	.preview-item,
	.sheet-preview-item {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
	}

	.share-list-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
	}

	.bottom-sheet-backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, var(--color-text) 35%, transparent);
		z-index: 40;
	}

	.bottom-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 41;
		padding: var(--space-md) var(--page-padding-x) calc(var(--space-lg) + env(safe-area-inset-bottom, 0));
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		box-shadow: var(--shadow-lg);
		display: grid;
		gap: var(--space-sm);
	}

	.sheet-handle {
		width: 2.5rem;
		height: 0.25rem;
		margin: 0 auto var(--space-xs);
		border-radius: 999px;
		background: var(--color-border);
	}

	.bottom-sheet h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.sheet-count {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.sheet-preview {
		margin: 0;
		padding-left: 0;
		list-style: none;
		display: grid;
		gap: var(--space-xs);
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.sheet-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
	}
</style>
