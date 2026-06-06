<script lang="ts">
	import { page } from '$app/state';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import LanguageSwitcher from '$lib/components/molecules/LanguageSwitcher.svelte';
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import { t } from '$lib/i18n';
	import { userInitials } from '$lib/domain/user';
	import type { NavUser } from '$lib/navigation/nav-config';
	import { subscribeNarrowViewport } from '$lib/utils/use-narrow-viewport';

	interface Props {
		user: NavUser & { email: string };
	}

	let { user }: Props = $props();

	let open = $state(false);
	let isNarrowViewport = $state(false);
	let menuId = 'profile-menu-panel';

	const pathname = $derived(page.url.pathname);

	$effect(() =>
		subscribeNarrowViewport((matches) => {
			isNarrowViewport = matches;
		})
	);

	const initials = $derived(userInitials(user.displayName, user.email ?? ''));

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open && !isNarrowViewport) {
			close();
		}
	}

	const roleLabel = $derived(
		user.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleMember')
	);
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="profile-menu">
	<button
		type="button"
		class="avatar-btn"
		aria-expanded={open}
		aria-haspopup={isNarrowViewport ? 'dialog' : 'menu'}
		aria-controls={isNarrowViewport ? undefined : menuId}
		aria-label={t('nav.accountMenu')}
		onclick={toggle}
	>
		{#if user.avatarUrl}
			<img class="avatar-img" src={user.avatarUrl} alt="" />
		{:else}
			<span class="avatar" aria-hidden="true">{initials}</span>
		{/if}
	</button>

	{#if open && !isNarrowViewport}
		<button
			type="button"
			class="backdrop nav-dropdown-scrim"
			aria-label={t('nav.closeMenu')}
			onclick={close}
		></button>
		<div id={menuId} class="panel" role="menu">
			<div class="panel-header" role="presentation">
				{#if user.avatarUrl}
					<img class="avatar-img large" src={user.avatarUrl} alt="" />
				{:else}
					<span class="avatar large" aria-hidden="true">{initials}</span>
				{/if}
				<div class="panel-meta">
					<p class="email">{user.email}</p>
					<p class="role-label">{roleLabel}</p>
				</div>
			</div>
			<ul class="panel-list">
				<li role="none">
					<a
						href="/profile"
						role="menuitem"
						class={['menu-item', pathname.startsWith('/profile') ? 'active' : ''].filter(Boolean).join(' ')}
						onclick={close}
					>
						<span>{t('nav.profile')}</span>
					</a>
				</li>
				<li role="none">
					<a
						href="/settings"
						role="menuitem"
						class={['menu-item', pathname.startsWith('/settings') ? 'active' : ''].filter(Boolean).join(' ')}
						onclick={close}
					>
						<span>{t('nav.settings')}</span>
					</a>
				</li>
				<li role="none" class="language-row">
					<div class="language-label label-caps">{t('nav.language')}</div>
					<LanguageSwitcher compact />
				</li>
				<li role="none">
					<form method="POST" action="/logout">
						<button type="submit" role="menuitem" class="menu-item danger">
							<span>{t('nav.logout')}</span>
						</button>
					</form>
				</li>
			</ul>
		</div>
	{/if}
</div>

{#if open && isNarrowViewport}
	<Modal
		open={true}
		onClose={close}
		variant="sheet"
		title={t('nav.account')}
		panelClass="profile-sheet-panel"
		bodyClass="profile-sheet-body"
	>
		<div class="sheet-header" role="presentation">
			{#if user.avatarUrl}
				<img class="avatar-img large" src={user.avatarUrl} alt="" />
			{:else}
				<span class="avatar large" aria-hidden="true">{initials}</span>
			{/if}
			<div class="panel-meta">
				<p class="email">{user.email}</p>
				<p class="role-label">{roleLabel}</p>
			</div>
		</div>
		<ul class="sheet-list">
			<li>
				<a
					href="/profile"
					class={['sheet-item', pathname.startsWith('/profile') ? 'active' : ''].filter(Boolean).join(' ')}
					onclick={close}
				>
					<span class="sheet-icon-wrap">
						<NavIcon id="settings" />
					</span>
					<span>{t('nav.profile')}</span>
				</a>
			</li>
			<li>
				<a
					href="/settings"
					class={['sheet-item', pathname.startsWith('/settings') ? 'active' : ''].filter(Boolean).join(' ')}
					onclick={close}
				>
					<span class="sheet-icon-wrap">
						<NavIcon id="settings" />
					</span>
					<span>{t('nav.settings')}</span>
				</a>
			</li>
			<li class="sheet-language">
				<span class="sheet-language-label label-caps">{t('nav.language')}</span>
				<LanguageSwitcher />
			</li>
			<li>
				<form method="POST" action="/logout">
					<button type="submit" class="sheet-item danger">
						<span>{t('nav.logout')}</span>
					</button>
				</form>
			</li>
		</ul>
	</Modal>
{/if}

<style>
	.profile-menu {
		position: relative;
		z-index: 1;
	}

	.avatar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 999px;
		overflow: hidden;
	}

	.avatar-img {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		object-fit: cover;
		border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
	}

	.avatar-img.large {
		width: 2.75rem;
		height: 2.75rem;
		flex-shrink: 0;
	}

	.avatar-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
		color: var(--color-primary-hover);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
	}

	.avatar.large {
		width: 2.75rem;
		height: 2.75rem;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 0;
		border: 0;
		cursor: default;
	}

	.panel {
		position: absolute;
		top: calc(100% + 0.35rem);
		right: 0;
		z-index: var(--z-nav-flyout);
		min-width: 15rem;
		padding: var(--space-sm);
		border: 1px solid var(--nav-border);
		border-radius: var(--radius-md);
		background: var(--nav-surface);
		box-shadow: var(--shadow-md);
	}

	.panel-header,
	.sheet-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.panel-meta {
		min-width: 0;
	}

	.email {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.role-label {
		margin: 0.1rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.panel-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		min-height: 2.75rem;
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		text-align: left;
	}

	.menu-item:hover,
	.menu-item:focus-visible {
		background: var(--color-surface-muted);
		text-decoration: none;
		color: var(--color-text);
	}

	.menu-item:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.menu-item.active {
		color: var(--color-primary);
		background: var(--nav-active-bg);
	}

	.menu-item.danger {
		color: var(--color-danger);
	}

	.language-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-height: 2.75rem;
		padding: 0.35rem 0.75rem;
	}

	.panel-list form {
		margin: 0;
	}

	.sheet-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.sheet-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		width: 100%;
		min-height: 3rem;
		padding: 0.65rem 0.85rem;
		border: 0;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-text);
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		text-align: left;
	}

	.sheet-item:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
		color: var(--color-text);
	}

	.sheet-item.active {
		background: var(--nav-active-bg);
		color: var(--color-primary);
	}

	.sheet-item.danger {
		color: var(--color-danger);
		justify-content: flex-start;
		padding-left: 0.85rem;
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
		flex-shrink: 0;
	}

	.sheet-item.active .sheet-icon-wrap {
		color: var(--color-primary);
	}

	.sheet-language {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: 0.65rem 0.85rem;
	}

	:global(.profile-sheet-panel) {
		max-height: min(85dvh, 640px);
	}

	:global(.profile-sheet-body) {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0));
	}
</style>
