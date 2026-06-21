<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { getLocale, t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	let { data } = $props();

	const locale = getLocale();
	const POLL_MS = 10_000;

	type ChatMessage = {
		id: string;
		authorUserId: string;
		body: string;
		createdAt: string | Date;
	};

	let messages = $state<ChatMessage[]>(
		data.messages.map((message) => ({
			...message,
			createdAt: message.createdAt
		}))
	);
	let threadClosed = $state(Boolean(data.thread.closedAt));
	let draft = $state('');
	let sending = $state(false);
	let closing = $state(false);
	let ratingStars = $state(0);
	let ratingSubmitting = $state(false);
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	const ratingLabel = $derived(
		data.counterpart.rating.ratingCount > 0 && data.counterpart.rating.averageStars != null
			? t('marketV01.ratingSummary', {
					stars: data.counterpart.rating.averageStars.toFixed(1),
					count: data.counterpart.rating.ratingCount
				})
			: t('marketV01.ratingNewHere')
	);

	function formatMessageTime(value: string | Date): string {
		const date = value instanceof Date ? value : new Date(value);
		return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(date);
	}

	async function refreshThread() {
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}`);
			const payload = (await response.json()) as {
				ok?: boolean;
				thread?: { closedAt?: string | null };
				messages?: ChatMessage[];
			};
			if (!response.ok || !payload.ok) {
				return;
			}
			messages = payload.messages ?? messages;
			threadClosed = Boolean(payload.thread?.closedAt);
		} catch {
			// polling is best-effort
		}
	}

	async function sendMessage() {
		const body = draft.trim();
		if (!body || threadClosed) {
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

	async function closeThread() {
		closing = true;
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/close`, { method: 'POST' });
			if (!response.ok) {
				showClientToast(t('marketV01.closeThreadFailed'), { variant: 'error' });
				return;
			}
			threadClosed = true;
		} catch {
			showClientToast(t('marketV01.closeThreadFailed'), { variant: 'error' });
		} finally {
			closing = false;
		}
	}

	async function submitRating() {
		if (ratingStars < 1 || ratingStars > 5) {
			return;
		}

		ratingSubmitting = true;
		try {
			const response = await fetch(`/api/market/chat/${data.thread.id}/rate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stars: ratingStars })
			});
			if (!response.ok) {
				showClientToast(t('marketV01.rateFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('marketV01.rateSuccess'), { variant: 'success' });
			await goto('/grannskafferiet/marknad');
		} catch {
			showClientToast(t('marketV01.rateFailed'), { variant: 'error' });
		} finally {
			ratingSubmitting = false;
		}
	}

	onMount(() => {
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
		</header>

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

		{#if threadClosed}
			<section class="closed-panel" aria-labelledby="market-closed-heading">
				<h2 id="market-closed-heading">{t('marketV01.exchangeClosedTitle')}</h2>
				{#if data.myRating}
					<p>{t('marketV01.ratingAlreadySubmitted', { stars: data.myRating.stars })}</p>
				{:else}
					<p>{t('marketV01.ratePrompt')}</p>
					<div class="stars" role="group" aria-label={t('marketV01.rateAria')}>
						{#each [1, 2, 3, 4, 5] as star}
							<button
								type="button"
								class={['star-btn', ratingStars >= star ? 'selected' : ''].filter(Boolean).join(' ')}
								aria-pressed={ratingStars >= star}
								onclick={() => {
									ratingStars = star;
								}}
							>
								★
							</button>
						{/each}
					</div>
					<Button
						type="button"
						disabled={ratingSubmitting || ratingStars < 1}
						onclick={() => void submitRating()}
					>
						{ratingSubmitting ? t('common.loading') : t('marketV01.submitRatingBtn')}
					</Button>
				{/if}
			</section>
		{:else}
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
					<Button type="button" variant="secondary" disabled={closing} onclick={() => void closeThread()}>
						{closing ? t('common.loading') : t('marketV01.closeThreadBtn')}
					</Button>
				</div>
			</form>
		{/if}
	</PageContainer>
</AppLayout>

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

	.stars {
		display: flex;
		gap: var(--space-xs);
	}

	.star-btn {
		border: none;
		background: transparent;
		font-size: 1.75rem;
		line-height: 1;
		color: var(--color-border);
		cursor: pointer;
		padding: 0;
	}

	.star-btn.selected {
		color: var(--color-warning, #d4a017);
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
