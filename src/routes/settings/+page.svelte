<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';

	let { data } = $props();
	let petModalOpen = $state(false);
</script>

<AppLayout>
	<AppHeader title="Settings" showPetsNav={Boolean(data.user?.petsEnabled)} />
	<Card>
		<p class="email">Signed in as <strong>{data.user?.email}</strong></p>

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

		.pet-list li {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-sm);
		}
	}
</style>
