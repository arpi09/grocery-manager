<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import PetFoodModal from '$lib/components/organisms/PetFoodModal.svelte';

	let { data } = $props();
	let petFoodModalOpen = $state(false);
</script>

<AppLayout user={data.user}>
	<AppHeader title="Husdjur" subtitle="Dina husdjur hemma" />

	<PageContainer>
	<section class="pets">
		<div class="pets-head">
			<h2>Pets at home</h2>
			<Button type="button" onclick={() => (petFoodModalOpen = true)}>Scan pet food</Button>
		</div>

		{#if data.pets.length === 0}
			<p>Inga husdjur tillagda an. Ga till Settings for att lagga till.</p>
		{:else}
			<ul>
				{#each data.pets as pet}
					<li>
						<strong>{pet.name}</strong>
						{#if pet.species}
							<span>{pet.species}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="pets food">
		<h2>Pet food inventory</h2>
		{#if data.petFood.length === 0}
			<p>No pet food added yet. Use the scan button above.</p>
		{:else}
			<ul>
				{#each data.petFood as food}
					<li>
						<div>
							<strong>{food.name}</strong>
							<span>{food.quantity}{food.unit ? ` ${food.unit}` : ''}</span>
						</div>
						<form method="POST" action="?/deletePetFood">
							<input type="hidden" name="id" value={food.id} />
							<Button type="submit" variant="danger">Delete</Button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<PetFoodModal
		open={petFoodModalOpen}
		onClose={() => (petFoodModalOpen = false)}
		pets={data.pets}
		submitAction="?/addPetFood"
	/>
	</PageContainer>
</AppLayout>

<style>
	.pets {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		margin-bottom: var(--space-md);
	}

	.pets-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	p {
		margin: 0;
		color: var(--color-text-muted);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-sm);
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	span {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}
</style>
