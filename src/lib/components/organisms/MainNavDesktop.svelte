<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/state';
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import ProNavBadge from '$lib/components/atoms/ProNavBadge.svelte';
	import ProUpgradeCta from '$lib/components/molecules/ProUpgradeCta.svelte';
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import PantrySwitcher from '$lib/components/molecules/PantrySwitcher.svelte';
	import ProfileMenu from '$lib/components/molecules/ProfileMenu.svelte';
	import RecipeIdeasButton from '$lib/components/molecules/RecipeIdeasButton.svelte';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t } from '$lib/i18n';
	import { isNavActive, type NavItem, type NavUser } from '$lib/navigation/nav-config';
	import type { UserHouseholdSummary } from '$lib/domain/household';

	interface Props {
		user: NavUser & { email: string };
		households: UserHouseholdSummary[];
		activeHousehold: { id: string; name: string } | null;
		onRecipeIdeas?: () => void;
		primary: NavItem[];
		secondary: NavItem[];
		moreOpen: boolean;
		onToggleMore: () => void;
		onCloseMore: () => void;
	}

	let {
		user,
		households,
		activeHousehold,
		onRecipeIdeas,
		primary,
		secondary,
		moreOpen,
		onToggleMore,
		onCloseMore
	}: Props = $props();

	const pathname = $derived(page.url.pathname);
	const isPro = $derived(Boolean(page.data.isPro));

	const moreActive = $derived(
		secondary.some((item) => isNavActive(pathname, item)) || (moreOpen && secondary.length > 0)
	);

	function navLinkClass(active: boolean): string {
		return ['nav-link', active ? 'active' : ''].filter(Boolean).join(' ');
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCloseMore();
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<header class="desktop-header" aria-label={t('nav.primaryNav')}>
	<div class="desktop-header-inner">
		<a href={APP_HOME_PATH} class="desktop-brand" aria-label={t('nav.brandHome')}>
			<AppLogo size="sm" />
			<span class="desktop-brand-text">{t('nav.brandName')}</span>
			{#if isPro}
				<ProNavBadge />
			{/if}
		</a>

		<nav class="desktop-nav" aria-label={t('nav.primaryNav')}>
			<ul class="desktop-nav-list">
				{#each primary as item (item.href)}
					{@const active = isNavActive(pathname, item)}
					<li>
						<a
							href={item.href}
							class={navLinkClass(active)}
							aria-current={active ? 'page' : undefined}
						>
							<NavIcon id={item.icon} />
							<span class="nav-link-label">{t(item.labelKey)}</span>
						</a>
					</li>
				{/each}
				{#if secondary.length > 0}
					<li class="more-wrap">
						<button
							type="button"
							class={['nav-link', 'more-trigger', moreActive ? 'active' : ''].filter(Boolean).join(' ')}
							aria-expanded={moreOpen}
							aria-haspopup="menu"
							onclick={onToggleMore}
						>
							<NavIcon id="more" />
							<span class="nav-link-label">{t('nav.more')}</span>
						</button>
						{#if moreOpen}
							<button
								type="button"
								class="desktop-more-backdrop nav-dropdown-scrim"
								aria-label={t('nav.closeMenu')}
								onclick={onCloseMore}
								transition:fade={{ duration: 140 }}
							></button>
							<div
								class="desktop-more-panel"
								id="nav-more-desktop"
								role="menu"
								transition:fly={{ y: -6, duration: 180 }}
							>
								<p class="more-section-title label-caps">{t('nav.morePages')}</p>
								{#each secondary as item (item.href)}
									{@const active = isNavActive(pathname, item)}
									<a
										href={item.href}
										role="menuitem"
										class={navLinkClass(active)}
										aria-current={active ? 'page' : undefined}
										onclick={onCloseMore}
									>
										<NavIcon id={item.icon} />
										<span>{t(item.labelKey)}</span>
									</a>
								{/each}
							</div>
						{/if}
					</li>
				{/if}
			</ul>
		</nav>

		<div class="desktop-actions">
			{#if !isPro}
				<ProUpgradeCta variant="nav" />
			{/if}
			<PantrySwitcher {households} {activeHousehold} />
			{#if onRecipeIdeas}
				<RecipeIdeasButton onclick={onRecipeIdeas} />
			{/if}
			<ProfileMenu {user} />
		</div>
	</div>
</header>

<style>
	.desktop-header {
		width: 100%;
		max-width: 100%;
		min-height: var(--header-height-desktop);
	}

	.desktop-header-inner {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-md);
		width: 100%;
		max-width: var(--page-max-width);
		min-width: 0;
		margin-inline: auto;
		padding: 0 var(--page-padding-x);
		min-height: var(--header-height-desktop);
	}

	.desktop-brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		min-height: 2.75rem;
		min-width: 0;
		max-width: 12rem;
		color: var(--color-text);
		text-decoration: none;
		flex-shrink: 0;
	}

	.desktop-brand:hover {
		text-decoration: none;
		color: var(--color-text);
	}

	.desktop-brand-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.desktop-nav {
		position: relative;
		min-width: 0;
		overflow: visible;
	}

	.desktop-nav-list {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	.desktop-nav-list > li {
		display: flex;
		flex-shrink: 0;
		min-width: 0;
	}

	.nav-link-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.more-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.desktop-more-backdrop {
		position: fixed;
		inset: 0;
		z-index: 0;
		border: 0;
		cursor: default;
	}

	.desktop-more-panel {
		position: absolute;
		top: calc(100% + 0.4rem);
		left: 50%;
		transform: translateX(-50%);
		transform-origin: top center;
		z-index: var(--z-nav-flyout);
		min-width: 13.5rem;
		padding: var(--space-sm);
		border: 1px solid var(--nav-border);
		border-radius: var(--radius-md);
		background: var(--nav-surface);
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		will-change: transform, opacity;
	}

	.more-section-title {
		margin: 0 0 var(--space-xs);
		padding: 0.25rem 0.75rem;
	}

	.desktop-more-panel .nav-link {
		justify-content: flex-start;
		width: 100%;
		min-height: 2.75rem;
		padding: 0.55rem 0.75rem;
		border-radius: var(--radius-sm);
	}

	.desktop-more-panel .nav-link:hover {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.desktop-more-panel .nav-link.active {
		background: var(--nav-active-bg);
		color: var(--color-primary);
	}

	.desktop-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-sm);
		flex-shrink: 0;
		min-width: 0;
	}

	.desktop-actions :global(.pantry-switcher) {
		min-width: 0;
		max-width: 9.5rem;
	}

	.desktop-actions :global(.pantry-name) {
		max-width: 5.5rem;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		min-height: 2.75rem;
		padding: 0.35rem 0.65rem;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}

	.nav-link:hover {
		color: var(--color-text);
		text-decoration: none;
	}

	.nav-link:focus-visible,
	.more-trigger:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.nav-link.active,
	.more-trigger.active {
		color: var(--color-primary);
		background: var(--nav-active-bg);
	}

	.more-trigger {
		font: inherit;
	}

	@media (max-width: 1100px) {
		.desktop-header-inner {
			gap: var(--space-sm);
		}

		.desktop-brand {
			max-width: 2.75rem;
		}

		.desktop-brand:has(:global(.pro-nav-badge)) {
			max-width: 4.75rem;
		}

		.desktop-brand-text {
			display: none;
		}

		.nav-link {
			padding: 0.35rem 0.5rem;
			font-size: 0.78rem;
		}

		.desktop-actions :global(.recipe-ideas-btn .label),
		.desktop-actions :global(.recipe-ideas-btn .badge) {
			display: none;
		}

		.desktop-actions :global(.recipe-ideas-btn .inner) {
			padding: 0.35rem 0.55rem;
		}
	}

	@media (max-width: 960px) {
		.desktop-nav-list {
			gap: 0.1rem;
		}

		.nav-link {
			padding: 0.35rem 0.4rem;
		}

		.desktop-actions :global(.pantry-switcher) {
			max-width: 7.5rem;
		}

		.desktop-actions :global(.pantry-name) {
			max-width: 4rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-link {
			transition: none;
		}

		.desktop-more-panel,
		.desktop-more-backdrop {
			animation: none;
		}
	}
</style>
