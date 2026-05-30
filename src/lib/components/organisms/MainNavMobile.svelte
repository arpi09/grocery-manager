<script lang="ts">
	import { page } from '$app/state';
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import NavMoreSheet from '$lib/components/molecules/NavMoreSheet.svelte';
	import PantrySwitcher from '$lib/components/molecules/PantrySwitcher.svelte';
	import ProfileMenu from '$lib/components/molecules/ProfileMenu.svelte';
	import RecipeIdeasButton from '$lib/components/molecules/RecipeIdeasButton.svelte';
	import { t } from '$lib/i18n';
	import { isNavActive, type NavItem, type NavUser } from '$lib/navigation/nav-config';
	import type { UserHouseholdSummary } from '$lib/domain/household';
	import { subscribeNarrowViewport } from '$lib/utils/use-narrow-viewport';

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

	let isNarrowViewport = $state(false);

	$effect(() =>
		subscribeNarrowViewport((matches) => {
			isNarrowViewport = matches;
		})
	);

	const moreActive = $derived(
		secondary.some((item) => isNavActive(pathname, item)) || (moreOpen && secondary.length > 0)
	);

	function navLinkClass(active: boolean): string {
		return ['nav-tab', active ? 'active' : ''].filter(Boolean).join(' ');
	}
</script>

<header class="mobile-header" aria-label={t('nav.header')}>
	<a href="/" class="mobile-brand" aria-label={t('nav.brandHome')}>
		<AppLogo size="sm" />
		<span class="mobile-brand-text">{t('nav.brandName')}</span>
	</a>
	<div class="mobile-header-center">
		<PantrySwitcher {households} {activeHousehold} />
	</div>
	<div class="mobile-header-actions">
		{#if onRecipeIdeas}
			<RecipeIdeasButton compact onclick={onRecipeIdeas} />
		{/if}
		<ProfileMenu {user} />
	</div>
</header>

<nav class="mobile-bottom" aria-label={t('nav.mobileNav')}>
	<ul class="mobile-bottom-list">
		{#each primary as item (item.href)}
			{@const active = isNavActive(pathname, item)}
			<li>
				<a
					href={item.href}
					class={navLinkClass(active)}
					aria-current={active ? 'page' : undefined}
				>
					<span class="tab-icon">
						<NavIcon id={item.icon} />
					</span>
					<span class="tab-label">{t(item.labelKey)}</span>
				</a>
			</li>
		{/each}
		{#if secondary.length > 0}
			<li>
				<button
					type="button"
					class={navLinkClass(moreActive)}
					aria-expanded={moreOpen}
					aria-haspopup="dialog"
					onclick={onToggleMore}
				>
					<span class="tab-icon">
						<NavIcon id="more" />
					</span>
					<span class="tab-label">{t('nav.more')}</span>
				</button>
			</li>
		{/if}
	</ul>
</nav>

{#if secondary.length > 0 && isNarrowViewport}
	<Modal
		open={moreOpen}
		onClose={onCloseMore}
		variant="sheet"
		title={t('nav.more')}
		panelClass="nav-more-panel"
		bodyClass="nav-more-sheet-body"
	>
		<NavMoreSheet {pathname} items={secondary} onNavigate={onCloseMore} />
	</Modal>
{/if}

<style>
	.mobile-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-xs);
		min-height: var(--nav-height);
		padding: 0 var(--space-md);
	}

	.mobile-brand {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.75rem;
		min-width: 0;
		flex-shrink: 0;
		max-width: 38%;
		color: var(--color-text);
		text-decoration: none;
	}

	.mobile-brand:hover {
		text-decoration: none;
		color: var(--color-text);
	}

	.mobile-brand-text {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mobile-header-center {
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: center;
	}

	.mobile-header-actions {
		display: flex;
		align-items: center;
		gap: 0.1rem;
		flex-shrink: 0;
	}

	.mobile-bottom {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: var(--z-nav-bottom);
		display: flex;
		padding-bottom: env(safe-area-inset-bottom, 0);
		border-top: 1px solid var(--nav-border);
		background: var(--nav-surface);
		box-shadow: var(--nav-bottom-shadow);
	}

	.mobile-bottom-list {
		display: flex;
		align-items: stretch;
		width: 100%;
		list-style: none;
		margin: 0;
		padding: 0.25rem 0.35rem;
	}

	.mobile-bottom-list > li {
		flex: 1;
		min-width: 0;
	}

	.nav-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.12rem;
		width: 100%;
		min-height: var(--mobile-bottom-nav-height);
		padding: 0.35rem 0.2rem 0.3rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.65rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}

	.tab-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		transition: background-color 0.2s ease;
	}

	.nav-tab:hover {
		color: var(--color-text);
		text-decoration: none;
	}

	.nav-tab:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.nav-tab.active {
		color: var(--color-primary);
	}

	.nav-tab.active .tab-icon {
		background: var(--nav-active-bg);
	}

	.tab-label {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.2;
	}

	:global(.nav-more-panel) {
		padding-bottom: calc(var(--space-xl) + var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom, 0));
	}

	:global(.nav-more-sheet-body) {
		display: flex;
		flex-direction: column;
		padding-top: var(--space-xs);
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-tab,
		.tab-icon {
			transition: none;
		}
	}
</style>
