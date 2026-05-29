<script lang="ts">
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import LoginLandingShowcase from '$lib/components/molecules/LoginLandingShowcase.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		formTitle: string;
		formSubtitle?: string;
		showShowcase?: boolean;
		children: Snippet;
	}

	let { formTitle, formSubtitle, showShowcase = true, children }: Props = $props();
</script>

<main class="landing">
	{#if showShowcase}
		<div class="hero">
			<LoginLandingShowcase />
		</div>
	{/if}

	<section class="auth-panel" aria-labelledby="auth-form-title">
		<header class="auth-header">
			<AppLogo size="lg" showWordmark />
			{#if formSubtitle}
				<p class="tagline">{formSubtitle}</p>
			{/if}
		</header>

		<h1 id="auth-form-title" class="form-title">{formTitle}</h1>

		<div class="form-wrap">
			{@render children()}
		</div>
	</section>
</main>

<style>
	.landing {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background:
			radial-gradient(ellipse 120% 80% at 10% -10%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 55%),
			radial-gradient(ellipse 90% 60% at 100% 0%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 50%),
			linear-gradient(165deg, color-mix(in srgb, var(--color-surface-muted) 70%, var(--color-bg)) 0%, var(--color-bg) 45%, var(--color-bg) 100%);
	}

	html[data-theme='dark'] .landing {
		background:
			radial-gradient(ellipse 120% 80% at 10% -10%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 55%),
			radial-gradient(ellipse 90% 60% at 100% 0%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 50%),
			linear-gradient(165deg, #1a221d 0%, var(--color-bg) 50%, #141a17 100%);
	}

	.hero {
		padding: var(--space-lg) var(--space-lg) 0;
		max-width: 32rem;
		margin: 0 auto;
		width: 100%;
	}

	.auth-panel {
		flex: 1;
		width: 100%;
		max-width: 26rem;
		margin: 0 auto;
		padding: var(--space-lg);
		padding-bottom: calc(var(--space-xl) + env(safe-area-inset-bottom, 0));
	}

	.auth-header {
		text-align: center;
		margin-bottom: var(--space-lg);
	}

	.tagline {
		margin: var(--space-sm) 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.form-title {
		margin: 0 0 var(--space-md);
		font-size: 1.125rem;
		font-weight: 600;
		text-align: center;
		letter-spacing: -0.02em;
	}

	.form-wrap {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}

	@media (min-width: 900px) {
		.landing {
			flex-direction: row;
			align-items: stretch;
		}

		.hero {
			flex: 1.15;
			display: flex;
			align-items: center;
			justify-content: center;
			max-width: none;
			margin: 0;
			padding: var(--space-xl) clamp(var(--space-xl), 5vw, 4rem);
		}

		.auth-panel {
			flex: 0.85;
			max-width: 28rem;
			margin: 0;
			padding: clamp(var(--space-xl), 4vh, 3rem);
			display: flex;
			flex-direction: column;
			justify-content: center;
			border-left: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
			background: color-mix(in srgb, var(--color-surface) 92%, var(--color-bg));
		}

		html[data-theme='dark'] .auth-panel {
			background: color-mix(in srgb, var(--color-surface) 85%, var(--color-bg));
		}

		.form-wrap {
			box-shadow: var(--shadow-sm);
		}
	}

	@media (min-width: 1100px) {
		.hero {
			flex: 1.25;
		}
	}
</style>
