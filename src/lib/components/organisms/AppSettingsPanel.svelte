<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import LanguageSwitcher from '$lib/components/molecules/LanguageSwitcher.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { ONBOARDING_REPLAY_EVENT, resetOnboarding } from '$lib/utils/onboarding';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import { t } from '$lib/i18n';
	import type { Pet } from '$lib/domain/pet';

	interface Props {
		userId: string | undefined;
		petsEnabled: boolean;
		pets: Pet[];
	}

	let { userId, petsEnabled, pets }: Props = $props();

	let petModalOpen = $state(false);
	let petsToggleSubmitting = $state(false);
	let addPetSubmitting = $state(false);

	function replayOnboardingGuide() {
		if (!userId) {
			return;
		}
		resetOnboarding(userId);
		if (browser) {
			window.dispatchEvent(new Event(ONBOARDING_REPLAY_EVENT));
		}
	}
</script>

<SettingsSection
	id="settings-app"
	title={t('settings.app.title')}
	description={t('settings.app.description')}
>
	<SettingsRow
		title={t('settings.language.title')}
		note={t('settings.language.description')}
		last={false}
	>
		<LanguageSwitcher />
	</SettingsRow>

	<details class="settings-disclosure">
		<summary class="settings-disclosure-summary">{t('settings.more.summary')}</summary>
		<div class="settings-disclosure-body">
			<SettingsRow title={t('settings.pets.title')} note={t('settings.pets.note')} last={false}>
				<form
					method="POST"
					action="?/togglePets"
					use:enhance={bindSubmitting((v) => (petsToggleSubmitting = v))}
				>
					<input type="hidden" name="enabled" value={petsEnabled ? 'false' : 'true'} />
					<Button
						type="submit"
						variant={petsEnabled ? 'ghost' : 'primary'}
						loading={petsToggleSubmitting}
						loadingLabel={t('common.saving')}
					>
						{petsEnabled ? t('settings.pets.disable') : t('settings.pets.enable')}
					</Button>
				</form>
				{#if petsEnabled}
					<button type="button" class="text-action" onclick={() => (petModalOpen = true)}>
						{t('settings.pets.add')}
					</button>
				{/if}
			</SettingsRow>

			{#if petsEnabled}
				<div class="pet-panel">
					<h3 class="pet-heading">{t('settings.pets.heading')}</h3>
					{#if pets.length === 0}
						<p class="pet-empty">{t('settings.pets.empty')}</p>
					{:else}
						<ul class="pet-list">
							{#each pets as pet, index (pet.id)}
								<li class:last={index === pets.length - 1}>
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
										label={t('settings.pets.remove')}
										ariaLabel={t('settings.pets.removeNamed', { name: pet.name })}
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
				href="/install-app"
				title={t('settings.installApp.title')}
				note={t('settings.installApp.note')}
				last={false}
			/>
			<SettingsRow title={t('settings.onboarding.title')} note={t('settings.onboarding.note')} last>
				<button type="button" class="text-action" onclick={replayOnboardingGuide}>
					{t('settings.onboarding.start')}
				</button>
			</SettingsRow>
		</div>
	</details>
</SettingsSection>

<Modal
	open={petModalOpen}
	onClose={() => (petModalOpen = false)}
	variant="center"
	title={t('settings.pets.modalTitle')}
	panelClass="pet-settings-panel"
>
	<form
		method="POST"
		action="?/addPet"
		class="pet-form"
		use:enhance={bindSubmitting((v) => (addPetSubmitting = v))}
	>
		<label>
			{t('common.name')}
			<input name="name" required maxlength="80" placeholder={t('settings.pets.namePlaceholder')} />
		</label>
		<label>
			{t('settings.pets.speciesOptional')}
			<input name="species" maxlength="80" placeholder={t('settings.pets.speciesPlaceholder')} />
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

<style>
	.settings-disclosure {
		border-top: 1px solid var(--color-border);
	}

	.settings-disclosure-summary {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: var(--space-md) var(--space-lg);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
		list-style: none;
	}

	.settings-disclosure-summary::-webkit-details-marker {
		display: none;
	}

	.settings-disclosure-summary::after {
		content: '▾';
		margin-left: auto;
		color: var(--color-text-muted);
		transition: transform 0.15s;
	}

	.settings-disclosure[open] .settings-disclosure-summary::after {
		transform: rotate(180deg);
	}

	.settings-disclosure-body :global(.settings-row:last-child) {
		border-bottom: none;
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
