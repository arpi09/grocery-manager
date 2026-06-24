<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import MarketListingPriceBadge from '$lib/components/molecules/MarketListingPriceBadge.svelte';
	import {
		filterInboxThreadsBySegment,
		formatMarketInboxRelativeTime,
		type MarketInboxListingPreview,
		type MarketInboxSegment
	} from '$lib/domain/market-inbox';
	import type { MarketLifecycleStatus } from '$lib/domain/market-lifecycle';
	import { getLocale, t } from '$lib/i18n';
	import { setMarketUnreadCount } from '$lib/stores/market-unread.svelte';

	interface Props {
		nearbyOptedIn?: boolean;
	}

	let { nearbyOptedIn = true }: Props = $props();

	type InboxThread = {
		id: string;
		shareId: string;
		seekerUserId: string;
		sharerUserId: string;
		lifecycleStatus: MarketLifecycleStatus;
		closedAt: string | null;
		unread: boolean;
		counterpartFirstName: string;
		counterpartAvatarUrl: string | null;
		lastMessageBody: string | null;
		lastMessageAt: string;
		listingPreview: MarketInboxListingPreview | null;
	};

	const locale = getLocale();
	const POLL_MS = 5_000;
	const PULL_THRESHOLD = 72;

	let segment = $state<MarketInboxSegment>('active');
	let threads = $state<InboxThread[]>([]);
	let loading = $state(true);
	let refreshing = $state(false);
	let loadError = $state(false);
	let pullDistance = $state(0);
	let touchStartY = $state<number | null>(null);
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let listEl = $state<HTMLDivElement | null>(null);

	const filteredThreads = $derived(filterInboxThreadsBySegment(threads, segment));

	function parseThreads(raw: unknown): InboxThread[] {
		if (!raw || typeof raw !== 'object' || !('threads' in raw)) {
			return [];
		}
		const payload = raw as { threads?: InboxThread[] };
		return payload.threads ?? [];
	}

	async function loadThreads(options: { silent?: boolean } = {}) {
		if (!nearbyOptedIn) {
			threads = [];
			setMarketUnreadCount(0);
			loading = false;
			refreshing = false;
			return;
		}

		if (!options.silent) {
			loading = threads.length === 0;
		}

		try {
			const response = await fetch('/api/market/chats');
			const payload = (await response.json()) as {
				ok?: boolean;
				threads?: InboxThread[];
				unreadCount?: number;
			};
			if (!response.ok || !payload.ok) {
				loadError = true;
				return;
			}

			threads = parseThreads(payload);
			setMarketUnreadCount(payload.unreadCount ?? 0);
			loadError = false;
		} catch {
			loadError = true;
		} finally {
			loading = false;
			refreshing = false;
			pullDistance = 0;
		}
	}

	function threadPath(threadId: string): string {
		return `/grannskafferiet/marknad/chatt/${threadId}`;
	}

	function previewSnippet(thread: InboxThread): string {
		if (thread.lastMessageBody?.trim()) {
			return thread.lastMessageBody.trim();
		}
		return t('marketV05.inboxNoMessagesYet');
	}

	function listingTitle(thread: InboxThread): string {
		return thread.listingPreview?.title ?? t('marketV01.listingTitle');
	}

	function listingBadgeItem(thread: InboxThread): MarketInboxListingPreview {
		return (
			thread.listingPreview ?? {
				title: t('marketV01.listingTitle'),
				pricingMode: 'free'
			}
		);
	}

	function onTouchStart(event: TouchEvent) {
		if (listEl && listEl.scrollTop <= 0) {
			touchStartY = event.touches[0]?.clientY ?? null;
		}
	}

	function onTouchMove(event: TouchEvent) {
		if (touchStartY == null || refreshing) {
			return;
		}
		const currentY = event.touches[0]?.clientY ?? touchStartY;
		const delta = Math.max(0, currentY - touchStartY);
		if (delta > 0 && listEl && listEl.scrollTop <= 0) {
			pullDistance = Math.min(delta, PULL_THRESHOLD * 1.5);
			if (delta > 8) {
				event.preventDefault();
			}
		}
	}

	async function onTouchEnd() {
		if (pullDistance >= PULL_THRESHOLD && !refreshing) {
			refreshing = true;
			await loadThreads({ silent: true });
		} else {
			pullDistance = 0;
		}
		touchStartY = null;
	}

	onMount(() => {
		void loadThreads();
		if (nearbyOptedIn) {
			pollTimer = setInterval(() => {
				void loadThreads({ silent: true });
			}, POLL_MS);
		}
	});

	onDestroy(() => {
		if (pollTimer) {
			clearInterval(pollTimer);
		}
	});
</script>

