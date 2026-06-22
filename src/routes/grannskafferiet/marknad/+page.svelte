<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import MarketListingPriceBadge from '$lib/components/molecules/MarketListingPriceBadge.svelte';
	import MarketListingPriceFilter from '$lib/components/molecules/MarketListingPriceFilter.svelte';
	import MarketListingQuantityLabel from '$lib/components/molecules/MarketListingQuantityLabel.svelte';
	import NearbyShareReportButton from '$lib/components/molecules/NearbyShareReportButton.svelte';
	import NearbySharesMap from '$lib/components/organisms/NearbySharesMap.svelte';
	import { sortNearbySharesByExpiry } from '$lib/domain/market-feed';
	import { isActiveInboxThread } from '$lib/domain/market-inbox';
	import type { MarketLifecycleStatus } from '$lib/domain/market-lifecycle';
	import {
		type MarketListingPreviewItem,
		type MarketPriceFilter,
		listingItemPriceSek,
		shareMatchesPriceFilter
	} from '$lib/domain/market-pricing-display';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	let { data } = $props();

	const locale = getLocale();

	type NearbyShare = {
		id: string;
		itemCount: number;
		previewItems: MarketListingPreviewItem[];
		approximateDistanceM: number;
		mapLat: number;
		mapLng: number;
	};

	type ShareThreadMeta = {
		threadId: string;
		unread: boolean;
		active: boolean;
	};

	type MapViewMode = 'map' | 'list';

	let loading = $state(true);
	let radiusM = $state(500);
	let viewerLat = $state<number | null>(null);
	let viewerLng = $state<number | null>(null);
	let shares = $state<NearbyShare[]>([]);
	let selectedShareId = $state<string | null>(null);
	let priceFilter = $state<MarketPriceFilter>('all');
	let viewMode = $state<MapViewMode>('map');
	let threadByShareId = $state<Record<string, ShareThreadMeta>>({});

	const selectedShare = $derived(shares.find((share) => share.id === selectedShareId) ?? null);
	const selectedThread = $derived(
		selectedShareId ? (threadByShareId[selectedShareId] ?? null) : null
	);
	const sortedShares = $derived(sortNearbySharesByExpiry(shares));
	const filteredShares = $derived(
		data.isAdmin
			? sortedShares.filter((share) => shareMatchesPriceFilter(share.previewItems, priceFilter))
			: sortedShares
	);
	const mapShares = $derived(
		filteredShares.map((share) => {
			const thread = threadByShareId[share.id];
			const primaryItem = share.previewItems[0];
			const price = primaryItem ? listingItemPriceSek(primaryItem) : null;
			return {
				id: share.id,
				mapLat: share.mapLat,
				mapLng: share.mapLng,
				pinLabel:
					price == null
						? t('marketV04.priceFree')
						: t('marketV04.priceAmount', { amount: price }),
				hasActiveChat: thread?.active ?? false,
				chatUnread: thread?.unread ?? false
			};
		})
	);
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

	function marketChatPath(threadId: string): string {
		return `/grannskafferiet/marknad/chatt/${threadId}`;
	}

	async function loadChatThreads() {
		try {
			const response = await fetch('/api/market/chats');
			const payload = (await response.json()) as {
				ok?: boolean;
				threads?: Array<{
					id: string;
					shareId: string;
					unread: boolean;
					lifecycleStatus: MarketLifecycleStatus;
					closedAt: string | null;
				}>;
			};
			if (!response.ok || !payload.ok || !payload.threads) {
				return;
			}

			const next: Record<string, ShareThreadMeta> = {};
			for (const thread of payload.threads) {
				next[thread.shareId] = {
					threadId: thread.id,
					unread: thread.unread,
					active: isActiveInboxThread(thread)
				};
			}
			threadByShareId = next;
		} catch {
			// Keep last known thread map on transient failures.
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

	async function openChat(threadId: string) {
		await goto(marketChatPath(threadId));
	}

	function toggleViewMode() {
		viewMode = viewMode === 'map' ? 'list' : 'map';
	}

	onMount(() => {
		void loadShares();
		void loadChatThreads();
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
	<title>{t('marketV01.pageTitle')}</title>
</svelte:head>

<div class="map-view" class:map-view-list={viewMode === 'list'} data-testid="market-v01-page">
	{#if !data.nearbyOptedIn}
		<header class="map-header">
			<h1>{t('marketV01.pageTitle')}</h1>
		</header>
		<p class="note">{t('marketV01.nearbyOptInPrompt')}</p>
		<p class="note">
			<a href="/settings#settings-nearby-sharing">{t('marketV01.nearbyOptInLink')}</a>
		</p>
	{:else if loading}
		<header class="map-header">
			<h1>{t('marketV01.pageTitle')}</h1>
		</header>
		<p class="status">{t('common.loading')}</p>
	{:else if shares.length === 0}
		<header class="map-header">
			<h1>{t('marketV01.pageTitle')}</h1>
		</header>
		<section class="empty-panel">
			<h2>{t('marketV01.discoveryEmptyTitle')}</h2>
			<p>{t('marketV01.discoveryEmptyLead')}</p>
			<p class="note">{t('marketV05.discoveryEmptyProfileHint')}</p>
		</section>
	{:else}
		<div class="map-stage" class:map-stage-hidden={viewMode === 'list'}>
			<NearbySharesMap
				shares={mapShares}
				centerLat={viewerLat}
				centerLng={viewerLng}
				{selectedShareId}
				onSelectShare={selectShare}
			/>

			<div class="map-overlay">
				<div class="map-overlay-top">
					<span class="radius-chip">{radiusLabel}</span>
					{#if data.isAdmin}
						<MarketListingPriceFilter
							variant="compact"
							value={priceFilter}
							onChange={(value) => {
								priceFilter = value;
							}}
						/>
					{/if}
				</div>

				<div class="map-overlay-bottom">
					<button
						type="button"
						class="view-toggle"
						data-testid="market-map-view-toggle"
						onclick={toggleViewMode}
					>
						{viewMode === 'map' ? t('marketV05.mapShowList') : t('marketV05.mapShowMap')}
					</button>
				</div>
			</div>
		</div>

		{#if viewMode === 'list'}
			<section class="share-list" aria-labelledby="market-list-heading">
				<header class="list-header">
					<h2 id="market-list-heading">{t('nearbySharing.discoveryListTitle')}</h2>
					<button type="button" class="view-toggle view-toggle-inline" onclick={toggleViewMode}>
						{t('marketV05.mapShowMap')}
					</button>
				</header>
				<p class="sort-note">{t('marketV01.feedSortNote')}</p>
				{#if data.isAdmin}
					<MarketListingPriceFilter
						value={priceFilter}
						onChange={(value) => {
							priceFilter = value;
						}}
					/>
				{/if}
				<ul>
					{#each filteredShares as share (share.id)}
						<li>
							<Card class="share-list-card" interactive onclick={() => selectShare(share.id)}>
								<div class="share-list-main">
									<div class="share-list-heading">
										<span class="distance">{formatDistance(share.approximateDistanceM)}</span>
										{#if share.previewItems[0]}
											<MarketListingPriceBadge item={share.previewItems[0]} />
										{/if}
										{#if threadByShareId[share.id]?.unread}
											<span
												class="list-chat-dot"
												aria-label={t('marketV05.mapChatUnreadAria')}
											></span>
										{/if}
									</div>
									<span class="count">{t('nearbySharing.itemCount', { count: share.itemCount })}</span>
									<ul class="preview">
										{#each share.previewItems as item, index (index)}
											<li class="preview-item">
												<span>{item.name}</span>
												{#if item.quantity}
													<MarketListingQuantityLabel
														quantity={item.quantity}
														unit={item.unit ?? null}
														portionPercent={item.portionPercent}
													/>
												{/if}
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
</div>

{#if selectedShare}
	<div class="bottom-sheet-backdrop" role="presentation" onclick={closeSheet}></div>
	<aside class="bottom-sheet" aria-labelledby="market-sheet-title">
		<div class="sheet-handle" aria-hidden="true"></div>
		<div class="sheet-heading">
			<h2 id="market-sheet-title">{formatDistance(selectedShare.approximateDistanceM)}</h2>
			{#if selectedShare.previewItems[0]}
				<MarketListingPriceBadge item={selectedShare.previewItems[0]} />
			{/if}
			{#if selectedThread?.unread}
				<span class="sheet-chat-dot" aria-label={t('marketV05.mapChatUnreadAria')}></span>
			{:else if selectedThread?.active}
				<span class="sheet-chat-dot sheet-chat-dot-active" aria-label={t('marketV05.mapChatActiveAria')}></span>
			{/if}
		</div>
		<p class="sheet-count">{t('nearbySharing.itemCount', { count: selectedShare.itemCount })}</p>
		<ul class="sheet-preview">
			{#each selectedShare.previewItems as item, index (index)}
				<li class="sheet-preview-item">
					<span>{item.name}</span>
					{#if item.quantity}
						<MarketListingQuantityLabel
							quantity={item.quantity}
							unit={item.unit ?? null}
							portionPercent={item.portionPercent}
						/>
					{/if}
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
			{#if selectedThread}
				<Button type="button" variant="secondary" onclick={() => openChat(selectedThread.threadId)}>
					{t('marketV05.mapOpenChatBtn')}
				</Button>
			{/if}
			<NearbyShareReportButton shareId={selectedShare.id} variant="secondary" />
			<Button type="button" variant="ghost" onclick={closeSheet}>{t('common.close')}</Button>
		</div>
	</aside>
{/if}

<style>
	.map-view {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		gap: var(--space-md);
	}

	.map-view-list {
		gap: var(--space-sm);
	}

	.map-header {
		display: grid;
		gap: var(--space-2xs);
	}

	h1 {
		margin: 0;
		font-size: 1.2rem;
	}

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

	.map-stage {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.map-stage-hidden {
		display: none;
	}

	.map-stage :global(.nearby-map-shell) {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 12rem;
		border-radius: var(--radius-md);
	}

	.map-stage :global(.map-canvas) {
		flex: 1;
		min-height: 14rem;
		height: auto;
		max-height: none;
	}

	.map-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: none;
		padding: var(--space-sm);
	}

	.map-overlay-top,
	.map-overlay-bottom {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		pointer-events: auto;
	}

	.map-overlay-bottom {
		justify-content: flex-end;
		align-items: flex-end;
		padding-bottom: calc(var(--space-sm) + 0.25rem);
	}

	.radius-chip {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface) 92%, transparent);
		backdrop-filter: blur(8px);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.view-toggle {
		min-height: 2.5rem;
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface) 94%, transparent);
		backdrop-filter: blur(8px);
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--shadow-sm);
	}

	.view-toggle-inline {
		flex-shrink: 0;
	}

	@media (max-width: 767px) {
		.map-view:not(.map-view-list) {
			margin: 0 calc(-1 * var(--page-padding-x));
			gap: 0;
		}

		.map-stage :global(.nearby-map-shell) {
			min-height: calc(
				100dvh - var(--header-height-mobile, 7rem) - var(--market-shell-tab-height, 4.25rem) -
					var(--safe-area-bottom, 0px)
			);
			border: 0;
			border-radius: 0;
		}

		.map-stage :global(.map-canvas) {
			min-height: calc(
				100dvh - var(--header-height-mobile, 7rem) - var(--market-shell-tab-height, 4.25rem) -
					var(--safe-area-bottom, 0px) - 1.5rem
			);
		}

		.map-stage :global(.map-attribution) {
			position: absolute;
			left: var(--space-sm);
			bottom: calc(var(--space-sm) + 2.75rem);
			padding: 0.15rem 0.35rem;
			background: color-mix(in srgb, var(--color-surface) 88%, transparent);
			border-radius: var(--radius-sm);
		}
	}

	.share-list h2,
	.empty-panel h2,
	.list-header h2 {
		margin: 0;
		font-size: 1rem;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.share-list ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	.sort-note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	:global(.share-list-card) {
		display: grid !important;
		gap: var(--space-sm);
	}

	.share-list-main {
		display: grid;
		gap: var(--space-2xs);
	}

	.share-list-heading,
	.sheet-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
	}

	.sheet-heading h2 {
		margin: 0;
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

	.list-chat-dot,
	.sheet-chat-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 999px;
		background: var(--color-warning, #d97706);
	}

	.sheet-chat-dot-active {
		background: var(--color-text-muted);
	}

	.empty-panel {
		display: grid;
		gap: var(--space-md);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.share-list {
		display: grid;
		gap: var(--space-sm);
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
		padding: var(--space-md) var(--page-padding-x) calc(var(--space-lg) + env(safe-area-inset-bottom, 0) + 4.25rem);
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
