<script lang="ts">
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
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
			<h1 class="sr-only">Skaffu</h1>
			<AppLogo size="lg" showWordmark />
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
		background: linear-gradient(160deg, var(--color-surface-muted) 0%, var(--color-bg) 50%, color-mix(in srgb, var(--color-taupe) 35%, var(--color-bg)) 100%);
	}

	html[data-theme='dark'] .auth {
		background: linear-gradient(160deg, color-mix(in srgb, var(--color-text) 25%, var(--color-bg)) 0%, var(--color-bg) 50%, color-mix(in srgb, var(--color-text) 15%, var(--color-bg)) 100%);
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

	.brand p {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.page-title {
		margin: 0 0 var(--space-lg);
		font-size: 1.1rem;
		text-align: center;
	}
</style>
