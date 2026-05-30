<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import DeleteSafetyModal from '$lib/components/molecules/DeleteSafetyModal.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import {
		householdRoleLabel,
		inviteRoleLabel,
		isHouseholdOwner
	} from '$lib/domain/household';
	import { getLocale, t } from '$lib/i18n';
	import type { HouseholdInviteView, HouseholdRole, HouseholdView } from '$lib/domain/household';

	interface Props {
		household: HouseholdView;
		isOwner: boolean;
		householdRole: HouseholdRole | null;
		pendingInvites: HouseholdInviteView[];
		currentUserId: string;
		householdError: string | null;
		inviteFieldErrors: Record<string, string[] | undefined>;
		inviteLink: string | null;
		inviteEmailWarning: string | null;
		onCopyInviteLink: (link: string) => void;
		copiedInviteLink: boolean;
	}

	let {
		household,
		isOwner,
		householdRole,
		pendingInvites,
		currentUserId,
		householdError,
		inviteFieldErrors,
		inviteLink,
		inviteEmailWarning,
		onCopyInviteLink,
		copiedInviteLink
	}: Props = $props();

	let deleteModalOpen = $state(false);
	let inviteSubmitting = $state(false);
	let deleteSubmitting = $state(false);

	const inviteSent = $derived(Boolean(inviteLink && !householdError && !inviteEmailWarning));

	const otherMemberCount = $derived(
		household.members.filter((member) => member.userId !== currentUserId).length
	);

	function openDeleteModal() {
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		deleteModalOpen = false;
	}

	function canManageMember(memberUserId: string, memberRole: string) {
		if (!isOwner || memberUserId === currentUserId) {
			return false;
		}
		if (memberRole === 'owner') {
			const ownerCount = household.members.filter((m) => m.role === 'owner').length;
			return ownerCount > 1;
		}
		return true;
	}
</script>

