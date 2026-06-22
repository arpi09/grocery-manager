<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import MarketChatOverflowMenu from '$lib/components/molecules/MarketChatOverflowMenu.svelte';
	import MarketChatStepper from '$lib/components/molecules/MarketChatStepper.svelte';
	import MarketRatingSheet from '$lib/components/molecules/MarketRatingSheet.svelte';
	import type { MarketItemsAsDescribed, MarketLifecycleStatus } from '$lib/domain/market-lifecycle';
	import { getLocale, t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	let { data } = $props();

	const locale = getLocale();
	const POLL_MS = 5_000;

	type ChatMessage = {
		id: string;
		authorUserId: string;
		body: string;
		createdAt: string | Date;
	};

	type ThreadSnapshot = {
		closedAt?: string | null;
		exchangeStatus?: 'ongoing' | 'completed';
		lifecycleStatus?: MarketLifecycleStatus;
		seekerCompletedAt?: string | null;
		sharerCompletedAt?: string | null;
	};

	let messages = $state<ChatMessage[]>(
		data.messages.map((message) => ({
			...message,
			createdAt: message.createdAt
		}))
	);
	let lifecycleStatus = $state<MarketLifecycleStatus>(data.thread.lifecycleStatus);
	let threadClosed = $state(
		data.thread.lifecycleStatus === 'completed' ||
			data.thread.lifecycleStatus === 'cancelled' ||
			data.thread.lifecycleStatus === 'reported' ||
			Boolean(data.thread.closedAt)
	);
	let myMarkedComplete = $state(data.myMarkedComplete);
	let counterpartMarkedComplete = $state(data.counterpartMarkedComplete);
	let draft = $state('');
	let sending = $state(false);
	let lifecycleAction = $state<'pickup' | 'agree' | 'handover' | null>(null);
	let ratingSheetOpen = $state(false);
	let ratingSubmitting = $state(false);
	let myRating = $state(data.myRating);
	let counterpartRating = $state(data.counterpartRating);
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	const showRatingSheet = $derived(
		threadClosed && lifecycleStatus === 'completed' && !myRating && ratingSheetOpen
	);

	const ratingLabel = $derived(
		data.counterpart.rating.ratingCount > 0 && data.counterpart.rating.averageStars != null
			? t('marketV01.ratingSummary', {
					stars: data.counterpart.rating.averageStars.toFixed(1),
					count: data.counterpart.rating.ratingCount
				})
			: t('marketV01.ratingNewHere')
	);

	const showPickupActions = $derived(
		lifecycleStatus === 'chatting' || lifecycleStatus === 'pickup_agreed'
	);
	const showHandoverAction = $derived(
		!threadClosed &&
			(lifecycleStatus === 'chatting' ||
				lifecycleStatus === 'pickup_agreed' ||
				lifecycleStatus === 'awaiting_handover')
	);
	const showComposer = $derived(!threadClosed);

	function formatMessageTime(value: string | Date): string {
		const date = value instanceof Date ? value : new Date(value);
		return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(date);
	}

	function applyThreadSnapshot(thread: ThreadSnapshot | undefined) {
		if (!thread) {
			return;
		}

		const isSeeker = data.user.id === data.thread.seekerUserId;
		myMarkedComplete = isSeeker
			? Boolean(thread.seekerCompletedAt)
			: Boolean(thread.sharerCompletedAt);
		counterpartMarkedComplete = isSeeker
			? Boolean(thread.sharerCompletedAt)
			: Boolean(thread.seekerCompletedAt);

		if (thread.lifecycleStatus) {
			lifecycleStatus = thread.lifecycleStatus;
		}

		threadClosed =
			lifecycleStatus === 'completed' ||
			lifecycleStatus === 'cancelled' ||
			lifecycleStatus === 'reported' ||
			Boolean(thread.closedAt);
	}

	async function refreshThread() {
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}`);
			const payload = (await response.json()) as {
				ok?: boolean;
				thread?: ThreadSnapshot;
				messages?: ChatMessage[];
			};
			if (!response.ok || !payload.ok) {
				return;
			}
			messages = payload.messages ?? messages;
			applyThreadSnapshot(payload.thread);
		} catch {
			// polling is best-effort
		}
	}

	async function sendMessage() {
		const body = draft.trim();
		if (!body || !showComposer) {
			return;
		}

		sending = true;
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body })
			});
			if (!response.ok) {
				showClientToast(t('marketV01.sendMessageFailed'), { variant: 'error' });
				return;
			}
			draft = '';
			await refreshThread();
		} catch {
			showClientToast(t('marketV01.sendMessageFailed'), { variant: 'error' });
		} finally {
			sending = false;
		}
	}

	async function proposePickup() {
		lifecycleAction = 'pickup';
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/propose-pickup`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			const payload = (await response.json()) as { ok?: boolean; thread?: ThreadSnapshot };
			if (!response.ok || !payload.ok) {
				showClientToast(t('marketV03.proposePickupFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('marketV03.proposePickupSuccess'), { variant: 'success' });
			applyThreadSnapshot(payload.thread);
			await refreshThread();
		} catch {
			showClientToast(t('marketV03.proposePickupFailed'), { variant: 'error' });
		} finally {
			lifecycleAction = null;
		}
	}

	async function confirmPickupAgreement() {
		lifecycleAction = 'agree';
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/confirm-pickup`, {
				method: 'POST'
			});
			const payload = (await response.json()) as { ok?: boolean; thread?: ThreadSnapshot };
			if (!response.ok || !payload.ok) {
				showClientToast(t('marketV03.confirmPickupFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('marketV03.confirmPickupSuccess'), { variant: 'success' });
			applyThreadSnapshot(payload.thread);
			await refreshThread();
		} catch {
			showClientToast(t('marketV03.confirmPickupFailed'), { variant: 'error' });
		} finally {
			lifecycleAction = null;
		}
	}

	async function confirmHandover() {
		lifecycleAction = 'handover';
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/confirm-handover`, {
				method: 'POST'
			});
			const payload = (await response.json()) as {
				ok?: boolean;
				thread?: ThreadSnapshot;
			};
			if (!response.ok || !payload.ok) {
				showClientToast(t('marketV03.confirmHandoverFailed'), { variant: 'error' });
				return;
			}
			applyThreadSnapshot(payload.thread);
			if (!threadClosed) {
				showClientToast(t('marketV03.handoverMarkedByYou'), { variant: 'success' });
			} else {
				await refreshThread();
			}
		} catch {
			showClientToast(t('marketV03.confirmHandoverFailed'), { variant: 'error' });
		} finally {
			lifecycleAction = null;
		}
	}

	async function submitRating(payload: {
		stars: number;
		comment: string | null;
		itemsAsDescribed: MarketItemsAsDescribed | null;
	}) {
		ratingSubmitting = true;
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/rate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					stars: payload.stars,
					comment: payload.comment,
					items_as_described: payload.itemsAsDescribed
				})
			});
			const result = (await response.json()) as {
				ok?: boolean;
				counterpartRating?: typeof counterpartRating;
			};
			if (!response.ok || !result.ok) {
				showClientToast(t('marketV01.rateFailed'), { variant: 'error' });
				return;
			}
			myRating = {
				stars: payload.stars,
				comment: payload.comment,
				itemsAsDescribed: payload.itemsAsDescribed
			};
			if (result.counterpartRating) {
				counterpartRating = result.counterpartRating;
			}
			ratingSheetOpen = false;
			showClientToast(t('marketV01.rateSuccess'), { variant: 'success' });
		} catch {
			showClientToast(t('marketV01.rateFailed'), { variant: 'error' });
		} finally {
			ratingSubmitting = false;
		}
	}

	function skipRating() {
		ratingSheetOpen = false;
		void goto('/grannskafferiet/marknad');
	}

	function closeRatingSheet() {
		ratingSheetOpen = false;
	}

	onMount(() => {
		if (
			data.thread.lifecycleStatus === 'completed' &&
			!data.myRating
		) {
			ratingSheetOpen = true;
		}

		pollTimer = setInterval(() => {
			void refreshThread();
		}, POLL_MS);
	});

	onDestroy(() => {
		if (pollTimer) {
			clearInterval(pollTimer);
		}
	});
