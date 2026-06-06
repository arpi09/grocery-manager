<script lang="ts">
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';

	interface Props {
		title: string;
		description: string;
		iconId?: FeatureIconId;
		actionLabel?: string;
		actionHref?: string;
		secondaryActionLabel?: string;
		secondaryActionHref?: string;
	}

	let {
		title,
		description,
		iconId,
		actionLabel,
		actionHref,
		secondaryActionLabel,
		secondaryActionHref
	}: Props = $props();
</script>

<div class="empty">
	{#if iconId}
		<span class="icon-wrap" aria-hidden="true">
			<FeatureIcon id={iconId} size={28} />
		</span>
	{/if}
	<h2>{title}</h2>
	<p>{description}</p>
	{#if actionLabel && actionHref}
		<div class="actions">
			<a class="action action-primary" href={actionHref}>{actionLabel}</a>
			{#if secondaryActionLabel && secondaryActionHref}
				<a class="action action-secondary" href={secondaryActionHref}>{secondaryActionLabel}</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.empty {
		text-align: center;
		padding: var(--space-xl) var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-lg);
		border: 1px dashed var(--color-border);
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

	.action {
		display: inline-flex;
		box-sizing: border-box;
		min-height: var(--touch-target-min);
		min-height: max(44px, var(--touch-target-min));
		align-items: center;
		justify-content: center;
		padding: 0.65rem 1.25rem;
		font-weight: 600;
		border-radius: var(--radius-md);
		text-decoration: none;
	}

	.action-primary {
		background: var(--color-primary);
		color: #fff;
		min-width: min(100%, 16rem);
	}

	.action-primary:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	.action-secondary {
		background: transparent;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
		min-height: var(--touch-target-min);
		padding: 0 var(--space-md);
	}

	.action-secondary:hover {
		color: var(--color-text);
		text-decoration: none;
	}
</style>
