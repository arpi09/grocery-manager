<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import starterItems from '$lib/data/starter-pack.json';
	import type { StorageLocation } from '$lib/domain/location';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
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

	const categories = $derived([
		{ id: 'kyl', label: t('onboarding.fridgeShort') },
		{ id: 'frys', label: t('onboarding.freezerShort') },
		{ id: 'skafferi', label: t('onboarding.cupboardShort') }
	] as const);

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
	<p class="lead">{t('starter.lead')}</p>

	<div class="defaults">
		<label>
			{t('starter.defaultLocation')}
			<select bind:value={defaultLocation}>
				<option value="fridge">{locationLabel(getLocale(), 'fridge')}</option>
				<option value="freezer">{locationLabel(getLocale(), 'freezer')}</option>
				<option value="cupboard">{locationLabel(getLocale(), 'cupboard')}</option>
			</select>
		</label>
	</div>

	<div class="category-actions">
		{#each categories as cat (cat.id)}
			<button type="button" class="link-btn" onclick={() => toggleCategory(cat.id, true)}>
				{t('starter.allCategory', { label: cat.label })}
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
						<span class="cat">{locationLabel(getLocale(), item.location)}</span>
					</label>
					{#if selected[index]}
						<input type="hidden" name={`name_${index}`} value={item.name} />
						<input type="hidden" name={`useDefault_${index}`} value="1" />
					{/if}
				</li>
			{/each}
		</ul>

		<div class="actions">
			<Button type="button" variant="secondary" onclick={skip}>{t('common.skip')}</Button>
			<Button type="submit" disabled={selectedCount === 0}>
				{t('starter.addCount', { count: selectedCount })}
			</Button>
		</div>
	</form>

	<p class="hint">
		{t('starter.hint')}
		<a href="/scan">{t('starter.scanLink')}</a>.
	</p>
</section>

<style>
	.lead {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.defaults label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		margin-bottom: var(--space-md);
	}

	.defaults select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
	}

	.category-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.link-btn {
		background: none;
		border: none;
		color: var(--color-primary);
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		font-size: 0.875rem;
	}

	.item-list {
		list-style: none;
		margin: 0 0 var(--space-md);
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.item-list li {
		border-bottom: 1px solid var(--color-border);
		padding: var(--space-sm) var(--space-md);
	}

	.item-list li:last-child {
		border-bottom: none;
	}

	.item-list label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
	}

	.cat {
		margin-left: auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.hint {
		margin-top: var(--space-md);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
