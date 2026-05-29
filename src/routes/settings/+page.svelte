<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import {
		householdRoleLabel,
		inviteRoleLabel,
		isHouseholdOwner
	} from '$lib/domain/household';

	let { data, form } = $props();
	let petModalOpen = $state(false);
	let copiedInviteLink = $state(false);

	const inviteLink = $derived(form?.inviteLink ?? null);
	const householdError = $derived(form?.householdError ?? null);
	const inviteFieldErrors = $derived(form?.inviteErrors ?? {});

	async function copyInviteLink(link: string) {
		await navigator.clipboard.writeText(link);
		copiedInviteLink = true;
		setTimeout(() => {
			copiedInviteLink = false;
		}, 2000);
	}

	function canManageMember(memberUserId: string, memberRole: string) {
		if (!data.isOwner || memberUserId === data.user?.id) {
			return false;
		}
		if (memberRole === 'owner') {
			const ownerCount = data.household?.members.filter((m) => m.role === 'owner').length ?? 0;
			return ownerCount > 1;
		}
		return true;
	}
</script>

<AppLayout user={data.user}>
	<AppHeader title="Inställningar" />
	<Card>
		<p class="email">Inloggad som <strong>{data.user?.email}</strong></p>

		{#if data.household}
			<section class="household-section" aria-labelledby="household-heading">
				<h2 id="household-heading" class="household-title">Delat hushåll</h2>
				<p class="household-name">{data.household.name}</p>

				<h3 class="subsection-title">Medlemmar</h3>
				<ul class="household-members">
					{#each data.household.members as member}
						<li>
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

				{#if data.isOwner}
					<h3 class="subsection-title">Bjud in</h3>
					<p class="household-note">
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
								<Button type="button" variant="secondary" onclick={() => copyInviteLink(inviteLink)}>
									{copiedInviteLink ? 'Kopierad!' : 'Kopiera'}
								</Button>
							</div>
						</div>
					{/if}

					{#if data.pendingInvites.length > 0}
						<h3 class="subsection-title">Väntande inbjudningar</h3>
						<ul class="pending-invites">
							{#each data.pendingInvites as invite}
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
				{:else if data.householdRole}
					<p class="household-note">
						Din roll: {householdRoleLabel(data.householdRole)}.
						{#if !isHouseholdOwner(data.householdRole)}
							Endast ägare kan bjuda in och hantera medlemmar.
						{/if}
					</p>
				{/if}
			</section>
		{/if}

		<div class="setting-row">
			<div>
				<p class="setting-title">Has pets at home</p>
				<p class="setting-note">Enable this to unlock the Husdjur section in navigation.</p>
			</div>

			<div class="setting-actions">
				<form method="POST" action="?/togglePets">
					<input type="hidden" name="enabled" value={data.petsEnabled ? 'false' : 'true'} />
					<Button type="submit" variant={data.petsEnabled ? 'secondary' : 'primary'}>
						{data.petsEnabled ? 'Turn off' : 'Turn on'}
					</Button>
				</form>
				{#if data.petsEnabled}
					<Button type="button" variant="secondary" onclick={() => (petModalOpen = true)}>
						+ Add pet
					</Button>
				{/if}
			</div>
		</div>

		{#if data.petsEnabled}
			<div class="pet-list">
				<h3>Your pets</h3>
				{#if data.pets.length === 0}
					<p class="pet-empty">No pets added yet.</p>
				{:else}
					<ul>
						{#each data.pets as pet}
							<li>
								<div>
									<strong>{pet.name}</strong>
									{#if pet.species}
										<span class="species">{pet.species}</span>
									{/if}
								</div>
								<form method="POST" action="?/deletePet">
									<input type="hidden" name="id" value={pet.id} />
									<Button type="submit" variant="danger">Delete</Button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		<form method="POST" action="/logout">
			<Button type="submit" variant="secondary" fullWidth>Sign out</Button>
		</form>
	</Card>

	{#if petModalOpen}
		<div class="overlay" role="dialog" aria-modal="true" aria-label="Add pet">
			<div class="modal">
				<div class="modal-head">
					<h2>Add pet</h2>
					<button type="button" class="close" onclick={() => (petModalOpen = false)}>X</button>
				</div>
				<form method="POST" action="?/addPet" class="pet-form">
					<label>
						Name
						<input name="name" required maxlength="80" placeholder="e.g. Luna" />
					</label>
					<label>
						Species (optional)
						<input name="species" maxlength="80" placeholder="e.g. Dog, Cat" />
					</label>
					<div class="modal-actions">
						<Button type="button" variant="secondary" onclick={() => (petModalOpen = false)}>
							Cancel
						</Button>
						<Button type="submit">Save pet</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</AppLayout>

<style>
	.email {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.household-section {
		margin-bottom: var(--space-lg);
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
	}

	.household-title {
		margin: 0 0 var(--space-sm);
		font-size: 1rem;
	}

	.household-name {
		margin: 0 0 var(--space-md);
		font-weight: 700;
	}

	.subsection-title {
		margin: var(--space-md) 0 var(--space-sm);
		font-size: 0.95rem;
	}

	.household-note {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.86rem;
	}

	.household-members,
	.pending-invites {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.household-members li,
	.pending-invites li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
		padding: var(--space-sm);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.member-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
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
	}

	.field-error {
		color: var(--color-danger);
		font-size: 0.82rem;
	}

	.invite-link-box {
		margin-bottom: var(--space-md);
		padding: var(--space-sm);
		background: var(--color-surface);
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
	}

	.banner {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
	}

	.banner.error {
		background: #fdeaea;
		color: var(--color-danger);
	}

	.setting-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-md);
	}

	.setting-title {
		margin: 0;
		font-weight: 700;
	}

	.setting-note {
		margin: 0.2rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.86rem;
	}

	.setting-actions {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.pet-list {
		margin-bottom: var(--space-md);
	}

	.pet-list h3 {
		margin: 0 0 var(--space-sm);
		font-size: 1rem;
	}

	.pet-empty {
		margin: 0;
		color: var(--color-text-muted);
	}

	.pet-list ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.pet-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: #fff;
	}

	.species {
		margin-left: var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(31, 42, 36, 0.45);
		display: grid;
		place-items: center;
		padding: var(--space-md);
		z-index: 50;
	}

	.modal {
		width: min(460px, 100%);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}

	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-md);
	}

	.modal-head h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.close {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		width: 2rem;
		height: 2rem;
		cursor: pointer;
	}

	.pet-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.pet-form label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.pet-form input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	@media (max-width: 760px) {
		.setting-row {
			flex-direction: column;
		}

		.setting-actions {
			flex-wrap: wrap;
		}

		.household-members li,
		.pending-invites li {
			flex-direction: column;
			align-items: flex-start;
		}

		.member-actions {
			width: 100%;
		}

		.invite-link-row {
			flex-direction: column;
		}

		.pet-list li {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-sm);
		}
	}
</style>
