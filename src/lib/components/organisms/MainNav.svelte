<script lang="ts">
	import { page } from '$app/state';
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import ProfileMenu from '$lib/components/molecules/ProfileMenu.svelte';
	import RecipeIdeasButton from '$lib/components/molecules/RecipeIdeasButton.svelte';
	import {
		NAV_ITEMS,
		filterNavItems,
		isNavActive,
		splitNavItems,
		type NavItem,
		type NavUser
	} from '$lib/navigation/nav-config';

	interface Props {
		user: (NavUser & { email: string }) | null;
		onRecipeIdeas?: () => void;
	}

	let { user, onRecipeIdeas }: Props = $props();

	const pathname = $derived(page.url.pathname);
	const visibleItems = $derived(filterNavItems(NAV_ITEMS, user));
	const { primary, secondary } = $derived(splitNavItems(visibleItems));

	let moreOpen = $state(false);

	const moreActive = $derived(
		secondary.some((item) => isNavActive(pathname, item)) ||
			(moreOpen && secondary.length > 0)
	);

	function closeMore() {
		moreOpen = false;
	}

	function openMore() {
		moreOpen = true;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeMore();
		}
	}

	function navLinkClass(item: NavItem, active: boolean): string {
		return ['nav-link', active ? 'active' : ''].filter(Boolean).join(' ');
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if user}
	<header class="main-nav mobile-top" aria-label="Sidhuvud">
		<a href="/" class="brand brand-compact" aria-label="Home Pantry – Hem">
			<span class="brand-mark" aria-hidden="true">HP</span>
		</a>
		{#if onRecipeIdeas}
			<RecipeIdeasButton compact onclick={onRecipeIdeas} />
		{/if}
	</header>

	<header class="main-nav top" aria-label="Huvudnavigering">
		<a href="/" class="brand" aria-label="Home Pantry – Hem">
			<span class="brand-mark" aria-hidden="true">HP</span>
			<span class="brand-text">Home Pantry</span>
		</a>

		<nav class="desktop-nav" aria-label="Primär navigering">
			<ul class="desktop-list">
				{#each primary as item (item.href)}
					{@const active = isNavActive(pathname, item)}
					<li>
						<a href={item.href} class={navLinkClass(item, active)} aria-current={active ? 'page' : undefined}>
							<NavIcon id={item.icon} />
							<span>{item.label}</span>
						</a>
					</li>
				{/each}
				{#if secondary.length > 0}
					<li class="more-wrap">
						<button
							type="button"
							class={['nav-link', 'more-trigger', moreActive ? 'active' : ''].filter(Boolean).join(' ')}
							aria-expanded={moreOpen}
							aria-haspopup="dialog"
							aria-controls="nav-more-sheet"
							onclick={() => (moreOpen ? closeMore() : openMore())}
						>
							<NavIcon id="more" />
							<span>Mer</span>
						</button>
						{#if moreOpen}
							<div class="desktop-more-panel" id="nav-more-desktop" role="menu">
								{#each secondary as item (item.href)}
									{@const active = isNavActive(pathname, item)}
									<a
										href={item.href}
										role="menuitem"
										class={navLinkClass(item, active)}
										aria-current={active ? 'page' : undefined}
										onclick={closeMore}
									>
										<NavIcon id={item.icon} />
										<span>{item.label}</span>
									</a>
								{/each}
							</div>
						{/if}
					</li>
				{/if}
			</ul>
		</nav>

		<div class="top-actions">
			{#if onRecipeIdeas}
				<RecipeIdeasButton onclick={onRecipeIdeas} />
			{/if}
			<ProfileMenu {user} />
		</div>
	</header>

	<nav class="main-nav bottom" aria-label="Mobilnavigering">
		<ul class="bottom-list">
			{#each primary as item (item.href)}
				{@const active = isNavActive(pathname, item)}
				<li>
					<a href={item.href} class={navLinkClass(item, active)} aria-current={active ? 'page' : undefined}>
						<NavIcon id={item.icon} />
						<span>{item.label}</span>
					</a>
				</li>
			{/each}
			{#if secondary.length > 0}
				<li>
					<button
						type="button"
						class={['nav-link', 'tab-btn', moreActive ? 'active' : ''].filter(Boolean).join(' ')}
						aria-expanded={moreOpen}
						aria-controls="nav-more-sheet"
						onclick={() => (moreOpen ? closeMore() : openMore())}
					>
						<NavIcon id="more" />
						<span>Mer</span>
					</button>
				</li>
			{/if}
		</ul>
	</nav>

	{#if moreOpen && secondary.length > 0}
		<button type="button" class="sheet-scrim" aria-label="Stäng meny" onclick={closeMore}></button>
		<div
			id="nav-more-sheet"
			class="more-sheet"
			role="dialog"
			aria-modal="true"
			aria-label="Fler sidor"
		>
			<div class="sheet-handle" aria-hidden="true"></div>
			<h2 class="sheet-title">Mer</h2>
			<ul class="sheet-list">
				{#each secondary as item (item.href)}
					{@const active = isNavActive(pathname, item)}
					<li>
						<a
							href={item.href}
							class={['sheet-link', active ? 'active' : ''].filter(Boolean).join(' ')}
							aria-current={active ? 'page' : undefined}
							onclick={closeMore}
						>
							<span class="sheet-icon-wrap">
								<NavIcon id={item.icon} />
							</span>
							<span class="sheet-label">{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
{/if}

<style>
	.main-nav {
		--nav-height: 3.25rem;
		font-family: var(--font);
	}

	.main-nav.top {
		position: sticky;
		top: 0;
		z-index: 60;
		display: none;
		align-items: center;
		gap: var(--space-md);
		min-height: var(--nav-height);
		margin: calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) var(--space-xl);
		padding: 0 var(--space-lg);
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
		background: color-mix(in srgb, var(--color-bg) 82%, transparent);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
	}

	.main-nav.mobile-top {
		position: sticky;
		top: 0;
		z-index: 55;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-height: var(--nav-height);
		margin: calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) var(--space-md);
		padding: 0 var(--space-lg);
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
		background: color-mix(in srgb, var(--color-bg) 82%, transparent);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
	}

	.brand-compact {
		min-height: 2.5rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		min-height: 2.75rem;
		color: var(--color-text);
		text-decoration: none;
		flex-shrink: 0;
	}

	.brand:hover {
		text-decoration: none;
		color: var(--color-text);
	}

	.brand-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.85rem;
		height: 1.85rem;
		border-radius: 0.55rem;
		background: var(--color-primary);
		color: #fff;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.brand-text {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.desktop-nav {
		flex: 1;
		min-width: 0;
	}

	.desktop-list {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.desktop-list > li {
		display: flex;
	}

	.more-wrap {
		position: relative;
	}

	.desktop-more-panel {
		position: absolute;
		top: calc(100% + 0.35rem);
		left: 50%;
		transform: translateX(-50%);
		min-width: 12.5rem;
		padding: var(--space-xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-surface) 90%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.desktop-more-panel .nav-link {
		justify-content: flex-start;
		width: 100%;
		padding: 0.55rem 0.75rem;
	}

	.top-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	.main-nav.bottom {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 70;
		display: flex;
		padding-bottom: env(safe-area-inset-bottom, 0);
		border-top: 1px solid color-mix(in srgb, var(--color-border) 75%, transparent);
		background: color-mix(in srgb, var(--color-surface) 88%, transparent);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
	}

	html[data-theme='dark'] .main-nav.bottom {
		box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.28);
	}

	.bottom-list {
		display: flex;
		align-items: stretch;
		width: 100%;
		list-style: none;
		margin: 0;
		padding: 0.2rem 0.35rem calc(0.2rem + env(safe-area-inset-bottom, 0));
	}

	.bottom-list > li {
		flex: 1;
		min-width: 0;
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
		transition:
			color 0.2s ease,
			background-color 0.2s ease;
	}

	.bottom-list .nav-link,
	.bottom-list .tab-btn {
		flex-direction: column;
		gap: 0.15rem;
		width: 100%;
		padding: 0.45rem 0.25rem 0.35rem;
		border-radius: var(--radius-sm);
		font-size: 0.68rem;
		font-weight: 600;
	}

	.nav-link:hover {
		color: var(--color-text);
		text-decoration: none;
	}

	.nav-link:focus-visible,
	.tab-btn:focus-visible,
	.more-trigger:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.nav-link.active,
	.tab-btn.active {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	}

	.tab-btn,
	.more-trigger {
		font: inherit;
	}

	.sheet-scrim {
		position: fixed;
		inset: 0;
		z-index: 75;
		border: 0;
		background: rgba(0, 0, 0, 0.35);
		cursor: pointer;
	}

	.more-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 80;
		padding: var(--space-md) var(--space-lg) calc(var(--space-xl) + 4.5rem + env(safe-area-inset-bottom, 0));
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		background: color-mix(in srgb, var(--color-surface) 94%, transparent);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		box-shadow: var(--shadow-md);
		animation: sheet-up 0.28s ease;
	}

	.sheet-handle {
		width: 2.5rem;
		height: 0.25rem;
		margin: 0 auto var(--space-md);
		border-radius: 999px;
		background: var(--color-border);
	}

	.sheet-title {
		margin: 0 0 var(--space-md);
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.sheet-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
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
		background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface-muted));
		color: var(--color-primary);
	}

	.sheet-icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}

	.sheet-link.active .sheet-icon-wrap {
		color: var(--color-primary);
	}

	@keyframes sheet-up {
		from {
			transform: translateY(100%);
			opacity: 0.6;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (min-width: 900px) {
		.main-nav.top {
			display: flex;
		}

		.main-nav.mobile-top,
		.main-nav.bottom,
		.sheet-scrim,
		.more-sheet {
			display: none;
		}
	}

	@media (max-width: 899px) {
		.desktop-more-panel {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-link,
		.sheet-link,
		.more-sheet {
			transition: none;
			animation: none;
		}
	}
</style>
