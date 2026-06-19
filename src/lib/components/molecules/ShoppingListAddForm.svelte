<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import { recordShoppingListItemActivation } from '$lib/utils/onboarding';
	import { bindSubmittingWithToast } from '$lib/utils/form-submit-feedback';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		variant?: 'default' | 'empty';
	}

	let { variant = 'default' }: Props = $props();

	let addSubmitting = $state(false);
</script>

<form
	method="POST"
	action="?/add"
	use:enhance={bindSubmittingWithToast(
		(v) => (addSubmitting = v),
		() => {
			showClientToast(t('actionToast.shoppingAdded'));
			recordShoppingListItemActivation(page.data.user?.id);
		}
	)}
	class="add-form"
	class:add-form--empty={variant === 'empty'}
	data-testid="shopping-list-add-form"
>
	<div class="add-card">
		<div class="add-primary">
			<input
				id="shopping-name"
				name="name"
				required
				maxlength="200"
				placeholder={t('shopping.itemPlaceholder')}
				aria-label={t('shopping.itemPlaceholder')}
			/>
			<Button
				type="submit"
				loading={addSubmitting}
				loadingLabel={t('common.saving')}
				aria-label={t('shopping.addLabel')}
			>
				+
			</Button>
		</div>
		{#if variant === 'default'}
			<div class="qty-row">
				<input
					name="quantity"
					inputmode="decimal"
					placeholder={t('shopping.quantityPlaceholder')}
					aria-label={t('shopping.quantityPlaceholder')}
				/>
				<input
					name="unit"
					maxlength="40"
					placeholder={t('shopping.unitPlaceholder')}
					aria-label={t('shopping.unitPlaceholder')}
				/>
			</div>
		{/if}
	</div>
</form>

<style>
	.add-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.add-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.add-form--empty .add-card {
		background: var(--color-surface);
	}

	.add-primary {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-sm);
	}

	.add-primary input,
	.qty-row input {
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		min-height: var(--touch-target-min);
	}

	.qty-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}
</style>
