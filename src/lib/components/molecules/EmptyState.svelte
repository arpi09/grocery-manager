<script lang="ts">
	interface Props {
		title: string;
		description: string;
		actionLabel: string;
		actionHref: string;
		secondaryActionLabel?: string;
		secondaryActionHref?: string;
	}

	let {
		title,
		description,
		actionLabel,
		actionHref,
		secondaryActionLabel,
		secondaryActionHref
	}: Props = $props();
</script>

<div class="empty">
	<h2>{title}</h2>
	<p>{description}</p>
	<div class="actions">
		<a class="action action-primary" href={actionHref}>{actionLabel}</a>
		{#if secondaryActionLabel && secondaryActionHref}
			<a class="action action-secondary" href={secondaryActionHref}>{secondaryActionLabel}</a>
		{/if}
	</div>
</div>

<style>
	.empty {
		text-align: center;
		padding: var(--space-xl) var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-lg);
		border: 1px dashed var(--color-border);
	}

	h2 {
		margin: 0 0 var(--space-sm);
		font-size: 1.1rem;
	}

	p {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
	}

	.action {
		display: inline-flex;
		padding: 0.65rem 1.1rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}

	.action-primary {
		background: var(--color-primary);
		color: #fff;
	}

	.action-primary:hover {
		background: var(--color-primary-hover);
	}

	.action-secondary {
		background: var(--color-surface);
		color: var(--color-primary);
		border: 1px solid var(--color-primary);
	}

	.action-secondary:hover {
		background: var(--color-surface-muted);
	}
</style>
