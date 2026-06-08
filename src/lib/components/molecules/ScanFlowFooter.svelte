<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		cancelHref?: string;
		onCancel?: () => void;
		cancelLabel?: string;
		sticky?: boolean;
		'data-testid'?: string;
	}

	let {
		cancelHref,
		onCancel,
		cancelLabel,
		sticky = true,
		'data-testid': dataTestId
	}: Props = $props();

	const label = $derived(cancelLabel ?? t('common.cancel'));
</script>

<footer class="flow-footer" class:flow-footer--static={!sticky}>
	{#if onCancel}
		<button type="button" class="cancel-link" data-testid={dataTestId} onclick={onCancel}>
			{label}
		</button>
	{:else if cancelHref}
		<a class="cancel-link" href={cancelHref} data-testid={dataTestId}>{label}</a>
	{/if}
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

	.flow-footer--static {
		position: static;
		margin-top: var(--space-md);
		padding-bottom: var(--space-md);
		background: transparent;
	}

	@media (max-width: 899px) {
		.flow-footer {
			bottom: calc(var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom, 0));
		}
	}

	.cancel-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.5rem 1.25rem;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		font-weight: 600;
		font-size: inherit;
		font-family: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	.cancel-link:hover {
		color: var(--color-text);
		text-decoration: none;
	}
</style>
