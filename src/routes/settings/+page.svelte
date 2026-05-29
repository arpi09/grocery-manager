<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import HouseholdSettingsPanel from '$lib/components/organisms/HouseholdSettingsPanel.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';

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
</script>

<AppLayout user={data.user}>
	<AppHeader
		title="Inställningar"
		subtitle="Hantera konto, hushåll och appinställningar"
	/>

	<div class="settings-page">
		<SettingsSection title="Konto" description="Ditt inloggade konto och profil">
			<SettingsRow title={data.user?.email ?? ''} note="Inloggad e-post" />
			<SettingsRow href="/profile" title="Redigera profil" note="Namn, bild och tema" last />
		</SettingsSection>

		{#if data.household}
			<SettingsSection
				title="Hushåll"
				description="Delat hushåll, medlemmar och inbjudningar"
			>
				<HouseholdSettingsPanel
					household={data.household}
					isOwner={data.isOwner}
					householdRole={data.householdRole}
					pendingInvites={data.pendingInvites}
					currentUserId={data.user?.id ?? ''}
					{householdError}
					{inviteFieldErrors}
					{inviteLink}
					copiedInviteLink={copiedInviteLink}
					onCopyInviteLink={copyInviteLink}
				/>
			</SettingsSection>
		{/if}

		<SettingsSection title="App" description="Funktioner och preferenser">
			<SettingsRow
				title="Husdjur"
				note="Aktivera för att visa Husdjur i menyn och hantera dina husdjur."
				last={!data.petsEnabled}
			>
				<form method="POST" action="?/togglePets">
					<input type="hidden" name="enabled" value={data.petsEnabled ? 'false' : 'true'} />
					<Button type="submit" variant={data.petsEnabled ? 'secondary' : 'primary'}>
						{data.petsEnabled ? 'Stäng av' : 'Slå på'}
					</Button>
				</form>
				{#if data.petsEnabled}
					<Button type="button" variant="secondary" onclick={() => (petModalOpen = true)}>
						+ Lägg till husdjur
					</Button>
				{/if}
			</SettingsRow>

			{#if data.petsEnabled}
				<div class="pet-panel">
					<h3 class="pet-heading">Dina husdjur</h3>
					{#if data.pets.length === 0}
						<p class="pet-empty">Inga husdjur tillagda ännu.</p>
					{:else}
						<ul class="pet-list">
							{#each data.pets as pet, index (pet.id)}
								<li class:last={index === data.pets.length - 1}>
									<div>
										<strong>{pet.name}</strong>
										{#if pet.species}
											<span class="species">{pet.species}</span>
										{/if}
									</div>
									<form method="POST" action="?/deletePet">
										<input type="hidden" name="id" value={pet.id} />
										<Button type="submit" variant="danger">Ta bort</Button>
									</form>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</SettingsSection>
	</div>

	{#if petModalOpen}
		<div class="overlay" role="dialog" aria-modal="true" aria-label="Lägg till husdjur">
			<div class="modal">
				<div class="modal-head">
					<h2>Lägg till husdjur</h2>
					<button type="button" class="close" onclick={() => (petModalOpen = false)} aria-label="Stäng">
						×
					</button>
				</div>
				<form method="POST" action="?/addPet" class="pet-form">
					<label>
						Namn
						<input name="name" required maxlength="80" placeholder="t.ex. Luna" />
					</label>
					<label>
						Art (valfritt)
						<input name="species" maxlength="80" placeholder="t.ex. Hund, Katt" />
					</label>
					<div class="modal-actions">
						<Button type="button" variant="secondary" onclick={() => (petModalOpen = false)}>
							Avbryt
						</Button>
						<Button type="submit">Spara</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</AppLayout>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: 0;
		max-width: var(--max-width);
	}

	.pet-panel {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.pet-heading {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.pet-empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.86rem;
	}

	.pet-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.pet-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
		border-bottom: 1px solid var(--color-border);
	}

	.pet-list li.last {
		border-bottom: none;
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
		font-size: 1.1rem;
		line-height: 1;
		color: var(--color-text-muted);
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
		background: var(--color-surface);
		color: var(--color-text);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	@media (max-width: 640px) {
		.pet-list li {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
