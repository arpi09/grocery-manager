<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import MarketChatBubble from '$lib/components/molecules/MarketChatBubble.svelte';
	import MarketChatListingCard from '$lib/components/molecules/MarketChatListingCard.svelte';
	import MarketChatOverflowMenu from '$lib/components/molecules/MarketChatOverflowMenu.svelte';
	import MarketChatStepper from '$lib/components/molecules/MarketChatStepper.svelte';
	import MarketPickupPaymentCard from '$lib/components/molecules/MarketPickupPaymentCard.svelte';
	import MarketRatingSheet from '$lib/components/molecules/MarketRatingSheet.svelte';
	import type { MarketItemsAsDescribed, MarketLifecycleStatus } from '$lib/domain/market-lifecycle';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	let { data } = $props();

	const POLL_MS = 5_000;
	const OPTIMISTIC_PREFIX = 'optimistic-';

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
	type PaymentContext = {
		askingPriceSek: number;
		sharerSwishNumber: string | null;
		isSeeker: boolean;
		sharerFirstName: string;
	};
	let paymentContext = $state<PaymentContext | null>(
		data.paymentContext
			? {
					askingPriceSek: data.paymentContext.askingPriceSek,
					sharerSwishNumber: data.paymentContext.sharerSwishNumber,
					isSeeker: data.paymentContext.isSeeker,
					sharerFirstName: data.paymentContext.sharerFirstName
				}
			: null
	);
	let draft = $state('');
	let sending = $state(false);
	let lifecycleAction = $state<'pickup' | 'agree' | 'handover' | null>(null);
	let ratingSheetOpen = $state(false);
	let ratingSubmitting = $state(false);
	let myRating = $state(data.myRating);
	let counterpartRating = $state(data.counterpartRating);
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let messagesEl: HTMLDivElement | undefined = $state();

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
	const showPaymentCard = $derived(Boolean(paymentContext));
	const showLifecycleChips = $derived(
		showComposer &&
			(showPickupActions || showHandoverAction) &&
			!(showHandoverAction && myMarkedComplete && !counterpartMarkedComplete)
	);
	const showHandoverStatus = $derived(
		showHandoverAction &&
			(myMarkedComplete || counterpartMarkedComplete || lifecycleStatus === 'awaiting_handover')
	);

	function isOptimisticMessage(message: ChatMessage): boolean {
		return message.id.startsWith(OPTIMISTIC_PREFIX);
	}

	function mergeMessages(serverMessages: ChatMessage[]): ChatMessage[] {
		const pending = messages.filter(isOptimisticMessage);
		if (pending.length === 0) {
			return serverMessages;
		}

		const merged = [...serverMessages];
		for (const optimistic of pending) {
			const alreadyConfirmed = serverMessages.some(
				(message) =>
					message.authorUserId === optimistic.authorUserId &&
					message.body === optimistic.body
			);
			if (!alreadyConfirmed) {
				merged.push(optimistic);
			}
		}
		return merged;
	}

	async function scrollMessagesToBottom() {
		await tick();
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
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
				paymentContext?: PaymentContext | null;
			};
			if (!response.ok || !payload.ok) {
				return;
			}
			messages = mergeMessages(payload.messages ?? messages);
			applyThreadSnapshot(payload.thread);
			if (payload.paymentContext !== undefined) {
				paymentContext = payload.paymentContext;
			}
			void scrollMessagesToBottom();
		} catch {
			// polling is best-effort
		}
	}

	async function sendMessage() {
		const body = draft.trim();
		if (!body || !showComposer) {
			return;
		}

		const optimisticId = `${OPTIMISTIC_PREFIX}${crypto.randomUUID()}`;
		messages = [
			...messages,
			{
				id: optimisticId,
				authorUserId: data.user.id,
				body,
				createdAt: new Date()
			}
		];
		draft = '';
		void scrollMessagesToBottom();

		sending = true;
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ body })
			});
			if (!response.ok) {
				messages = messages.filter((message) => message.id !== optimisticId);
				draft = body;
				showClientToast(t('marketV01.sendMessageFailed'), { variant: 'error' });
				return;
			}
			await refreshThread();
		} catch {
			messages = messages.filter((message) => message.id !== optimisticId);
			draft = body;
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
		void goto('/grannskafferiet/marknad/meddelanden');
	}

	function closeRatingSheet() {
		ratingSheetOpen = false;
	}

	onMount(() => {
		if (data.thread.lifecycleStatus === 'completed' && !data.myRating) {
			ratingSheetOpen = true;
		}

		void scrollMessagesToBottom();

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
	<div class="chat-screen" data-testid="market-chat-thread">
		<header class="chat-header">
			<div class="header-top">
				<button
					type="button"
					class="back-btn"
					aria-label={t('marketV05.backToInboxAria')}
					onclick={() => goto('/grannskafferiet/marknad/meddelanden')}
				>
					<span aria-hidden="true">←</span>
					<span class="back-label">{t('marketV05.backToInbox')}</span>
				</button>
				{#if !threadClosed}
					<MarketChatOverflowMenu
						threadId={data.thread.id}
						onThreadClosed={() => void refreshThread()}
					/>
				{/if}
			</div>

			<div class="participant">
				{#if data.counterpart.avatarUrl}
					<img class="avatar" src={data.counterpart.avatarUrl} alt="" />
				{:else}
					<span class="avatar avatar-fallback" aria-hidden="true">
						{data.counterpart.firstName.slice(0, 1).toUpperCase()}
					</span>
				{/if}
				<div class="participant-text">
					<h1>{data.counterpart.firstName}</h1>
					<p class="rating">{ratingLabel}</p>
				</div>
			</div>

			<MarketChatStepper status={lifecycleStatus} compact />
		</header>

		{#if data.listingContext}
			<div class="listing-pin">
				<MarketChatListingCard
					shareId={data.listingContext.shareId}
					items={data.listingContext.items}
				/>
			</div>
		{/if}

		<div class="messages-scroll" bind:this={messagesEl} aria-live="polite">
			<div class="messages-list">
				{#each messages as message (message.id)}
					<MarketChatBubble
						body={message.body}
						createdAt={message.createdAt}
						mine={message.authorUserId === data.user.id}
					/>
				{/each}
			</div>

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
						<Button
							type="button"
							variant="secondary"
							onclick={() => goto('/grannskafferiet/marknad/meddelanden')}
						>
							{t('marketV05.backToInbox')}
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
			{/if}
		</div>

		{#if showComposer}
			<footer class="chat-footer">
				{#if showHandoverStatus}
					<section class="handover-compact" aria-label={t('marketV05.handoverStatusCompact')}>
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

				{#if showLifecycleChips}
					<div class="lifecycle-chips" role="group" aria-label={t('marketV05.lifecycleActionsAria')}>
						{#if showPickupActions}
							{#if lifecycleStatus === 'chatting'}
								<button
									type="button"
									class="chip"
									disabled={lifecycleAction != null}
									onclick={() => void proposePickup()}
								>
									{lifecycleAction === 'pickup' ? t('common.loading') : t('marketV03.proposePickupBtn')}
								</button>
							{/if}
							<button
								type="button"
								class="chip"
								disabled={lifecycleAction != null}
								onclick={() => void confirmPickupAgreement()}
							>
								{lifecycleAction === 'agree' ? t('common.loading') : t('marketV03.confirmPickupBtn')}
							</button>
						{/if}
						{#if showHandoverAction}
							<button
								type="button"
								class="chip chip-primary"
								disabled={lifecycleAction != null || myMarkedComplete}
								onclick={() => void confirmHandover()}
							>
								{lifecycleAction === 'handover'
									? t('common.loading')
									: myMarkedComplete
										? t('marketV03.handoverMarkedByYou')
										: t('marketV03.confirmHandoverBtn')}
							</button>
						{/if}
					</div>
				{/if}

				{#if showPaymentCard && paymentContext}
					<div class="footer-payment">
						<MarketPickupPaymentCard
							askingPriceSek={paymentContext.askingPriceSek}
							sharerSwishNumber={paymentContext.sharerSwishNumber}
							sharerFirstName={paymentContext.sharerFirstName}
							isSeeker={paymentContext.isSeeker}
							threadId={data.thread.id}
						/>
					</div>
				{/if}

				<form
					class="composer"
					onsubmit={(event) => {
						event.preventDefault();
						void sendMessage();
					}}
				>
					<label class="sr-only" for="market-chat-input">{t('marketV01.messageInputLabel')}</label>
					<div class="composer-row">
						<textarea
							id="market-chat-input"
							rows="1"
							bind:value={draft}
							placeholder={t('marketV01.messageInputPlaceholder')}
							disabled={sending}
							onkeydown={(event) => {
								if (event.key === 'Enter' && !event.shiftKey) {
									event.preventDefault();
									void sendMessage();
								}
							}}
						></textarea>
						<button
							type="submit"
							class="send-btn"
							disabled={sending || !draft.trim()}
							aria-label={t('marketV01.sendMessageBtn')}
						>
							{t('marketV01.sendMessageBtn')}
						</button>
					</div>
				</form>
			</footer>
		{/if}
	</div>
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
	.chat-screen {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-height: 100dvh;
		background: var(--color-surface);
	}

	.chat-header {
		position: sticky;
		top: 0;
		z-index: 10;
		flex-shrink: 0;
		padding: var(--space-sm) var(--space-md) var(--space-md);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		display: grid;
		gap: var(--space-sm);
	}

	.header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) 0;
		border: none;
		background: transparent;
		font: inherit;
		font-size: 0.875rem;
		color: var(--color-primary);
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.back-label {
		display: none;
	}

	@media (min-width: 480px) {
		.back-label {
			display: inline;
		}
	}

	.participant {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.participant-text {
		min-width: 0;
	}

	h1 {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.2;
	}

	.rating {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 999px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.avatar-fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-muted);
		font-weight: 700;
	}

	.listing-pin {
		flex-shrink: 0;
	}

	.messages-scroll {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.messages-list {
		display: grid;
		gap: var(--space-sm);
		margin-top: auto;
	}

	.chat-footer {
		flex-shrink: 0;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
		padding: var(--space-sm) var(--space-md);
		padding-bottom: max(var(--space-sm), env(safe-area-inset-bottom));
		display: grid;
		gap: var(--space-sm);
	}

	.handover-compact {
		display: grid;
		gap: var(--space-2xs);
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		font-size: 0.8125rem;
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

	.exchange-status {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.lifecycle-chips {
		display: flex;
		flex-wrap: nowrap;
		gap: var(--space-xs);
		overflow-x: auto;
		padding-bottom: var(--space-2xs);
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.lifecycle-chips::-webkit-scrollbar {
		display: none;
	}

	.chip {
		flex-shrink: 0;
		padding: var(--space-xs) var(--space-md);
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		min-height: var(--touch-target-min);
	}

	.chip:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.chip-primary {
		border-color: var(--color-primary);
		background: var(--color-primary);
		color: var(--color-on-primary, #fff);
	}

	.footer-payment :global(.payment-card) {
		margin-bottom: 0;
	}

	.footer-payment :global(.payment-card-inner) {
		padding: var(--space-sm);
	}

	.footer-payment :global(h2) {
		font-size: 0.9375rem;
	}

	.composer-row {
		display: flex;
		align-items: flex-end;
		gap: var(--space-sm);
	}

	textarea {
		flex: 1;
		min-height: 2.5rem;
		max-height: 6rem;
		padding: var(--space-sm) var(--space-md);
		border-radius: 1.25rem;
		border: 1px solid var(--color-border);
		font: inherit;
		font-size: 0.9375rem;
		resize: none;
		line-height: 1.35;
	}

	.send-btn {
		flex-shrink: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: 999px;
		border: none;
		background: var(--color-primary);
		color: var(--color-on-primary, #fff);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.closed-panel {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.closed-panel h2 {
		margin: 0;
		font-size: 1rem;
	}

	.closed-panel p {
		margin: 0;
		color: var(--color-text-muted);
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
