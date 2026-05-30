<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import HouseholdSettingsPanel from '$lib/components/organisms/HouseholdSettingsPanel.svelte';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { browser } from '$app/environment';
	import { ONBOARDING_REPLAY_EVENT, resetOnboarding } from '$lib/utils/onboarding';
	import LanguageSwitcher from '$lib/components/molecules/LanguageSwitcher.svelte';
	import { t } from '$lib/i18n';

	let { data, form } = $props();
	let petModalOpen = $state(false);
	let copiedInviteLink = $state(false);
	let petsToggleSubmitting = $state(false);
	let addPetSubmitting = $state(false);

	const inviteLink = $derived(form?.inviteLink ?? null);
	const inviteEmailWarning = $derived(form?.inviteEmailWarning ?? null);
	const householdError = $derived(form?.householdError ?? null);
	const inviteFieldErrors = $derived(form?.inviteErrors ?? {});

	async function copyInviteLink(link: string) {
		await navigator.clipboard.writeText(link);
		copiedInviteLink = true;
		setTimeout(() => {
			copiedInviteLink = false;
		}, 2000);
	}

	function replayOnboardingGuide() {
		resetOnboarding();
		if (browser) {
			window.dispatchEvent(new Event(ONBOARDING_REPLAY_EVENT));
		}
	}
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('settings.title')}
		subtitle={t('settings.subtitle')}
	/>

	<PageContainer>
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
					{inviteEmailWarning}
					copiedInviteLink={copiedInviteLink}
					onCopyInviteLink={copyInviteLink}
				/>
			</SettingsSection>
		{/if}

		<SettingsSection title="App" description="Funktioner och preferenser">
			<SettingsRow
				title={t('settings.language.title')}
				note={t('settings.language.description')}
				last={false}
			>
				<LanguageSwitcher />
			</SettingsRow>

			<SettingsRow
				title="Husdjur"
				note="Aktivera för att visa Husdjur i menyn och hantera dina husdjur."
				last={false}
			>
				<form
					method="POST"
					action="?/togglePets"
					use:enhance={bindSubmitting((v) => (petsToggleSubmitting = v))}
				>
					<input type="hidden" name="enabled" value={data.petsEnabled ? 'false' : 'true'} />
					<Button
						type="submit"
						variant={data.petsEnabled ? 'secondary' : 'primary'}
						loading={petsToggleSubmitting}
						loadingLabel={t('common.saving')}
					>
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
									<DeleteConfirmButton
										tier={3}
										context="pet"
										copyOptions={{ itemName: pet.name }}
										action="?/deletePet"
										label="Ta bort"
										ariaLabel={`Ta bort husdjur ${pet.name}`}
									>
										<input type="hidden" name="id" value={pet.id} />
									</DeleteConfirmButton>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
			<SettingsRow
				title="Visa introduktion igen"
				note="Gå igenom välkomstguiden för appen."
				last
			>
				<Button type="button" variant="secondary" onclick={replayOnboardingGuide}>
					Starta guide
				</Button>
			</SettingsRow>
		</SettingsSection>
	</div>
	</PageContainer>

	<Modal
		open={petModalOpen}
		onClose={() => (petModalOpen = false)}
		variant="center"
		title="Lägg till husdjur"
		panelClass="pet-settings-panel"
	>
		<form
			method="POST"
			action="?/addPet"
			class="pet-form"
			use:enhance={bindSubmitting((v) => (addPetSubmitting = v))}
		>
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
					{t('common.cancel')}
				</Button>
				<Button type="submit" loading={addPetSubmitting} loadingLabel={t('common.saving')}>
					{t('common.save')}
				</Button>
			</div>
		</form>
	</Modal>
</AppLayout>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: 0;
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

	:global(.pet-settings-panel) {
		width: min(460px, calc(100vw - 2 * var(--space-md)));
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
