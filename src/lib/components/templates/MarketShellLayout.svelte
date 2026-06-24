<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import {
		MARKET_SHELL_MESSAGES_PATH,
		MARKET_SHELL_PROFILE_PATH,
		resolveMarketShellTab,
		type MarketShellTab
	} from '$lib/domain/market-shell';
	import { MARKET_V01_PATH } from '$lib/domain/market-v01';
	import { t } from '$lib/i18n';

	interface Props {
		unreadCount?: number;
		children: Snippet;
	}

	let { unreadCount = 0, children }: Props = $props();

	const pathname = $derived(page.url.pathname);
	const activeTab = $derived(resolveMarketShellTab(pathname));

	const tabs: Array<{ id: MarketShellTab; href: string; labelKey: 'marketV05.tabMap' | 'marketV05.tabMessages' | 'marketV05.tabProfile' }> = [
		{ id: 'map', href: MARKET_V01_PATH, labelKey: 'marketV05.tabMap' },
		{ id: 'messages', href: MARKET_SHELL_MESSAGES_PATH, labelKey: 'marketV05.tabMessages' },
		{ id: 'profile', href: MARKET_SHELL_PROFILE_PATH, labelKey: 'marketV05.tabProfile' }
	];

	function tabClass(tab: MarketShellTab): string {
		return ['market-tab', activeTab === tab ? 'active' : ''].filter(Boolean).join(' ');
	}
</script>

<div class="market-shell" data-testid="market-shell">
	<nav class="market-shell-tabs" aria-label={t('marketV05.tabsAria')}>
		<ul class="market-shell-tab-list">
			{#each tabs as tab (tab.id)}
				<li>
					<a
						href={tab.href}
						class={tabClass(tab.id)}
						aria-current={activeTab === tab.id ? 'page' : undefined}
						data-testid={`market-shell-tab-${tab.id}`}
					>
						<span class="tab-icon" aria-hidden="true">
							{#if tab.id === 'map'}
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
									<circle cx="12" cy="11" r="2.25" />
								</svg>
							{:else if tab.id === 'messages'}
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
								</svg>
							{:else}
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="8" r="3.25" />
									<path d="M5 20v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1" />
								</svg>
							{/if}
							{#if tab.id === 'messages' && unreadCount > 0}
								<span class="unread-dot" aria-label={t('marketV01.unreadChatsBadge', { count: unreadCount })}></span>
							{/if}
						</span>
						<span class="tab-label">{t(tab.labelKey)}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="market-shell-content">
		{@render children()}
	</div>
</div>

<style>
	.market-shell {
		--market-shell-tab-height: 4.25rem;
		display: flex;
		flex-direction: column;
		min-height: calc(100dvh - var(--header-height-mobile, 7rem));
		min-width: 0;
		margin: calc(-1 * var(--space-lg)) calc(-1 * var(--page-padding-x)) 0;
		width: calc(100% + 2 * var(--page-padding-x));
	}

	.market-shell-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding: 0 var(--page-padding-x) calc(var(--market-shell-tab-height) + var(--safe-area-bottom) + var(--space-sm));
	}

	.market-shell-tabs {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: calc(var(--z-nav-bottom) - 1);
		border-top: 1px solid var(--nav-border);
		background: var(--nav-surface);
		box-shadow: var(--nav-bottom-shadow);
		padding-bottom: max(var(--space-sm), var(--safe-area-bottom));
	}

	.market-shell-tab-list {
		display: flex;
		align-items: stretch;
		width: 100%;
		min-height: var(--market-shell-tab-height);
		list-style: none;
		margin: 0;
		padding: 0.15rem var(--space-sm) 0.25rem;
	}

	.market-shell-tab-list > li {
		flex: 1;
		min-width: 0;
		display: flex;
	}

	.market-tab {
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		width: 100%;
		min-height: 2.75rem;
		padding: 0.35rem 0.15rem 0.45rem;
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-size: 0.625rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}

	.tab-icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
	}

	.tab-label {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.15;
	}

	.unread-dot {
		position: absolute;
		top: -0.05rem;
		right: -0.35rem;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-warning);
		border: 2px solid var(--nav-surface);
	}

	.market-tab:hover {
		color: var(--color-text);
		text-decoration: none;
	}

	.market-tab:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.market-tab.active {
		color: var(--color-primary);
		font-weight: 700;
	}

	@media (min-width: 768px) {
		.market-shell {
			min-height: auto;
			margin: 0;
			width: 100%;
			border: 1px solid var(--color-border);
			border-radius: var(--radius-lg);
			overflow: hidden;
			background: var(--color-surface);
		}

		.market-shell-tabs {
			position: sticky;
			top: 0;
			bottom: auto;
			box-shadow: none;
			border-top: 0;
			border-bottom: 1px solid var(--color-border);
			padding-bottom: 0;
			z-index: 2;
		}

		.market-shell {
			flex-direction: column;
		}

		.market-shell-content {
			padding: var(--space-md) var(--page-padding-x) var(--space-lg);
		}

		.market-shell-tab-list {
			max-width: 28rem;
			margin-inline: auto;
			min-height: 3.25rem;
		}

		.market-tab {
			flex-direction: row;
			gap: var(--space-xs);
			font-size: 0.8125rem;
			padding: 0.5rem 0.75rem;
		}
	}

	@media (min-width: 900px) {
		.market-shell {
			min-height: calc(100dvh - var(--header-height-desktop) - var(--space-xl));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.market-tab {
			transition: none;
		}
	}
</style>
