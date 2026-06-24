<script lang="ts">
	import { enhance } from '$app/forms';
	import AvatarCropEditor from '$lib/components/molecules/AvatarCropEditor.svelte';
	import ImageSourcePicker from '$lib/components/molecules/ImageSourcePicker.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import {
		AVATAR_ACCEPTED_MIME_TYPES,
		AvatarImageError,
		resizeImageForAvatar
	} from '$lib/utils/resize-image';

	interface Props {
		avatarUrl: string | null;
		initials: string;
		error?: string;
	}

	let { avatarUrl = $bindable(null), initials, error }: Props = $props();

	const avatarAccept = $derived(AVATAR_ACCEPTED_MIME_TYPES.join(','));

	let pickOpen = $state(false);
	let cropOpen = $state(false);
	let cropSourceUrl = $state<string | null>(null);
	let processing = $state(false);
	let localError = $state<string | undefined>(undefined);
	let removeConfirming = $state(false);
	let removeSubmitting = $state(false);

	const displayError = $derived(error ?? localError);

	function avatarErrorMessage(err: AvatarImageError): string {
		if (err.code === 'invalid_type' || err.code === 'processing_failed') {
			return t('profile.avatarInvalidType');
		}
		return t('profile.avatarTooLarge');
	}

	function openPicker() {
		localError = undefined;
		removeConfirming = false;
		pickOpen = true;
	}

	function closePicker() {
		pickOpen = false;
	}

	function onSourceSelected(file: File) {
		closePicker();
		if (cropSourceUrl) {
			URL.revokeObjectURL(cropSourceUrl);
		}
		cropSourceUrl = URL.createObjectURL(file);
		cropOpen = true;
	}

	function closeCrop() {
		cropOpen = false;
		if (cropSourceUrl) {
			URL.revokeObjectURL(cropSourceUrl);
			cropSourceUrl = null;
		}
	}

	async function onCropApplied(blob: Blob) {
		processing = true;
		localError = undefined;

		try {
			const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
			const dataUrl = await resizeImageForAvatar(file);
			avatarUrl = dataUrl;
			closeCrop();

			const form = document.getElementById('avatar-save-form') as HTMLFormElement | null;
			const input = form?.querySelector('input[name="avatarUrl"]') as HTMLInputElement | null;
			if (input) {
				input.value = dataUrl;
			}
			form?.requestSubmit();
		} catch (err) {
			if (err instanceof AvatarImageError) {
				localError = avatarErrorMessage(err);
			} else {
				localError = t('profile.avatarInvalidType');
			}
		} finally {
			processing = false;
		}
	}

	function cancelRemove() {
		removeConfirming = false;
	}

	function confirmRemove() {
		removeConfirming = false;
		const form = document.getElementById('avatar-remove-form') as HTMLFormElement | null;
		form?.requestSubmit();
	}
</script>

<section class="avatar-section" aria-labelledby="avatar-section-title">
	<h2 id="avatar-section-title" class="section-title">{t('profile.avatarSectionTitle')}</h2>
	<p class="section-lead">{t('profile.avatarSectionLead')}</p>

	<div class="avatar-preview-wrap">
		{#if avatarUrl}
			<img class="avatar-preview" src={avatarUrl} alt="" />
		{:else}
			<span class="avatar-preview initials" aria-hidden="true">{initials}</span>
		{/if}
	</div>

	{#if displayError}
		<p class="avatar-error" role="alert">{displayError}</p>
	{/if}

	<div class="avatar-actions">
		<Button type="button" variant="primary" disabled={processing || removeSubmitting} onclick={openPicker}>
			{t('profile.changePhoto')}
		</Button>

		{#if avatarUrl}
			{#if removeConfirming}
				<div class="remove-confirm" role="group" aria-label={t('profile.removePhotoConfirm')}>
					<p>{t('profile.removePhotoConfirm')}</p>
					<div class="remove-confirm-actions">
						<Button type="button" variant="secondary" onclick={cancelRemove}>
							{t('common.cancel')}
						</Button>
						<Button type="button" variant="danger" loading={removeSubmitting} onclick={confirmRemove}>
							{t('profile.removePhoto')}
						</Button>
					</div>
				</div>
			{:else}
				<Button
					type="button"
					variant="secondary"
					disabled={processing || removeSubmitting}
					onclick={() => (removeConfirming = true)}
				>
					{t('profile.removePhoto')}
				</Button>
			{/if}
		{/if}
	</div>

	{#if processing}
		<p class="processing-status" aria-live="polite">{t('profile.uploadingAvatar')}</p>
	{/if}
</section>

<form
	id="avatar-save-form"
	method="POST"
	action="?/saveAvatar"
	class="sr-form"
	use:enhance={() => {
		processing = true;
		return async ({ result, update }) => {
			try {
				await update({ invalidateAll: true });
				if (result.type === 'success') {
					const next =
						result.data && typeof result.data === 'object' && 'avatarUrl' in result.data
							? (result.data.avatarUrl as string | null)
							: avatarUrl;
					avatarUrl = next;
					localError = undefined;
				}
			} finally {
				processing = false;
			}
		};
	}}
>
	<input type="hidden" name="avatarUrl" value={avatarUrl ?? ''} />
</form>

<form
	id="avatar-remove-form"
	method="POST"
	action="?/removeAvatar"
	class="sr-form"
	use:enhance={() => {
		removeSubmitting = true;
		return async ({ result, update }) => {
			try {
				await update({ invalidateAll: true });
				if (result.type === 'success') {
					avatarUrl = null;
					localError = undefined;
				}
			} finally {
				removeSubmitting = false;
			}
		};
	}}
></form>

<Modal
	open={pickOpen}
	onClose={closePicker}
	variant="sheet"
	title={t('profile.pickPhotoTitle')}
	subtitle={t('profile.pickPhotoLead')}
	panelClass="avatar-pick-panel"
>
	<ImageSourcePicker
		cameraLabel={t('profile.takePhoto')}
		fileLabel={t('profile.choosePhoto')}
		accept={avatarAccept}
		disabled={processing}
		onSelect={onSourceSelected}
	/>
</Modal>

{#if cropSourceUrl}
	<AvatarCropEditor
		open={cropOpen}
		imageUrl={cropSourceUrl}
		onClose={closeCrop}
		onApply={onCropApplied}
	/>
{/if}

<style>
	.avatar-section {
		margin-bottom: var(--space-lg);
		padding-bottom: var(--space-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.section-title {
		margin: 0 0 var(--space-xs);
		font-size: 1.05rem;
	}

	.section-lead {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.avatar-preview-wrap {
		display: flex;
		justify-content: center;
		margin-bottom: var(--space-md);
	}

	.avatar-preview {
		width: 6.5rem;
		height: 6.5rem;
		border-radius: 999px;
		object-fit: cover;
		border: 2px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.avatar-preview.initials {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
		color: var(--color-primary);
		font-size: 1.35rem;
		font-weight: 700;
	}

	.avatar-error {
		margin: 0 0 var(--space-sm);
		color: var(--color-danger);
		font-size: 0.9rem;
		text-align: center;
	}

	.avatar-actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-sm);
	}

	.remove-confirm {
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.remove-confirm p {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
	}

	.remove-confirm-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.processing-status {
		margin: var(--space-sm) 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	.sr-form {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	:global(.avatar-pick-panel) {
		max-width: 24rem;
	}
</style>
