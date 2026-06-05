<script lang="ts">
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import LanguageSwitcher from '$lib/components/molecules/LanguageSwitcher.svelte';
	import LoginLandingShowcase from '$lib/components/molecules/LoginLandingShowcase.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		formTitle: string;
		formSubtitle?: string;
		showShowcase?: boolean;
		/** When true, the showcase hero is hidden on narrow viewports. */
		hideShowcaseOnMobile?: boolean;
		children: Snippet;
	}

	let { formTitle, formSubtitle, showShowcase = true, hideShowcaseOnMobile = false, children }: Props =
		$props();
</script>

<main class="landing">
	<div class="lang-bar">
		<LanguageSwitcher compact />
	</div>

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

	{#if showShowcase}
		<div class="hero" class:hide-on-mobile={hideShowcaseOnMobile} aria-hidden="true">
			<LoginLandingShowcase />
		</div>
	{/if}
</main>

<style>
	.landing {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		position: relative;
		background:
			radial-gradient(ellipse 120% 80% at 10% -10%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 55%),
			radial-gradient(ellipse 90% 60% at 100% 0%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 50%),
			linear-gradient(165deg, color-mix(in srgb, var(--color-surface-muted) 70%, var(--color-bg)) 0%, var(--color-bg) 45%, var(--color-bg) 100%);
	}

	@media (max-width: 899px) {
		.landing {
			justify-content: center;
		}
	}

	html[data-theme='dark'] .landing {
		background:
			radial-gradient(ellipse 120% 80% at 10% -10%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 55%),
			radial-gradient(ellipse 90% 60% at 100% 0%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 50%),
			linear-gradient(165deg, #1a221d 0%, var(--color-bg) 50%, #141a17 100%);
	}

	.lang-bar {
		position: absolute;
		top: calc(var(--space-md) + env(safe-area-inset-top, 0));
		right: var(--space-md);
		z-index: 2;
	}

	.hero {
		padding: var(--space-lg) var(--space-lg) 0;
		max-width: 32rem;
		margin: 0 auto;
		width: 100%;
	}

	@media (max-width: 899px) {
		.hero {
			flex-shrink: 0;
			order: 2;
			padding: var(--space-sm) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom, 0));
			max-width: none;
		}

		.hero.hide-on-mobile {
			display: none;
		}
	}

	.auth-panel {
		flex: 1;
		width: 100%;
		max-width: 26rem;
		margin: 0 auto;
		padding: var(--space-lg);
		padding-bottom: calc(var(--space-xl) + env(safe-area-inset-bottom, 0));
	}

	@media (max-width: 899px) {
		.auth-panel {
			order: 1;
			flex: 0 1 auto;
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding: calc(var(--space-md) + env(safe-area-inset-top, 0)) var(--space-md) var(--space-sm);
			padding-bottom: var(--space-sm);
		}
	}

	.auth-header {
		text-align: center;
		margin-bottom: var(--space-lg);
	}

	@media (max-width: 899px) {
		.auth-header {
			margin-bottom: var(--space-sm);
		}

		.auth-header :global(.app-logo.with-wordmark) {
			gap: 0.35rem;
		}

		.auth-header :global(.mark) {
			width: 2.25rem;
			height: 2.25rem;
		}

		.auth-header :global(.wordmark) {
			font-size: 1.125rem;
		}
	}

	.tagline {
		margin: var(--space-sm) 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	@media (max-width: 899px) {
		.tagline {
			margin-top: var(--space-xs);
			font-size: 0.7rem;
		}
	}

	.form-title {
		margin: 0 0 var(--space-md);
		font-size: 1.125rem;
		font-weight: 600;
		text-align: center;
		letter-spacing: -0.02em;
	}

	@media (max-width: 899px) {
		.form-title {
			margin-bottom: var(--space-sm);
			font-size: 1rem;
		}
	}

	.form-wrap {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}

	@media (max-width: 899px) {
		.form-wrap {
			padding: var(--space-md);
			box-shadow: var(--shadow-sm);
		}

		.form-wrap :global(.field) {
			margin-bottom: var(--space-sm);
		}
	}

	@media (min-width: 900px) {
		.landing {
			flex-direction: row;
			align-items: stretch;
		}

		.hero {
			order: 1;
			flex: 1.15;
			display: flex;
			align-items: center;
			justify-content: center;
			max-width: none;
			margin: 0;
			padding: var(--space-xl) clamp(var(--space-xl), 5vw, 4rem);
		}

		.auth-panel {
			order: 2;
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
