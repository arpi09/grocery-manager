<script lang="ts">
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import LanguageSwitcher from '$lib/components/molecules/LanguageSwitcher.svelte';
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import type { MarketingContent } from '$lib/marketing/content';

	interface Props {
		content: MarketingContent;
		loginUrl: string;
		appHomeUrl?: string;
		isLoggedIn?: boolean;
		currentPath?: string;
	}

	let { content, loginUrl, appHomeUrl = '/hem', isLoggedIn = false, currentPath = '' }: Props =
		$props();

	let menuOpen = $state(false);

	function navLinkClass(href: string): string {
		return ['nav-link', currentPath === href ? 'active' : ''].filter(Boolean).join(' ');
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

<header class="header">
	<div class="inner">
		<a href="/" class="brand" aria-label={content.siteName} onclick={closeMenu}>
			<AppLogo size="sm" showWordmark wordmark={content.siteName} />
		</a>

		<nav class="nav-desktop" aria-label={content.header.navAria}>
			{#each content.nav as link (link.href)}
				<a href={link.href} class={navLinkClass(link.href)}>{link.label}</a>
			{/each}
		</nav>

		<div class="header-end">
			<LanguageSwitcher compact class="lang-switch" />
			<div class="actions-desktop">
				{#if isLoggedIn}
					<MarketingButtonLink href={appHomeUrl}>{content.cta.openApp}</MarketingButtonLink>
				{:else}
					<a href={loginUrl} class="login-link">{content.cta.login}</a>
					<MarketingButtonLink href={loginUrl}>{content.cta.openApp}</MarketingButtonLink>
				{/if}
			</div>
			<button
				type="button"
				class="menu-toggle"
				aria-label={content.header.menuToggle}
				aria-expanded={menuOpen}
				aria-controls="marketing-mobile-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class="sr-only">{content.header.menuToggle}</span>
				<span class="bar" aria-hidden="true"></span>
				<span class="bar" aria-hidden="true"></span>
			</button>
		</div>
	</div>

	{#if menuOpen}
		<nav id="marketing-mobile-nav" class="nav-mobile" aria-label={content.header.navMobileAria}>
			{#each content.nav as link (link.href)}
				<a href={link.href} class={navLinkClass(link.href)} onclick={closeMenu}>{link.label}</a>
			{/each}
			{#if isLoggedIn}
				<div class="mobile-cta">
					<MarketingButtonLink href={appHomeUrl} fullWidth onclick={closeMenu}>
						{content.cta.openApp}
					</MarketingButtonLink>
				</div>
			{:else}
				<a href={loginUrl} class="mobile-login" onclick={closeMenu}>{content.cta.login}</a>
				<div class="mobile-cta">
					<MarketingButtonLink href={loginUrl} fullWidth onclick={closeMenu}>
						{content.cta.openApp}
					</MarketingButtonLink>
				</div>
			{/if}
		</nav>
	{/if}
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in srgb, var(--color-surface) 92%, transparent);
		border-bottom: 1px solid var(--color-border);
		backdrop-filter: blur(10px);
	}

	.inner {
		max-width: 72rem;
		margin: 0 auto;
		padding: var(--space-md) var(--space-lg);
		padding-top: calc(var(--space-md) + env(safe-area-inset-top, 0));
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--space-lg);
		min-width: 0;
	}

	.brand {
		display: inline-flex;
		text-decoration: none;
		color: inherit;
		flex-shrink: 0;
	}

	.nav-desktop {
		display: none;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--space-lg);
		margin-right: auto;
		min-width: 0;
	}

	.nav-link {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-body-sm);
		font-weight: 500;
		transition: color 0.15s ease;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--color-primary);
	}

	.header-end {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--space-md);
		margin-left: auto;
		flex-shrink: 0;
	}

	.actions-desktop {
		display: none;
		align-items: center;
		gap: var(--space-md);
	}

	:global(.lang-switch) {
		flex-shrink: 0;
	}

	.login-link {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-body-sm);
		font-weight: 500;
	}

	.login-link:hover {
		color: var(--color-text);
	}

	.mobile-cta {
		padding-top: var(--space-xs);
	}

	.menu-toggle {
		display: inline-flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.35rem;
		margin-left: auto;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: var(--space-sm);
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.menu-toggle:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}

	.bar {
		display: block;
		width: 1.35rem;
		height: 2px;
		background: var(--color-text);
		border-radius: 1px;
	}

	.nav-mobile {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: 0 var(--space-lg) calc(var(--space-lg) + env(safe-area-inset-bottom, 0));
		border-top: 1px solid var(--color-border);
	}

	.nav-mobile .nav-link {
		display: flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0;
		font-size: var(--font-size-body);
	}

	.mobile-login {
		display: flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0;
		color: var(--color-text-muted);
		text-decoration: none;
		font-weight: 500;
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

	@media (max-width: 899px) {
		.inner {
			padding: var(--space-sm) var(--page-padding-x);
			padding-top: calc(var(--space-sm) + env(safe-area-inset-top, 0));
			gap: var(--space-md);
		}
	}

	@media (min-width: 900px) {
		.nav-desktop,
		.actions-desktop {
			display: flex;
		}

		.menu-toggle,
		.nav-mobile {
			display: none;
		}
	}
</style>
