<script lang="ts">
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';

	interface Props {
		title: string;
		description: string;
		iconId?: FeatureIconId;
		actionLabel?: string;
		actionHref?: string;
		actionVariant?: 'primary' | 'secondary';
		onAction?: () => void;
		primaryAnalyticsId?: string;
		secondaryActionLabel?: string;
		secondaryActionHref?: string;
		secondaryAnalyticsId?: string;
	}

	let {
		title,
		description,
		iconId,
		actionLabel,
		actionHref,
		actionVariant = 'primary',
		onAction,
		primaryAnalyticsId,
		secondaryActionLabel,
		secondaryActionHref,
		secondaryAnalyticsId
	}: Props = $props();

	const hasAction = $derived(Boolean(actionLabel && (actionHref || onAction)));
</script>

<div class="empty">
	{#if iconId}
		<span class="icon-wrap" aria-hidden="true">
			<FeatureIcon id={iconId} size={28} />
		</span>
	{/if}
	<h2>{title}</h2>
	<p>{description}</p>
	{#if hasAction}
		<div class="actions">
			{#if onAction}
				<button
					type="button"
					class="action-link"
					class:action-link-secondary={actionVariant === 'secondary'}
					class:action-link-primary={actionVariant === 'primary'}
					data-analytics-id={primaryAnalyticsId}
					onclick={onAction}
				>
					{actionLabel}
				</button>
			{:else if actionHref}
				<a
					class="action-link"
					class:action-link-secondary={actionVariant === 'secondary'}
					class:action-link-primary={actionVariant === 'primary'}
					href={actionHref}
					data-analytics-id={primaryAnalyticsId}
				>{actionLabel}</a>
			{/if}
			{#if secondaryActionLabel && secondaryActionHref}
				<a
					class="action-link action-link-secondary"
					href={secondaryActionHref}
					data-analytics-id={secondaryAnalyticsId}
				>{secondaryActionLabel}</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.empty {
		text-align: center;
		padding: var(--space-lg) var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-lg);
		border: 1px dashed var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3.25rem;
		height: 3.25rem;
		margin-bottom: var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}

	h2 {
		margin: 0 0 var(--space-sm);
		font-size: 1.15rem;
		font-weight: var(--font-weight-display);
		letter-spacing: -0.02em;
	}

	p {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
		max-width: 32ch;
		margin-inline: auto;
		font-size: var(--font-size-body-sm);
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
	}

	.action-link {
		display: inline-flex;
		box-sizing: border-box;
		min-height: var(--touch-target-min);
		align-items: center;
		justify-content: center;
		padding: var(--space-sm) var(--space-lg);
		font: inherit;
		font-weight: 600;
		border-radius: var(--radius-md);
		text-decoration: none;
		min-width: min(100%, 16rem);
		cursor: pointer;
	}

	.action-link-primary {
		background: var(--color-primary);
		color: var(--color-on-primary);
		border: none;
	}

	.action-link-secondary {
		font-size: var(--font-size-body-sm);
		color: var(--color-primary);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.action-link-secondary:hover {
		border-color: var(--color-primary);
		text-decoration: none;
	}

	.action-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
