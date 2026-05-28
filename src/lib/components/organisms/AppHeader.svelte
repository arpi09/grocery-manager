<script lang="ts">
	import HeaderProfileMenu from '$lib/components/molecules/HeaderProfileMenu.svelte';

	interface NavUser {
		email: string;
		displayName?: string | null;
		avatarUrl?: string | null;
		petsEnabled?: boolean;
		role?: string;
	}

	interface Props {
		title: string;
		subtitle?: string;
		user?: NavUser | null;
		/** @deprecated Pass `user` instead */
		showPetsNav?: boolean;
	}

	let { title, subtitle, user = null, showPetsNav }: Props = $props();

	const petsNav = $derived(Boolean(showPetsNav ?? user?.petsEnabled));
	const adminNav = $derived(user?.role === 'admin');
</script>

<header class="header">
	<div>
		<h1>{title}</h1>
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}
	</div>
	<div class="header-right">
		<nav class="nav">
			<a href="/">Home</a>
			<a href="/inkop">Inköp</a>
			<a href="/planer">Planer</a>
			{#if petsNav}
				<a href="/husdjur">Husdjur</a>
			{/if}
			{#if adminNav}
				<a href="/admin">Admin</a>
			{/if}
		</nav>
		{#if user}
			<HeaderProfileMenu {user} />
		{/if}
	</div>
</header>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.subtitle {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.nav {
		display: flex;
		gap: var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.nav a {
		text-decoration: none;
		color: var(--color-text-muted);
	}

	.nav a:hover {
		color: var(--color-primary);
	}

	@media (max-width: 760px) {
		.header {
			flex-direction: column;
		}

		.header-right {
			width: 100%;
			justify-content: space-between;
		}

		.nav {
			flex-wrap: wrap;
		}
	}
</style>