</script>

<svelte:head>
	<title>{t('marketV01.chatTitle', { name: data.counterpart.firstName })}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AppLayout user={data.user}>
	<PageContainer>
		<header class="chat-header" data-testid="market-chat-thread">
			<div class="participant">
				{#if data.counterpart.avatarUrl}
					<img class="avatar" src={data.counterpart.avatarUrl} alt="" />
				{:else}
					<span class="avatar avatar-fallback" aria-hidden="true">
						{data.counterpart.firstName.slice(0, 1).toUpperCase()}
					</span>
				{/if}
				<div>
					<h1>{data.counterpart.firstName}</h1>
					<p class="rating">{ratingLabel}</p>
				</div>
			</div>
			<Button type="button" variant="secondary" onclick={() => goto('/grannskafferiet/marknad')}>
				{t('marketV01.backToMarketBtn')}
			</Button>
			{#if !threadClosed}
				<MarketChatOverflowMenu
					threadId={data.thread.id}
					onThreadClosed={() => void refreshThread()}
				/>
			{/if}
		</header>

		<MarketChatStepper status={lifecycleStatus} />

		<ul class="message-list" aria-live="polite">
			{#each messages as message (message.id)}
				<li class:mine={message.authorUserId === data.user.id}>
					<Card class="message-card">
						<p class="body">{message.body}</p>
						<time datetime={String(message.createdAt)}>{formatMessageTime(message.createdAt)}</time>
					</Card>
				</li>
			{/each}
		</ul>

		{#if threadClosed && lifecycleStatus === 'completed'}
			<section class="closed-panel" aria-labelledby="market-closed-heading">
				<h2 id="market-closed-heading">{t('marketV03.handoverCompleteTitle')}</h2>
				{#if myRating}
					<p>{t('marketV01.ratingAlreadySubmitted', { stars: myRating.stars })}</p>
					{#if counterpartRating}
						<div class="counterpart-rating" data-testid="market-counterpart-rating">
							<p class="counterpart-rating-label">
								{t('marketV03.counterpartRatingLabel', { name: data.counterpart.firstName })}
							</p>
							<p
								class="counterpart-rating-stars"
								aria-label={t('marketV03.reviewStarsAria', { stars: counterpartRating.stars })}
							>
								{'★'.repeat(counterpartRating.stars)}{'☆'.repeat(5 - counterpartRating.stars)}
							</p>
							{#if counterpartRating.comment}
								<p class="counterpart-rating-comment">{counterpartRating.comment}</p>
							{/if}
						</div>
					{:else}
						<p class="blind-wait">
							{t('marketV03.counterpartRatingPending', { name: data.counterpart.firstName })}
						</p>
					{/if}
					<Button type="button" variant="secondary" onclick={() => goto('/grannskafferiet/marknad')}>
						{t('marketV01.backToMarketBtn')}
					</Button>
				{:else}
					<p>{t('marketV01.ratePrompt')}</p>
					<Button type="button" onclick={() => (ratingSheetOpen = true)}>
						{t('marketV03.openRatingSheetBtn')}
					</Button>
				{/if}
			</section>
		{:else if threadClosed && lifecycleStatus === 'cancelled'}
			<section class="closed-panel" aria-labelledby="market-cancelled-heading">
				<h2 id="market-cancelled-heading">{t('marketV03.threadCancelledTitle')}</h2>
				<p>{t('marketV03.threadCancelledLead')}</p>
			</section>
		{:else if threadClosed && lifecycleStatus === 'reported'}
			<section class="closed-panel" aria-labelledby="market-reported-heading">
				<h2 id="market-reported-heading">{t('marketV03.threadReportedTitle')}</h2>
				<p>{t('marketV03.threadReportedLead')}</p>
			</section>
		{:else if showComposer}
			{#if showHandoverAction && (myMarkedComplete || counterpartMarkedComplete || lifecycleStatus === 'awaiting_handover')}
				<section class="handover-panel" aria-labelledby="market-handover-heading">
					<h2 id="market-handover-heading">{t('marketV03.handoverPrompt')}</h2>
					<ul class="handover-status">
						<li class:done={myMarkedComplete}>
							<span aria-hidden="true">{myMarkedComplete ? '✓' : '○'}</span>
							{t('marketV03.handoverYouConfirmed')}
						</li>
						<li class:done={counterpartMarkedComplete}>
							<span aria-hidden="true">{counterpartMarkedComplete ? '✓' : '○'}</span>
							{counterpartMarkedComplete
								? t('marketV03.handoverCounterpartConfirmed', { name: data.counterpart.firstName })
								: t('marketV03.handoverCounterpartWaiting', { name: data.counterpart.firstName })}
						</li>
					</ul>
					{#if myMarkedComplete && !counterpartMarkedComplete}
						<p class="exchange-status">
							{t('marketV03.handoverWaitingCounterpart', { name: data.counterpart.firstName })}
						</p>
					{/if}
				</section>
			{/if}

			<form
				class="composer"
				onsubmit={(event) => {
					event.preventDefault();
					void sendMessage();
				}}
			>
				<label class="sr-only" for="market-chat-input">{t('marketV01.messageInputLabel')}</label>
				<textarea
					id="market-chat-input"
					rows="3"
					bind:value={draft}
					placeholder={t('marketV01.messageInputPlaceholder')}
					disabled={sending}
				></textarea>
				<div class="composer-actions">
					<Button type="submit" disabled={sending || !draft.trim()}>{t('marketV01.sendMessageBtn')}</Button>
					{#if showPickupActions}
						{#if lifecycleStatus === 'chatting'}
							<Button
								type="button"
								variant="secondary"
								disabled={lifecycleAction != null}
								onclick={() => void proposePickup()}
							>
								{lifecycleAction === 'pickup' ? t('common.loading') : t('marketV03.proposePickupBtn')}
							</Button>
						{/if}
						<Button
							type="button"
							variant="secondary"
							disabled={lifecycleAction != null}
							onclick={() => void confirmPickupAgreement()}
						>
							{lifecycleAction === 'agree' ? t('common.loading') : t('marketV03.confirmPickupBtn')}
						</Button>
					{/if}
					{#if showHandoverAction}
						<Button
							type="button"
							variant="secondary"
							disabled={lifecycleAction != null || myMarkedComplete}
							onclick={() => void confirmHandover()}
						>
							{lifecycleAction === 'handover'
								? t('common.loading')
								: myMarkedComplete
									? t('marketV03.handoverMarkedByYou')
									: t('marketV03.confirmHandoverBtn')}
						</Button>
					{/if}
				</div>
			</form>
		{/if}
	</PageContainer>
</AppLayout>

<MarketRatingSheet
	open={showRatingSheet}
	counterpartFirstName={data.counterpart.firstName}
	submitting={ratingSubmitting}
	onClose={closeRatingSheet}
	onSkip={skipRating}
	onSubmit={(payload) => void submitRating(payload)}
/>

<style>
	.chat-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.participant {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	h1 {
		margin: 0;
		font-size: 1.2rem;
	}

	.rating {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
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

	.message-list {
		margin: 0 0 var(--space-lg);
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	.message-list li {
		display: flex;
	}

	.message-list li.mine {
		justify-content: flex-end;
	}

	:global(.message-card) {
		max-width: min(36rem, 100%);
		display: grid;
		gap: var(--space-2xs);
	}

	.body {
		margin: 0;
		white-space: pre-wrap;
	}

	time {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.composer {
		display: grid;
		gap: var(--space-sm);
	}

	textarea {
		width: 100%;
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		font: inherit;
		resize: vertical;
	}

	.composer-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.exchange-status {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.handover-panel,
	.closed-panel {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		margin-bottom: var(--space-md);
	}

	.handover-panel h2,
	.closed-panel h2 {
		margin: 0;
		font-size: 1rem;
	}

	.closed-panel p {
		margin: 0;
		color: var(--color-text-muted);
	}

	.handover-status {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-2xs);
	}

	.handover-status li {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--color-text-muted);
	}

	.handover-status li.done {
		color: var(--color-text);
		font-weight: 600;
	}

	.counterpart-rating {
		display: grid;
		gap: var(--space-2xs);
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.counterpart-rating-label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.counterpart-rating-stars {
		margin: 0;
		color: var(--color-warning, #d4a017);
		font-size: 1.25rem;
	}

	.counterpart-rating-comment {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.blind-wait {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
