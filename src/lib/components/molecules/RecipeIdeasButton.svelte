<script lang="ts">
	import { t } from '$lib/i18n';
	interface Props {
		onclick?: () => void;
		compact?: boolean;
	}

	let { onclick, compact = false }: Props = $props();
</script>

<button
	type="button"
	class="recipe-ideas-btn"
	class:compact
	{onclick}
	aria-label={t('planer.recipeIdeasAria')}
>
	<span class="inner">
		<svg
			class="icon"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M9.5 2.5 11 7l4.5 1-3.5 3 1 4.5L7 13l-4.5 1 1-4.5L3 6l4.5-1L9.5 2.5Z" />
			<path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
		</svg>
		<span class="label">{t('recipe.label')}</span>
		<span class="badge">{t('recipe.newBadge')}</span>
	</span>
</button>

<style>
	.recipe-ideas-btn {
		display: inline-flex;
		align-items: center;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		cursor: pointer;
		font: inherit;
		flex-shrink: 0;
		box-shadow: var(--shadow-sm);
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.inner {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.25rem;
		padding: 0.35rem 0.85rem 0.35rem 0.65rem;
		border-radius: 999px;
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}

	.icon {
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		background: var(--color-accent);
		color: #fff;
		font-size: 0.625rem;
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.compact .inner {
		min-height: 2rem;
		padding: 0.3rem 0.65rem 0.3rem 0.55rem;
		font-size: 0.75rem;
	}

	.compact .icon {
		width: 16px;
		height: 16px;
	}

	.recipe-ideas-btn:hover {
		background: var(--color-surface-muted);
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
	}

	.recipe-ideas-btn:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}
</style>
