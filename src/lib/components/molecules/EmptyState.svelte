<script lang="ts">
	interface Props {
		title: string;
		description: string;
		actionLabel: string;
		actionHref: string;
	}

	let { title, description, actionLabel, actionHref }: Props = $props();
</script>

<div class="empty">
	<h2>{title}</h2>
	<p>{description}</p>
	<a class="action" href={actionHref}>{actionLabel}</a>
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

	.action {
		display: inline-flex;
		padding: 0.65rem 1.1rem;
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}

	.action:hover {
		background: var(--color-primary-hover);
	}
</style>
