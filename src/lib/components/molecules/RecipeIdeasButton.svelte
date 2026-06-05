<script lang="ts">
	import { Sparkles } from '@lucide/svelte';
	import { t } from '$lib/i18n';
	interface Props {
		onclick?: () => void;
		compact?: boolean;
		iconOnly?: boolean;
	}

	let { onclick, compact = false, iconOnly = false }: Props = $props();
</script>

<button
	type="button"
	class="recipe-ideas-btn"
	class:compact
	class:icon-only={iconOnly}
	data-testid="recipe-ideas-btn"
	onclick={() => onclick?.()}
	aria-label={t('planer.recipeIdeasAria')}
>
	{#if iconOnly}
		<span class="icon" aria-hidden="true">
			<Sparkles size={20} strokeWidth={2} />
		</span>
		<span class="badge-dot" aria-hidden="true"></span>
	{:else}
		<span class="inner">
			<span class="icon" aria-hidden="true">
				<Sparkles size={18} strokeWidth={2} />
			</span>
			<span class="label">{t('recipe.label')}</span>
			<span class="badge">{t('recipe.newBadge')}</span>
		</span>
	{/if}
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
		display: inline-flex;
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		background: var(--color-primary-hover);
		color: var(--color-on-primary);
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

	.compact .icon :global(svg) {
		width: 16px;
		height: 16px;
	}

	.icon-only {
		position: relative;
		justify-content: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0;
		border-radius: var(--radius-sm);
	}

	.icon-only .icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.badge-dot {
		position: absolute;
		top: 0.35rem;
		right: 0.35rem;
		width: 0.5rem;
		height: 0.5rem;
		border: 2px solid var(--color-surface);
		border-radius: 999px;
		background: var(--color-accent);
		pointer-events: none;
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
