<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		children: Snippet;
	}

	let { title, subtitle, children }: Props = $props();
</script>

<div class="auth">
	<div class="panel">
		<div class="brand">
			<span class="logo" aria-hidden="true">🥬</span>
			<h1>Home Pantry</h1>
			{#if subtitle}
				<p>{subtitle}</p>
			{/if}
		</div>
		<h2 class="page-title">{title}</h2>
		{@render children()}
	</div>
</div>

<style>
	.auth {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
		background: linear-gradient(160deg, #eef2eb 0%, var(--color-bg) 50%, #f0ebe3 100%);
	}

	.panel {
		width: 100%;
		max-width: 400px;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		box-shadow: var(--shadow-md);
		border: 1px solid var(--color-border);
	}

	.brand {
		text-align: center;
		margin-bottom: var(--space-xl);
	}

	.logo {
		font-size: 2.5rem;
	}

	.brand h1 {
		margin: var(--space-sm) 0 0;
		font-size: 1.5rem;
	}

	.brand p {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.page-title {
		margin: 0 0 var(--space-lg);
		font-size: 1.1rem;
		text-align: center;
	}
</style>
