<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import {
		householdRoleLabel,
		inviteRoleLabel,
		isHouseholdOwner
	} from '$lib/domain/household';
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
		onCopyInviteLink,
		copiedInviteLink
	}: Props = $props();

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
		<h3 class="subsection-title">Medlemmar</h3>
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
						<span class="member-role">{householdRoleLabel(member.role)}</span>
						{#if canManageMember(member.userId, member.role)}
							<form method="POST" action="?/updateMemberRole" class="inline-form">
								<input type="hidden" name="userId" value={member.userId} />
								<select name="role" aria-label="Roll för {member.email}">
									<option value="owner" selected={member.role === 'owner'}>Ägare</option>
									<option value="editor" selected={member.role === 'editor'}>Redigera</option>
									<option value="viewer" selected={member.role === 'viewer'}>Visa</option>
								</select>
								<Button type="submit" variant="secondary">Spara</Button>
							</form>
							<form method="POST" action="?/removeMember" class="inline-form">
								<input type="hidden" name="userId" value={member.userId} />
								<Button type="submit" variant="danger">Ta bort</Button>
							</form>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>

	{#if isOwner}
		<div class="subsection">
			<h3 class="subsection-title">Bjud in</h3>
			<p class="subsection-note">
				Kopiera länken och skicka till personen. Ingen e-post skickas automatiskt.
			</p>

			{#if householdError}
				<p class="banner error" role="alert">{householdError}</p>
			{/if}

			<form method="POST" action="?/createInvite" class="invite-form">
				<label>
					E-post
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
					Roll
					<select name="role" required>
						<option value="editor">{inviteRoleLabel('editor')}</option>
						<option value="viewer">{inviteRoleLabel('viewer')}</option>
					</select>
				</label>
				<Button type="submit">Skicka inbjudan</Button>
			</form>

			{#if inviteLink}
				<div class="invite-link-box">
					<p class="invite-link-label">Inbjudningslänk</p>
					<div class="invite-link-row">
						<input readonly value={inviteLink} class="invite-link-input" />
						<Button type="button" variant="secondary" onclick={() => onCopyInviteLink(inviteLink)}>
							{copiedInviteLink ? 'Kopierad!' : 'Kopiera'}
						</Button>
					</div>
				</div>
			{/if}

			{#if pendingInvites.length > 0}
				<h3 class="subsection-title">Väntande inbjudningar</h3>
				<ul class="pending-list">
					{#each pendingInvites as invite (invite.id)}
						<li>
							<div>
								<span class="member-email">{invite.email}</span>
								<span class="member-role">{inviteRoleLabel(invite.role)}</span>
							</div>
							<form method="POST" action="?/revokeInvite">
								<input type="hidden" name="inviteId" value={invite.id} />
								<Button type="submit" variant="danger">Återkalla</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if householdRole}
		<p class="role-note">
			Din roll: {householdRoleLabel(householdRole)}.
			{#if !isHouseholdOwner(householdRole)}
				Endast ägare kan bjuda in och hantera medlemmar.
			{/if}
		</p>
	{/if}
</div>

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

	.banner {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
	}

	.banner.error {
		background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
		color: var(--color-danger);
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
