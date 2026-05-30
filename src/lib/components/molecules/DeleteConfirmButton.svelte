<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import {
		getDeleteCopy,
		type DeleteCopyOptions,
		type DeleteSafetyContext,
		type DeleteSafetyTier
	} from '$lib/utils/delete-safety';

	interface Props {
		tier: DeleteSafetyTier;
		context: DeleteSafetyContext;
		copyOptions?: DeleteCopyOptions;
		action: string;
		formId?: string;
		submitEnhance?: SubmitFunction;
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		fullWidth?: boolean;
		class?: string;
		label?: string;
		ariaLabel?: string;
		confirmLoading?: boolean;
		children?: Snippet;
	}

	let {
		tier,
		context,
		copyOptions = {},
		action,
		formId: formIdProp,
		submitEnhance,
		variant = 'danger',
		fullWidth = false,
		class: className = '',
		label = 'Ta bort',
		ariaLabel,
		confirmLoading = false,
		children
	}: Props = $props();

	const formId = $derived(formIdProp ?? `delete-form-${Math.random().toString(36).slice(2, 9)}`);
	const copy = $derived(getDeleteCopy(tier, context, copyOptions));

	let modalOpen = $state(false);
	let inlineConfirming = $state(false);

	function openGuard() {
		if (tier === 1) {
			inlineConfirming = true;
			return;
		}
		modalOpen = true;
	}

	function cancelInline() {
		inlineConfirming = false;
	}

	function confirmInline() {
		const form = document.getElementById(formId) as HTMLFormElement | null;
		inlineConfirming = false;
		form?.requestSubmit();
	}

	function closeModal() {
		modalOpen = false;
	}

	function onModalConfirm() {
		modalOpen = false;
	}
</script>

<form
	id={formId}
	method="POST"
	{action}
	class="delete-guard-form {className}"
	use:enhance={submitEnhance}
>
	{@render children?.()}

	{#if tier === 1 && inlineConfirming}
		<div class="inline-confirm" role="group" aria-label="Bekräfta borttagning">
			<span class="inline-confirm-text">{copy.title}</span>
			<Button type="button" variant="secondary" onclick={cancelInline}>Avbryt</Button>
			<Button type="button" variant="danger" onclick={confirmInline} aria-label="Bekräfta borttagning">
				{copy.confirmLabel}
			</Button>
		</div>
	{:else if tier === 1}
		<Button
			type="button"
			{variant}
			{fullWidth}
			onclick={openGuard}
			aria-label={ariaLabel ?? label}
		>
			{label}
		</Button>
	{:else}
		<Button
			type="button"
			{variant}
			{fullWidth}
			onclick={openGuard}
			aria-label={ariaLabel ?? label}
		>
			{label}
		</Button>
	{/if}
</form>

{#if tier >= 2}
	<DeleteSafetyModal
		open={modalOpen}
		onClose={closeModal}
		{tier}
		{context}
		{copyOptions}
		{formId}
		onConfirm={onModalConfirm}
		confirmLoading={confirmLoading}
	/>
{/if}

<style>
	.delete-guard-form {
		display: contents;
	}

	.inline-confirm {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}

	.inline-confirm-text {
		font-size: 0.82rem;
		color: var(--color-text-muted);
		width: 100%;
	}
</style>
