<script lang="ts">
	import type { NavUser } from '$lib/navigation/nav-config';

	interface Props {
		user: NavUser & { email: string };
	}

	let { user }: Props = $props();

	let open = $state(false);
	let menuId = 'profile-menu-panel';

	function initials(email: string): string {
		const part = email.trim()[0];
		return part ? part.toUpperCase() : '?';
	}

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="profile-menu">
	<button
		type="button"
		class="avatar-btn"
		aria-expanded={open}
		aria-haspopup="menu"
		aria-controls={menuId}
		aria-label="Kontomeny"
		onclick={toggle}
	>
		<span class="avatar" aria-hidden="true">{initials(user.email)}</span>
	</button>

	{#if open}
		<button type="button" class="backdrop nav-dropdown-scrim" aria-label="Stäng meny" onclick={close}></button>
		<div id={menuId} class="panel" role="menu">
			<div class="panel-header" role="presentation">
				<span class="avatar large" aria-hidden="true">{initials(user.email)}</span>
				<div class="panel-meta">
					<p class="email">{user.email}</p>
					<p class="role-label">{user.role === 'admin' ? 'Administratör' : 'Medlem'}</p>
				</div>
			</div>
			<ul class="panel-list">
				<li role="none">
					<a href="/profile" role="menuitem" class="menu-item" onclick={close}>Profil</a>
				</li>
				<li role="none">
					<a href="/settings" role="menuitem" class="menu-item" onclick={close}>Inställningar</a>
				</li>
				<li role="none">
					<form method="POST" action="/logout">
						<button type="submit" role="menuitem" class="menu-item danger">Logga ut</button>
					</form>
				</li>
			</ul>
		</div>
	{/if}
</div>

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
		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		color: var(--color-primary);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.avatar.large {
		width: 2.5rem;
		height: 2.5rem;
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
		z-index: 90;
		min-width: 14rem;
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-surface) 88%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: var(--shadow-md);
	}

	.panel-header {
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

	.menu-item.danger {
		color: var(--color-danger);
	}

	.panel-list form {
		margin: 0;
	}
</style>
