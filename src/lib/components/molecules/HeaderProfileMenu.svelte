<script lang="ts">
	import { userInitials } from '$lib/domain/user';

	interface ProfileUser {
		email: string;
		displayName?: string | null;
		avatarUrl?: string | null;
	}

	interface Props {
		user: ProfileUser;
	}

	let { user }: Props = $props();

	let open = $state(false);
	let menuEl = $state<HTMLDivElement | null>(null);

	const initials = $derived(userInitials(user.displayName, user.email));
	const label = $derived(user.displayName?.trim() || user.email);

	$effect(() => {
		if (!open) {
			return;
		}

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (menuEl && target && !menuEl.contains(target)) {
				open = false;
			}
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				open = false;
			}
		};

		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<div class="profile-menu" bind:this={menuEl}>
	<button
		type="button"
		class="avatar-btn"
		aria-label="Kontomeny"
		aria-expanded={open}
		aria-haspopup="menu"
		onclick={() => (open = !open)}
	>
		{#if user.avatarUrl}
			<img class="avatar-img" src={user.avatarUrl} alt="" />
		{:else}
			<span class="avatar-initials" aria-hidden="true">{initials}</span>
		{/if}
	</button>

	{#if open}
		<div class="dropdown" role="menu">
			<p class="dropdown-label">{label}</p>
			<a href="/profile" role="menuitem" onclick={() => (open = false)}>Redigera profil</a>
			<a href="/settings" role="menuitem" onclick={() => (open = false)}>Inställningar</a>
		</div>
	{/if}
</div>

<style>
	.profile-menu {
		position: relative;
		flex-shrink: 0;
	}

	.avatar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		cursor: pointer;
		overflow: hidden;
	}

	.avatar-btn:hover {
		border-color: var(--color-primary);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initials {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 0.35rem);
		right: 0;
		min-width: 11rem;
		padding: var(--space-xs);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		z-index: 20;
	}

	.dropdown-label {
		margin: 0;
		padding: 0.45rem 0.6rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dropdown a {
		display: block;
		padding: 0.5rem 0.6rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.dropdown a:hover {
		background: var(--color-surface-muted);
		color: var(--color-primary);
	}
</style>
