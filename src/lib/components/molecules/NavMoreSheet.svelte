<script lang="ts">
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import { t } from '$lib/i18n';
	import {
		isNavActive,
		isMarketV01NavItem,
		navItemTestId,
		resolveNavHref,
		type NavItem
	} from '$lib/navigation/nav-config';
	import { getMarketUnreadCount } from '$lib/stores/market-unread.svelte';

	interface Props {
		pathname: string;
		items: NavItem[];
		staleCount?: number;
		canWrite?: boolean;
		onNavigate?: () => void;
	}

	let { pathname, items, staleCount = 0, canWrite = false, onNavigate }: Props = $props();

	const showStaleBadge = $derived(staleCount > 0 && canWrite);

	function showBadge(item: NavItem): boolean {
		return item.badge === 'stale' && showStaleBadge;
	}

	function showMarketUnreadDot(item: NavItem): boolean {
		return isMarketV01NavItem(item) && getMarketUnreadCount() > 0;
	}
</script>

<p class="section-title label-caps">{t('nav.morePages')}</p>
<ul class="sheet-list" id="nav-more-sheet">
	{#each items as item (item.href)}
		{@const active = isNavActive(pathname, item)}
		{@const href = resolveNavHref(item, pathname)}
		<li>
			<a
				{href}
				class={['sheet-link', active ? 'active' : ''].filter(Boolean).join(' ')}
				aria-current={active ? 'page' : undefined}
				data-testid={navItemTestId(item)}
				onclick={onNavigate}
			>
				<span class="sheet-icon-wrap">
					<NavIcon id={item.icon} />
					{#if showBadge(item)}
						<span class="stale-badge" aria-label={t('nav.staleBadge', { count: staleCount })}>
							{staleCount}
						</span>
					{:else if showMarketUnreadDot(item)}
						<span
							class="unread-dot"
							aria-label={t('marketV01.unreadChatsBadge', { count: getMarketUnreadCount() })}
						></span>
					{/if}
				</span>
				<span class="sheet-label">{t(item.labelKey)}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.section-title {
		margin: var(--space-md) 0 var(--space-sm);
		padding: 0 0.25rem;
	}

	.sheet-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.sheet-link {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		min-height: 3rem;
		padding: 0.65rem 0.85rem;
		border-radius: var(--radius-md);
		color: var(--color-text);
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		transition: background-color 0.2s ease;
	}

	.sheet-link:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
		color: var(--color-text);
	}

	.sheet-link.active {
		background: var(--nav-active-bg);
		color: var(--color-primary);
	}

	.sheet-icon-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.stale-badge {
		position: absolute;
		top: -0.2rem;
		right: -0.35rem;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.2rem;
		border-radius: 999px;
		background: var(--color-warning);
		color: var(--color-on-primary);
		font-size: 0.5625rem;
		font-weight: 700;
		line-height: 1rem;
		text-align: center;
	}

	.unread-dot {
		position: absolute;
		top: -0.05rem;
		right: -0.2rem;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-warning);
		border: 2px solid var(--color-surface-muted);
	}

	.sheet-link.active .sheet-icon-wrap {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
	}

	.sheet-label {
		min-width: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.sheet-link {
			transition: none;
		}
	}
</style>
