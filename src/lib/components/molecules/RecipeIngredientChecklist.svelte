<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	interface Props {
		recipeId: string;
		fromStock: string[];
		missing: string[];
	}

	let { recipeId, fromStock, missing }: Props = $props();

	const storageKey = $derived(`recipe-checklist:${recipeId}`);

	type CheckState = Record<string, boolean>;

	let checked = $state<CheckState>({});

	function loadChecked(): CheckState {
		if (!browser) {
			return {};
		}
		try {
			const raw = localStorage.getItem(storageKey);
			if (!raw) {
				return {};
			}
			const parsed = JSON.parse(raw) as unknown;
			if (!parsed || typeof parsed !== 'object') {
				return {};
			}
			return parsed as CheckState;
		} catch {
			return {};
		}
	}

	function persistChecked(state: CheckState) {
		if (!browser) {
			return;
		}
		try {
			localStorage.setItem(storageKey, JSON.stringify(state));
		} catch {
			// cosmetic only
		}
	}

	$effect(() => {
		checked = loadChecked();
	});

	function toggleIngredient(name: string) {
		const next = { ...checked, [name]: !checked[name] };
		checked = next;
		persistChecked(next);
	}

	const allIngredients = $derived([
		...fromStock.map((name) => ({ name, kind: 'stock' as const })),
		...missing.map((name) => ({ name, kind: 'missing' as const }))
	]);
</script>

<section class="checklist" aria-label={t('recipe.ingredientsAria')}>
	<h2 class="checklist-heading">{t('recipe.ingredientsChecklistTitle')}</h2>
	<ul class="checklist-list">
		{#each allIngredients as item (item.name)}
			<li>
				<label class="check-row" class:missing={item.kind === 'missing'}>
					<input
						type="checkbox"
						checked={Boolean(checked[item.name])}
						onchange={() => toggleIngredient(item.name)}
					/>
					<span class="check-label">{item.name}</span>
					{#if item.kind === 'missing'}
						<span class="missing-tag">{t('planer.missingLabel')}</span>
					{/if}
				</label>
			</li>
		{/each}
	</ul>
</section>

<style>
	.checklist {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.checklist-heading {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.checklist-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-height: 2.75rem;
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		cursor: pointer;
	}

	.check-row.missing {
		border-color: color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
	}

	.check-row input {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
		accent-color: var(--color-primary);
	}

	.check-label {
		flex: 1;
		min-width: 0;
		font-size: 0.9375rem;
	}

	.missing-tag {
		flex-shrink: 0;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-warning);
	}
</style>
