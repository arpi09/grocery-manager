<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { getLocale, t } from '$lib/i18n';
	import {
		deleteModalVariant,
		getDeleteCopy,
		isTypedConfirmationValid,
		type DeleteCopyOptions,
		type DeleteSafetyContext,
		type DeleteSafetyTier
	} from '$lib/utils/delete-safety';
	import { subscribeNarrowViewport } from '$lib/utils/use-narrow-viewport';

	interface Props {
		open: boolean;
		onClose: () => void;
		tier: DeleteSafetyTier;
		context: DeleteSafetyContext;
		copyOptions?: DeleteCopyOptions;
		title?: string;
		description?: string;
		confirmLabel?: string;
		confirmationTarget?: string;
		/** POST form inside modal (tier 4 household delete). */
		formAction?: string;
		typedConfirmationFieldName?: string;
		/** External form submit via id (tier 2–3 guards). */
		formId?: string;
		onConfirm?: () => void;
		confirmDisabled?: boolean;
		confirmLoading?: boolean;
		loadingLabel?: string;
		submitEnhance?: SubmitFunction;
		fields?: Snippet;
		footer?: Snippet;
	}

	let {
		open,
		onClose,
		tier,
		context,
		copyOptions = {},
		title,
		description,
		confirmLabel,
		confirmationTarget,
		formAction,
		typedConfirmationFieldName = 'confirmName',
		formId,
		onConfirm,
		confirmDisabled = false,
		confirmLoading = false,
		loadingLabel,
		submitEnhance,
		fields,
		footer
	}: Props = $props();

	let isNarrow = $state(false);
	let typedInput = $state('');

	const locale = $derived(getLocale());
	const copy = $derived(getDeleteCopy(tier, context, copyOptions, locale));
	const modalTitle = $derived(title ?? copy.title);
	const modalDescription = $derived(description ?? copy.description);
	const modalConfirmLabel = $derived(confirmLabel ?? copy.confirmLabel);
	const targetName = $derived(confirmationTarget ?? copyOptions.confirmationTarget ?? '');
	const requiresTypedConfirmation = $derived(tier === 4 && Boolean(targetName));
	const typedValid = $derived(
		!requiresTypedConfirmation || isTypedConfirmationValid(typedInput, targetName, locale)
	);
	const modalVariant = $derived(deleteModalVariant(isNarrow));
	const usesEmbeddedForm = $derived(Boolean(formAction));

	$effect(() => {
		if (open) {
			typedInput = '';
		}
	});

	function handleConfirm() {
		if (!typedValid) {
			return;
		}
		if (formId) {
			const form = document.getElementById(formId) as HTMLFormElement | null;
			form?.requestSubmit();
			onClose();
			return;
		}
		onConfirm?.();
	}

	onMount(() => subscribeNarrowViewport((narrow) => {
		isNarrow = narrow;
	}));
</script>

<Modal
	{open}
	onClose={onClose}
	variant={modalVariant}
	title={modalTitle}
	panelClass="delete-safety-panel"
	label={modalTitle}
>
	{#if usesEmbeddedForm}
		<form method="POST" action={formAction} class="embedded-form" use:enhance={submitEnhance}>
			<p class="modal-description">{modalDescription}</p>
			{#if copy.consequence}
				<p class="modal-consequence" role="status">{copy.consequence}</p>
			{/if}
			{#if fields}
				{@render fields()}
			{/if}
			{#if requiresTypedConfirmation}
				<label class="typed-label">
					{copy.typedConfirmationLabel ?? t('common.confirmation')}
					<span class="typed-hint">{copy.typedConfirmationHint}</span>
					<input
						name={typedConfirmationFieldName}
						type="text"
						bind:value={typedInput}
						required
						autocomplete="off"
						placeholder={copy.typedConfirmationPlaceholder ?? targetName}
						aria-label={copy.typedConfirmationLabel ?? t('common.confirmation')}
					/>
				</label>
			{/if}
			<div class="modal-actions">
				<Button type="button" variant="secondary" onclick={onClose}>{copy.cancelLabel}</Button>
				<Button
					type="submit"
					variant="danger"
					disabled={confirmDisabled || !typedValid}
					loading={confirmLoading}
					{loadingLabel}
				>
					{modalConfirmLabel}
				</Button>
			</div>
		</form>
	{:else}
		<p class="modal-description">{modalDescription}</p>
		{#if copy.consequence}
			<p class="modal-consequence" role="status">{copy.consequence}</p>
		{/if}
		{#if fields}
			<div class="modal-fields">
				{@render fields()}
			</div>
		{/if}
		{#if requiresTypedConfirmation}
			<label class="typed-label">
				{copy.typedConfirmationLabel ?? t('common.confirmation')}
				<span class="typed-hint">{copy.typedConfirmationHint}</span>
				<input
					type="text"
					bind:value={typedInput}
					required
					autocomplete="off"
					placeholder={copy.typedConfirmationPlaceholder ?? targetName}
					aria-label={copy.typedConfirmationLabel ?? t('common.confirmation')}
				/>
			</label>
		{/if}
		{#if footer}
			{@render footer()}
		{:else}
			<div class="modal-actions">
				<Button type="button" variant="secondary" onclick={onClose}>{copy.cancelLabel}</Button>
				<Button
					type="button"
					variant="danger"
					disabled={confirmDisabled || !typedValid}
					loading={confirmLoading}
					{loadingLabel}
					onclick={handleConfirm}
				>
					{modalConfirmLabel}
				</Button>
			</div>
		{/if}
	{/if}
</Modal>

<style>
	:global(.delete-safety-panel) {
		width: min(460px, calc(100vw - 2 * var(--space-md)));
	}

	.embedded-form {
		display: flex;
		flex-direction: column;
	}

	.modal-description,
	.modal-consequence {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.45;
	}

	.modal-consequence {
		color: var(--color-danger);
		font-weight: 600;
	}

	.modal-fields {
		margin-bottom: var(--space-sm);
	}

	.typed-label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		margin-bottom: var(--space-sm);
	}

	.typed-hint {
		color: var(--color-text-muted);
		font-size: 0.82rem;
		font-weight: 400;
	}

	.typed-label input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	@media (max-width: 640px) {
		.modal-actions {
			flex-direction: column-reverse;
			align-items: stretch;
		}
	}
</style>
