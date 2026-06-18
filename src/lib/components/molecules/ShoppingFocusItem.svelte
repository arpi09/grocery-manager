<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';

	interface Props {
		item: ShoppingListItem;
		canEdit: boolean;
		picking?: boolean;
		onPick: () => void;
	}

	let { item, canEdit, picking = false, onPick }: Props = $props();

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
	<div class="illus-wrap" aria-hidden="true">
		<img src="/illustrations/v2/shopping-trip.svg" alt="" width="160" height="120" />
	</div>

	<p class="focus-name">{item.name}</p>
	{#if detail}
		<p class="focus-detail">{detail}</p>
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
	}

	.illus-wrap {
		width: min(100%, 200px);
	}

	.illus-wrap img {
		width: 100%;
		height: auto;
		display: block;
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

	:global(.pick-cta) {
		min-height: 3.5rem;
		font-size: 1.0625rem;
		width: 100%;
		max-width: 24rem;
	}
</style>
