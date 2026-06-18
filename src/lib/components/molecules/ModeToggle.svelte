<script lang="ts">
	import type { ShoppingTripMode } from '$lib/domain/shopping-trip';
	import { t } from '$lib/i18n';

	interface Props {
		mode: ShoppingTripMode;
		disabled?: boolean;
		onchange: (mode: ShoppingTripMode) => void;
	}

	let { mode, disabled = false, onchange }: Props = $props();

	function select(next: ShoppingTripMode) {
		if (disabled || next === mode) {
			return;
		}
		onchange(next);
	}
</script>

<div class="mode-toggle" role="tablist" aria-label={t('shopping.v2.mode.aria')}>
	<button
		type="button"
		role="tab"
		class:active={mode === 'plan'}
		aria-selected={mode === 'plan'}
		disabled={disabled}
		data-testid="shopping-v2-mode-plan"
		onclick={() => select('plan')}
	>
		{t('shopping.v2.mode.plan')}
	</button>
	<button
		type="button"
		role="tab"
		class:active={mode === 'shop'}
		aria-selected={mode === 'shop'}
		disabled={disabled}
		data-testid="shopping-v2-mode-shop"
		onclick={() => select('shop')}
	>
		{t('shopping.v2.mode.shop')}
	</button>
</div>

<style>
	.mode-toggle {
		display: flex;
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
		padding: 3px;
		border: 1px solid var(--color-border);
		gap: 3px;
	}

	.mode-toggle button {
		flex: 1;
		min-height: 2.5rem;
		border: none;
		border-radius: calc(var(--radius-md) - 2px);
		background: transparent;
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.mode-toggle button.active {
		background: var(--color-surface);
		color: var(--color-text);
		box-shadow: 0 1px 2px rgba(31, 42, 36, 0.08);
	}

	.mode-toggle button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.mode-toggle button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
