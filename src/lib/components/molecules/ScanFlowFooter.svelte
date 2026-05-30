<script lang="ts">
	interface Props {
		cancelHref: string;
		cancelLabel?: string;
	}

	let { cancelHref, cancelLabel = 'Avbryt' }: Props = $props();
</script>

<footer class="flow-footer">
	<a class="cancel-link" href={cancelHref}>{cancelLabel}</a>
</footer>

<style>
	.flow-footer {
		position: sticky;
		bottom: 0;
		margin-top: var(--space-lg);
		padding: var(--space-md) 0 calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
		background: linear-gradient(transparent, var(--color-bg) 30%);
		text-align: center;
	}

	.cancel-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.5rem 1.25rem;
		color: var(--color-text-muted);
		font-weight: 600;
		text-decoration: none;
	}

	.cancel-link:hover {
		color: var(--color-text);
		text-decoration: none;
	}
</style>
