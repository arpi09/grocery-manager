<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import NearbySharesMap from '$lib/components/organisms/NearbySharesMap.svelte';
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
		openPath: string;
	};

	let loading = $state(true);
	let optedIn = $state(false);
	let radiusM = $state(500);
	let viewerLat = $state<number | null>(null);
	let viewerLng = $state<number | null>(null);
	let shares = $state<NearbyShare[]>([]);
	let selectedShareId = $state<string | null>(null);

	const selectedShare = $derived(shares.find((share) => share.id === selectedShareId) ?? null);
	const radiusLabel = $derived(
		data.isPro ? t('nearbySharing.radiusPro', { metres: radiusM }) : t('nearbySharing.radiusFree', { metres: radiusM })
	);

	function formatDistance(metres: number): string {
		return t('nearbySharing.approxDistance', { metres });
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
				shares?: NearbyShare[];
			};

			if (!nearbyResponse.ok || !nearby.ok) {
				shares = [];
				return;
			}

			optedIn = Boolean(nearby.optedIn);
			radiusM = nearby.radiusM ?? 500;
			shares = nearby.shares ?? [];
		} catch {
			shares = [];
			showClientToast(t('nearbySharing.loadFailed'), { variant: 'error' });
		} finally {
			loading = false;
		}
	}

	function selectShare(shareId: string) {
		selectedShareId = shareId;
		void fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventType: 'nearby_share_tapped',
				metadata: { shareId, surface: 'grannskafferiet' }
			})
		});
	}

	function closeSheet() {
		selectedShareId = null;
	}

	async function openShare(share: NearbyShare) {
		await goto(share.openPath);
	}

	onMount(() => {
		void fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventType: 'nearby_map_opened', metadata: { surface: 'grannskafferiet' } })
		});
		void loadShares();
	});
</script>

<svelte:head>
	<title>{t('nearbySharing.discoveryTitle')}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AppLayout user={data.user}>
	<PageContainer>
		<header class="discovery-header">
			<h1>{t('nearbySharing.discoveryTitle')}</h1>
			<p>{t('nearbySharing.discoveryLead')}</p>
			<p class="radius-note">{radiusLabel}</p>
			{#if !data.isPro && data.stripeCheckoutEnabled}
				<p class="pro-hint">
					{t('nearbySharing.proRadiusHint')}
					<a href="/priser">{t('nearbySharing.proRadiusLink')}</a>
				</p>
			{/if}
			<p class="trust-note">{t('nearbySharing.trustNote')}</p>
		</header>

		{#if loading}
			<p class="status">{t('common.loading')}</p>
		{:else if !optedIn}
			<section class="empty-panel">
				<p>{t('nearbySharing.discoveryOptInHint')}</p>
				<a class="cta-link secondary" href="/settings#settings-nearby-sharing">
					{t('nearbySharing.panelOptInLink')}
				</a>
			</section>
		{:else}
			<NearbySharesMap
				{shares}
				centerLat={viewerLat}
				centerLng={viewerLng}
				{selectedShareId}
				onSelectShare={selectShare}
			/>

			{#if shares.length === 0}
				<section class="empty-panel" data-testid="nearby-discovery-empty">
					<h2>{t('nearbySharing.discoveryEmptyTitle')}</h2>
					<p>{t('nearbySharing.discoveryEmptyLead')}</p>
					<div class="empty-actions">
						<a class="cta-link" href="/hem#eat-first">{t('nearbySharing.discoveryEmptyShareCta')}</a>
						<a class="cta-link secondary" href="/settings#settings-nearby-sharing">
							{t('nearbySharing.discoveryEmptySettingsCta')}
						</a>
					</div>
				</section>
			{:else}
				<section class="share-list" aria-labelledby="nearby-list-heading">
					<h2 id="nearby-list-heading">{t('nearbySharing.discoveryListTitle')}</h2>
					<ul>
						{#each shares as share (share.id)}
							<li>
								<Card
									class="share-list-card"
									interactive
									onclick={() => selectShare(share.id)}
								>
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
												void openShare(share);
											}}
										>
											{t('nearbySharing.openShareBtn')}
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
	</PageContainer>
</AppLayout>

{#if selectedShare}
	<div class="bottom-sheet-backdrop" role="presentation" onclick={closeSheet}></div>
	<aside class="bottom-sheet" aria-labelledby="nearby-sheet-title" data-testid="nearby-share-sheet">
		<div class="sheet-handle" aria-hidden="true"></div>
		<h2 id="nearby-sheet-title">{formatDistance(selectedShare.approximateDistanceM)}</h2>
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
			<Button type="button" onclick={() => openShare(selectedShare)}>
				{t('nearbySharing.openShareBtn')}
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
		margin-bottom: var(--space-md);
	}

	.discovery-header h1 {
		margin: 0;
		font-size: 1.35rem;
	}

	.discovery-header p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.trust-note {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface-muted));
		border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
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

	.pro-hint a {
		font-weight: 600;
	}

	.status {
		margin: 0;
		color: var(--color-text-muted);
	}

	.empty-panel {
		display: grid;
		gap: var(--space-md);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.empty-panel h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	.empty-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.share-list {
		margin-top: var(--space-lg);
		display: grid;
		gap: var(--space-sm);
	}

	.share-list h2 {
		margin: 0;
		font-size: 1rem;
	}

	.share-list ul {
		margin: 0;
		padding: 0;
		list-style: none;
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

	.cta-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-primary);
		background: var(--color-primary);
		color: var(--color-on-primary, #fff);
		font-weight: 600;
		text-decoration: none;
	}

	.cta-link.secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border-color: var(--color-border);
	}
</style>
