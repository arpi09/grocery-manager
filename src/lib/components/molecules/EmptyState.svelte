<script lang="ts">
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';

	interface Props {
		title: string;
		description: string;
		iconId?: FeatureIconId;
		actionLabel?: string;
		actionHref?: string;
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
		primaryAnalyticsId,
		secondaryActionLabel,
		secondaryActionHref,
		secondaryAnalyticsId
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
			<a
				class="btn btn-primary btn-full action-link"
				href={actionHref}
				data-analytics-id={primaryAnalyticsId}
			>{actionLabel}</a>
			{#if secondaryActionLabel && secondaryActionHref}
				<a
					class="btn btn-ghost action-link action-link-secondary"
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

	.action-link {
		display: inline-flex;
		box-sizing: border-box;
		min-height: var(--touch-target-min);
		align-items: center;
		justify-content: center;
		padding: var(--space-sm) var(--space-lg);
		font-weight: 600;
		border-radius: var(--radius-md);
		text-decoration: none;
		min-width: min(100%, 16rem);
	}

	.action-link.btn-primary {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.action-link.btn-ghost {
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		background: transparent;
	}
</style>