<div class="household-panel">
	<div class="household-intro">
		<p class="household-name">{household.name}</p>
	</div>

	<div class="subsection">
		<h3 class="subsection-title">{t('household.members')}</h3>
		<ul class="member-list">
			{#each household.members as member, index (member.userId)}
				<li class:last={index === household.members.length - 1}>
					<div class="member-info">
						<span class="member-email">{member.email}</span>
						{#if member.displayName}
							<span class="member-display">{member.displayName}</span>
						{/if}
					</div>
					<div class="member-actions">
						<span class="member-role">{householdRoleLabel(member.role, getLocale())}</span>
						{#if canManageMember(member.userId, member.role)}
							<form method="POST" action="?/updateMemberRole" class="inline-form">
								<input type="hidden" name="userId" value={member.userId} />
								<select name="role" aria-label={t('household.roleFor', { email: member.email })}>
									<option value="owner" selected={member.role === 'owner'}>{t('household.roleOwner')}</option>
									<option value="editor" selected={member.role === 'editor'}>{t('household.roleEditor')}</option>
									<option value="viewer" selected={member.role === 'viewer'}>{t('household.roleViewer')}</option>
								</select>
								<Button type="submit" variant="secondary">{t('common.save')}</Button>
							</form>
							<DeleteConfirmButton
								tier={3}
								context="householdMember"
								copyOptions={{ itemName: member.email }}
								action="?/removeMember"
								label={t('common.delete')}
								ariaLabel={t('household.removeMember', { email: member.email })}
								class="inline-form"
							>
								<input type="hidden" name="userId" value={member.userId} />
							</DeleteConfirmButton>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>

	{#if isOwner}
		<div class="subsection">
			<h3 class="subsection-title">{t('household.invite')}</h3>
			<p class="subsection-note">
				{t('household.inviteNote')}
			</p>

			{#if householdError}
				<FeedbackBanner tone="error" message={householdError} />
			{/if}

			{#if inviteSent}
				<FeedbackBanner tone="success" message={t('household.inviteSent')} />
			{/if}

			<form
				method="POST"
				action="?/createInvite"
				class="invite-form"
				use:enhance={bindSubmitting((v) => (inviteSubmitting = v))}
			>
				<label>
					{t('common.email')}
					<input
						name="email"
						type="email"
						required
						placeholder="namn@example.com"
						autocomplete="email"
					/>
					{#if inviteFieldErrors.email?.[0]}
						<span class="field-error">{inviteFieldErrors.email[0]}</span>
					{/if}
				</label>
				<label>
					{t('common.role')}
					<select name="role" required>
						<option value="editor">{inviteRoleLabel('editor', getLocale())}</option>
						<option value="viewer">{inviteRoleLabel('viewer', getLocale())}</option>
					</select>
				</label>
				<Button type="submit" loading={inviteSubmitting} loadingLabel={t('household.sendingInvite')}>
					{t('household.sendInvite')}
				</Button>
			</form>

			{#if inviteEmailWarning}
				<FeedbackBanner tone="warning" message={inviteEmailWarning} />
			{/if}

			{#if inviteLink}
				<div class="invite-link-box">
					<p class="invite-link-label">{t('household.inviteLink')}</p>
					<div class="invite-link-row">
						<input readonly value={inviteLink} class="invite-link-input" />
						<Button type="button" variant="secondary" onclick={() => onCopyInviteLink(inviteLink)}>
							{copiedInviteLink ? t('common.copied') : t('common.copy')}
						</Button>
					</div>
				</div>
			{/if}

			{#if pendingInvites.length > 0}
				<h3 class="subsection-title">{t('household.pendingInvites')}</h3>
				<ul class="pending-list">
					{#each pendingInvites as invite (invite.id)}
						<li>
							<div>
								<span class="member-email">{invite.email}</span>
								<span class="member-role">{inviteRoleLabel(invite.role, getLocale())}</span>
							</div>
							<DeleteConfirmButton
								tier={2}
								context="inviteRevoke"
								copyOptions={{ itemName: invite.email }}
								action="?/revokeInvite"
								label={t('household.revoke')}
								ariaLabel={t('household.revokeNamed', { email: invite.email })}
							>
								<input type="hidden" name="inviteId" value={invite.id} />
							</DeleteConfirmButton>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if householdRole}
		<p class="role-note">
			{t('household.yourRole', { role: householdRoleLabel(householdRole, getLocale()) })}
			{#if !isHouseholdOwner(householdRole)}
				{t('household.ownerOnly')}
			{/if}
		</p>
	{/if}

	{#if isOwner}
		<div class="danger-zone">
			<h3 class="subsection-title danger-title">{t('household.dangerZone')}</h3>
			<p class="danger-note">
				{t('household.deleteWarning')}
			</p>
			{#if otherMemberCount > 0}
				<p class="danger-warning" role="status">
					{t('household.otherMembersLoseAccess', { count: otherMemberCount })}
				</p>
			{/if}
			<Button type="button" variant="danger" class="danger-btn" onclick={openDeleteModal}>
				{t('household.deleteHousehold')}
			</Button>
		</div>
	{/if}
</div>

<DeleteSafetyModal
	open={deleteModalOpen}
	onClose={closeDeleteModal}
	tier={4}
	context="householdDelete"
	copyOptions={{
		confirmationTarget: household.name,
		otherMemberCount
	}}
	confirmationTarget={household.name}
	formAction="?/deleteHousehold"
	submitEnhance={bindSubmitting((v) => (deleteSubmitting = v))}
	confirmLoading={deleteSubmitting}
	loadingLabel={t('household.deletingHousehold')}
>
	{#snippet fields()}
		<input type="hidden" name="householdId" value={household.id} />
	{/snippet}
</DeleteSafetyModal>

<style>
	.household-panel {
		padding: var(--space-md) var(--space-lg);
	}

	.household-intro {
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-border);
		margin-bottom: var(--space-md);
	}

	.household-name {
		margin: 0;
		font-weight: 700;
		font-size: 1rem;
	}

	.subsection {
		margin-bottom: var(--space-md);
	}

	.subsection:last-child {
		margin-bottom: 0;
	}

	.subsection-title {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.subsection-note,
	.role-note {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.84rem;
		line-height: 1.45;
	}

	.member-list,
	.pending-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.member-list li,
	.pending-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.member-list li.last,
	.pending-list li:last-child {
		border-bottom: none;
	}

	.member-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.member-email {
		color: var(--color-text);
		font-weight: 600;
	}

	.member-display {
		color: var(--color-text-muted);
		font-size: 0.82rem;
	}

	.member-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	.member-role {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.inline-form {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.inline-form select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		background: var(--color-surface);
		color: var(--color-text);
	}

	.invite-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.invite-form label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.invite-form input,
	.invite-form select {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.field-error {
		color: var(--color-danger);
		font-size: 0.82rem;
	}

	.invite-link-box {
		margin-bottom: var(--space-md);
		padding: var(--space-sm);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.invite-link-label {
		margin: 0 0 var(--space-sm);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.invite-link-row {
		display: flex;
		gap: var(--space-sm);
	}

	.invite-link-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		background: var(--color-surface);
		color: var(--color-text);
	}

	.danger-zone {
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border));
	}

	.danger-title {
		color: var(--color-danger);
	}

	.danger-note,
	.danger-warning {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.84rem;
		line-height: 1.45;
	}

	.danger-warning {
		color: var(--color-danger);
		font-weight: 600;
	}

	:global(.danger-btn) {
		width: 100%;
	}

	@media (max-width: 640px) {
		.member-list li,
		.pending-list li {
			flex-direction: column;
			align-items: flex-start;
		}

		.member-actions {
			width: 100%;
			justify-content: flex-start;
		}

		.invite-link-row {
			flex-direction: column;
		}
	}
</style>
