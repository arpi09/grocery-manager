<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import starterItems from '$lib/data/starter-pack.json';
	import { LOCATION_LABELS, type StorageLocation } from '$lib/domain/location';
	import { dismissStarterPack } from '$lib/utils/starter-pack-dismiss';

	interface StarterItem {
		name: string;
		location: StorageLocation;
		category: string;
	}

	interface Props {
		returnTo: string;
	}

	let { returnTo }: Props = $props();

	const items = starterItems as StarterItem[];
	let selected = $state<Record<number, boolean>>(
		Object.fromEntries(items.map((_, i) => [i, false]))
	);
	let defaultLocation = $state<StorageLocation>('cupboard');

	const selectedCount = $derived(items.filter((_, i) => selected[i]).length);

	const categories = [
		{ id: 'kyl', label: 'Kyl' },
		{ id: 'frys', label: 'Frys' },
		{ id: 'skafferi', label: 'Skafferi' }
	] as const;

	function toggleCategory(category: string, checked: boolean) {
		const next = { ...selected };
		items.forEach((item, i) => {
			if (item.category === category) {
				next[i] = checked;
			}
		});
		selected = next;
	}

	function skip() {
		dismissStarterPack();
		window.location.href = returnTo;
	}
</script>

<section>
	<p class="lead">
		Snabbstart — markera det du redan har hemma. Du kan alltid skanna istället.
	</p>

	<div class="defaults">
		<label>
			Standardplats för valda:
			<select bind:value={defaultLocation}>
				<option value="fridge">{LOCATION_LABELS.fridge}</option>
				<option value="freezer">{LOCATION_LABELS.freezer}</option>
				<option value="cupboard">{LOCATION_LABELS.cupboard}</option>
			</select>
		</label>
	</div>

	<div class="category-actions">
		{#each categories as cat (cat.id)}
			<button type="button" class="link-btn" onclick={() => toggleCategory(cat.id, true)}>
				Alla {cat.label}
			</button>
		{/each}
	</div>

	<form
		method="POST"
		action="?/bulkCreate"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect') {
					dismissStarterPack();
				}
			};
		}}
	>
		<input type="hidden" name="returnTo" value={returnTo} />
		<input type="hidden" name="defaultLocation" value={defaultLocation} />

		<ul class="item-list">
			{#each items as item, index (index)}
				<li>
					<label>
						<input
							type="checkbox"
							name="selected"
							value={index}
							checked={selected[index]}
							onchange={(e) => {
								selected[index] = (e.currentTarget as HTMLInputElement).checked;
							}}
						/>
						<span>{item.name}</span>
						<span class="cat">{LOCATION_LABELS[item.location]}</span>
					</label>
					{#if selected[index]}
						<input type="hidden" name={`name_${index}`} value={item.name} />
						<input type="hidden" name={`useDefault_${index}`} value="1" />
					{/if}
				</li>
			{/each}
		</ul>

		<div class="actions">
			<Button type="button" variant="secondary" onclick={skip}>Hoppa över</Button>
			<Button type="submit" disabled={selectedCount === 0}>
				Lägg till {selectedCount} {selectedCount === 1 ? 'vara' : 'varor'}
			</Button>
		</div>
	</form>

	<p class="hint">Du kan alltid skanna istället via <a href="/scan">Skanna</a>.</p>
</section>

<style>
	.lead {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.defaults label {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.defaults select {
		padding: 0.4rem 0.6rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.category-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin: var(--space-md) 0;
	}

	.link-btn {
		border: none;
		background: var(--color-surface-muted);
		padding: 0.35rem 0.65rem;
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		color: var(--color-primary);
	}

	.item-list {
		list-style: none;
		margin: 0 0 var(--space-lg);
		padding: 0;
		max-height: 50vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.item-list label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.cat {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		gap: var(--space-sm);
	}

	.actions :global(.btn) {
		flex: 1;
	}

	.hint {
		margin-top: var(--space-md);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