<section class="inbox" data-testid="market-inbox">
	<div class="inbox-header">
		<h1>{t('marketV05.inboxTitle')}</h1>
		<div class="segment-row" role="tablist" aria-label={t('marketV05.inboxSegmentAria')}>
			<button
				type="button"
				class="segment-chip"
				class:segment-chip-active={segment === 'active'}
				role="tab"
				aria-selected={segment === 'active'}
				data-testid="market-inbox-segment-active"
				onclick={() => {
					segment = 'active';
				}}
			>
				{t('marketV05.inboxSegmentActive')}
			</button>
			<button
				type="button"
				class="segment-chip"
				class:segment-chip-active={segment === 'closed'}
				role="tab"
				aria-selected={segment === 'closed'}
				data-testid="market-inbox-segment-closed"
				onclick={() => {
					segment = 'closed';
				}}
			>
				{t('marketV05.inboxSegmentClosed')}
			</button>
		</div>
	</div>

	{#if !nearbyOptedIn}
		<p class="inbox-note">{t('marketV01.nearbyOptInPrompt')}</p>
		<p class="inbox-note">
			<a href="/settings#settings-nearby-sharing">{t('marketV01.nearbyOptInLink')}</a>
		</p>
	{:else}
		<div
			class="pull-region"
			class:pull-region-active={pullDistance > 0 || refreshing}
			style={`--pull-distance: ${pullDistance}px`}
		>
			<p class="pull-indicator" aria-live="polite">
				{#if refreshing}
					{t('marketV05.inboxRefreshing')}
				{:else if pullDistance >= PULL_THRESHOLD}
					{t('marketV05.inboxReleaseRefresh')}
				{:else if pullDistance > 0}
					{t('marketV05.inboxPullRefresh')}
				{/if}
			</p>

			<div
				class="thread-list-shell"
				role="region"
				aria-label={t('marketV05.inboxTitle')}
				bind:this={listEl}
				ontouchstart={onTouchStart}
				ontouchmove={onTouchMove}
				ontouchend={onTouchEnd}
				ontouchcancel={onTouchEnd}
			>
				{#if loading}
					<p class="inbox-status">{t('common.loading')}</p>
				{:else if loadError}
					<p class="inbox-status">{t('marketV05.inboxLoadFailed')}</p>
				{:else if filteredThreads.length === 0}
					<p class="inbox-status">
						{segment === 'active' ? t('marketV05.inboxEmptyActive') : t('marketV05.inboxEmptyClosed')}
					</p>
				{:else}
					<ul class="thread-list">
						{#each filteredThreads as thread (thread.id)}
							<li>
								<a
									href={threadPath(thread.id)}
									class={['thread-row', thread.unread ? 'thread-row-unread' : ''].filter(Boolean).join(' ')}
									data-testid={`market-inbox-thread-${thread.id}`}
								>
									<span class="avatar-wrap">
										{#if thread.counterpartAvatarUrl}
											<img class="avatar" src={thread.counterpartAvatarUrl} alt="" />
										{:else}
											<span class="avatar avatar-fallback" aria-hidden="true">
												{thread.counterpartFirstName.slice(0, 1).toUpperCase()}
											</span>
										{/if}
										{#if thread.unread}
											<span class="unread-dot" aria-label={t('marketV01.chatUnreadBadge')}></span>
										{/if}
									</span>

									<span class="thread-main">
										<span class="thread-top">
											<span class="thread-name">{thread.counterpartFirstName}</span>
											<time class="thread-time" datetime={thread.lastMessageAt}>
												{formatMarketInboxRelativeTime(new Date(thread.lastMessageAt), locale)}
											</time>
										</span>
										<span class="thread-listing">
											<span class="listing-title">{listingTitle(thread)}</span>
											<MarketListingPriceBadge item={listingBadgeItem(thread)} />
										</span>
										<span class="thread-preview">{previewSnippet(thread)}</span>
									</span>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</section>

<style>
	.inbox {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		gap: var(--space-sm);
	}

	.inbox-header {
		display: grid;
		gap: var(--space-sm);
		padding-top: var(--space-xs);
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
	}

	.segment-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.segment-chip {
		min-height: var(--touch-target-min, 2.75rem);
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.segment-chip-active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-primary);
	}

	.inbox-note,
	.inbox-status {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
	}

	.inbox-note a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.pull-region {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.pull-indicator {
		height: 0;
		margin: 0;
		overflow: hidden;
		text-align: center;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		transition: height 0.15s ease;
	}

	.pull-region-active .pull-indicator {
		height: calc(var(--pull-distance, 0px) * 0.35);
		min-height: 1.25rem;
		padding-top: 0.25rem;
	}

	.thread-list-shell {
		flex: 1;
		min-height: 0;
		overflow: auto;
		-webkit-overflow-scrolling: touch;
	}

	.thread-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.thread-row {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
	}

	.thread-row:hover {
		background: color-mix(in srgb, var(--color-primary) 4%, transparent);
	}

	.thread-row-unread .thread-name,
	.thread-row-unread .thread-preview {
		font-weight: 700;
	}

	.avatar-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.avatar {
		width: 3rem;
		height: 3rem;
		border-radius: 999px;
		object-fit: cover;
	}

	.avatar-fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-muted);
		font-weight: 700;
	}

	.unread-dot {
		position: absolute;
		top: 0;
		right: 0;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 999px;
		background: var(--color-warning);
		border: 2px solid var(--color-surface);
	}

	.thread-main {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.thread-top,
	.thread-listing {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-width: 0;
	}

	.thread-name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.thread-time {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.listing-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.thread-preview {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
