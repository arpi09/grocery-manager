<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import type { AccountDeletionImpact } from '$lib/application/account.service';
	import { getLocale, t } from '$lib/i18n';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import { translate } from '$lib/i18n/messages';

	interface Props {
		email: string;
		deletionImpact: AccountDeletionImpact;
		accountError?: string | null;
	}

	let { email, deletionImpact, accountError = null }: Props = $props();

	let deleteModalOpen = $state(false);
	let deleteSubmitting = $state(false);

	const locale = $derived(getLocale());
	const confirmWord = $derived(translate(locale, 'delete.account.confirmWord'));

	function openDeleteModal() {
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		deleteModalOpen = false;
	}
</script>

<SettingsSection
	id="settings-account"
	title={t('settings.account.title')}
	description={t('settings.account.description')}
>
	<SettingsRow title={email} note={t('settings.account.loggedInEmail')} />
	<SettingsRow
		href="/profile"
		title={t('settings.account.editProfile')}
		note={t('settings.account.editProfileNote')}
	/>
	<SettingsRow
		href="/privacy"
		title={t('settings.legal.privacyLink')}
		note={t('settings.legal.privacyNote')}
	/>
</SettingsSection>

<div class="danger-zone">
	<h3 class="danger-title">{t('settings.account.dangerZone')}</h3>
	<p class="danger-note">{t('settings.account.deleteWarning')}</p>
	{#if deletionImpact.soleMemberHouseholdCount > 0}
		<p class="danger-warning" role="status">
			{t('settings.account.deleteSoleHouseholds', {
				count: deletionImpact.soleMemberHouseholdCount
			})}
		</p>
	{/if}
	{#if deletionImpact.sharedHouseholdCount > 0}
		<p class="danger-warning" role="status">
			{t('settings.account.deleteSharedHouseholds', {
				count: deletionImpact.sharedHouseholdCount
			})}
		</p>
	{/if}
	{#if accountError}
		<FeedbackBanner tone="error" message={accountError} />
	{/if}
	<Button type="button" variant="danger" onclick={openDeleteModal}>
		{t('settings.account.deleteAccount')}
	</Button>
</div>

<DeleteSafetyModal
	open={deleteModalOpen}
	onClose={closeDeleteModal}
	tier={4}
	context="accountDelete"
	copyOptions={{ otherMemberCount: deletionImpact.sharedHouseholdCount }}
	confirmationTarget={confirmWord}
	formAction="?/deleteAccount"
	typedConfirmationFieldName="confirmText"
	submitEnhance={bindSubmitting((value) => (deleteSubmitting = value))}
	confirmLoading={deleteSubmitting}
	loadingLabel={t('settings.account.deletingAccount')}
/>

<style>
	.danger-zone {
		margin-top: var(--space-lg);
		padding: var(--space-md) var(--space-lg);
		border: 1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-danger) 6%, var(--color-surface));
	}

	.danger-title {
		margin: 0 0 var(--space-sm);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-danger);
	}

	.danger-note {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.danger-warning {
		margin: 0 0 var(--space-sm);
		font-size: 0.85rem;
		line-height: 1.4;
		color: var(--color-danger);
	}
</style>
