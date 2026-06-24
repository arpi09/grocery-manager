<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		count: number;
		href: string;
		active?: boolean;
		onSelect?: () => void;
		bulkInferAction?: string | null;
		actionLabel?: string | null;
	}

	let { count, href, active = false, onSelect, bulkInferAction = null, actionLabel = null }: Props = $props();

	function handleClick(event: MouseEvent) {
		if (onSelect) {
			event.preventDefault();
			onSelect();
		}
	}
</script>

{#if count > 0}
	<div class="missing-expiry-wrap">
		<a
			class="missing-expiry-chip"
			class:missing-expiry-chip--active={active}
			{href}
			data-testid="inventory-no-expiry-chip"
			aria-current={active ? 'true' : undefined}
			onclick={handleClick}
		>
			{t('inventory.noExpiryFilterChip', { count })}
		</a>
		{#if bulkInferAction && actionLabel}
			<form method="POST" action={bulkInferAction} class="missing-expiry-action-form">
				<button type="submit" class="missing-expiry-action" data-testid="inventory-no-expiry-bulk-action">
					{actionLabel}
				</button>
			</form>
		{/if}
	</div>
{/if}

<style>
	.missing-expiry-wrap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.missing-expiry-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0 var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-text-muted) 35%, var(--color-border));
		border-radius: var(--radius-full, 999px);
		background: color-mix(in srgb, var(--color-text-muted) 8%, var(--color-surface));
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}

	.missing-expiry-action-form {
		display: inline;
		margin: 0;
		padding: 0;
	}

	.missing-expiry-action {
		border: none;
		background: none;
		padding: 0;
		color: var(--color-primary);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
	}

	.missing-expiry-chip--active {
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
	}

	.missing-expiry-chip:focus-visible,
	.missing-expiry-action:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
