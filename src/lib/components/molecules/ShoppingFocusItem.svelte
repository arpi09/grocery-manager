<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import type { DedupeWarning } from '$lib/domain/dedupe-autopilot';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n/messages';

	interface Props {
		item: ShoppingListItem;
		canEdit: boolean;
		picking?: boolean;
		dedupeWarnings?: DedupeWarning[];
		onPick: () => void;
		onUnavailable?: () => void;
	}

	let { item, canEdit, picking = false, dedupeWarnings = [], onPick, onUnavailable }: Props = $props();

	const detail = $derived.by(() => {
		const parts: string[] = [];
		if (item.quantity) {
			parts.push(
				item.unit
					? t('shopping.v2.shop.focusQuantity', { quantity: item.quantity, unit: item.unit })
					: item.quantity
			);
		}
		return parts.join(' · ');
	});
</script>

<section class="focus-item" data-testid="shopping-v2-focus-item">
	<p class="focus-name">{item.name}</p>
	{#if detail}
		<p class="focus-detail">{detail}</p>
	{/if}

	{#if dedupeWarnings.length > 0}
		<p class="dedupe-hint" data-testid="shopping-v2-dedupe-hint">
			{t(`shopping.v2.shop.dedupe.${dedupeWarnings[0].kind}` as MessageKey)}
		</p>
	{/if}

	{#if canEdit}
		<Button
			fullWidth
			class="pick-cta"
			loading={picking}
			data-testid="shopping-v2-pick-cta"
			onclick={onPick}
			aria-label={t('shopping.v2.shop.pickCtaAria', { name: item.name })}
		>
			{t('shopping.v2.shop.pickCta')}
		</Button>
		{#if onUnavailable}
			<button
				type="button"
				class="unavailable-link"
				data-testid="shopping-v2-unavailable-cta"
				onclick={onUnavailable}
				aria-label={t('shopping.v2.shop.unavailableAria', { name: item.name })}
			>
				{t('shopping.v2.shop.unavailableCta')}
			</button>
		{/if}
	{/if}
</section>

<style>
	.focus-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg) var(--space-md);
		text-align: center;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-muted);
	}

	.focus-name {
		margin: 0;
		font-size: clamp(1.5rem, 6vw, 2rem);
		font-weight: 700;
		line-height: 1.15;
	}

	.focus-detail {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	.dedupe-hint {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1.35;
		max-width: 22rem;
	}

	:global(.pick-cta) {
		min-height: 3.5rem;
		font-size: 1.0625rem;
		width: 100%;
		max-width: 24rem;
	}

	.unavailable-link {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-decoration: underline;
		cursor: pointer;
		min-height: var(--touch-target-min, 2.75rem);
	}

	.unavailable-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
