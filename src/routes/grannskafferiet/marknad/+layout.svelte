<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import MarketShellLayout from '$lib/components/templates/MarketShellLayout.svelte';
	import { isMarketShellFullscreenRoute } from '$lib/domain/market-shell';
	import { setMarketUnreadCount } from '$lib/stores/market-unread.svelte';

	let { data, children } = $props();

	const CHATS_POLL_MS = 5_000;

	const showShell = $derived(!isMarketShellFullscreenRoute(page.url.pathname));

	let unreadCount = $state(0);
	let chatsPollTimer: ReturnType<typeof setInterval> | null = null;

	async function pollUnreadCount() {
		if (!data.nearbyOptedIn) {
			unreadCount = 0;
			setMarketUnreadCount(0);
			return;
		}

		try {
			const response = await fetch('/api/market/chats');
			const payload = (await response.json()) as { ok?: boolean; unreadCount?: number };
			if (response.ok && payload.ok) {
				unreadCount = payload.unreadCount ?? 0;
				setMarketUnreadCount(unreadCount);
			}
		} catch {
			// Keep last known count on transient failures.
		}
	}

	onMount(() => {
		unreadCount = data.marketUnreadCount ?? 0;
		setMarketUnreadCount(unreadCount);
		if (data.nearbyOptedIn) {
			chatsPollTimer = setInterval(() => {
				void pollUnreadCount();
			}, CHATS_POLL_MS);
		}
	});

	onDestroy(() => {
		if (chatsPollTimer) {
			clearInterval(chatsPollTimer);
		}
	});
</script>

{#if showShell}
	<AppLayout user={data.user}>
		<MarketShellLayout {unreadCount}>
			{@render children()}
		</MarketShellLayout>
	</AppLayout>
{:else}
	{@render children()}
{/if}
