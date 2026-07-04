<script lang="ts">
	import { t } from '$lib/i18n';
	import type { StarterPackItem } from '$lib/utils/starter-pack-submit';

	interface Props {
		items: StarterPackItem[];
		selected: ReadonlySet<string>;
		onToggle: (name: string) => void;
	}

	let { items, selected, onToggle }: Props = $props();

	const groups = $derived(
		(
			[
				{ key: 'kyl', label: t('onboarding.activation.fill.groupFridge') },
				{ key: 'frys', label: t('onboarding.activation.fill.groupFreezer') },
				{ key: 'skafferi', label: t('onboarding.activation.fill.groupPantry') }
			] as const
		)
			.map((group) => ({
				...group,
				items: items.filter((item) => item.category === group.key)
			}))
			.filter((group) => group.items.length > 0)
	);
</script>

<div class="fill-chips" role="group" aria-label={t('onboarding.activation.fill.chipsAria')}>
	{#each groups as group (group.key)}
		<div class="chip-group">
			<p class="group-label">{group.label}</p>
			<div class="chip-row">
				{#each group.items as item (item.name)}
					<button
						type="button"
						class="chip motion-press"
						class:selected={selected.has(item.name)}
						aria-pressed={selected.has(item.name)}
						data-testid="activation-staple-chip"
						data-name={item.name}
						onclick={() => onToggle(item.name)}
					>
						{#if selected.has(item.name)}
							<svg class="chip-check" viewBox="0 0 12 12" aria-hidden="true">
								<path
									d="M2.5 6.2 5 8.6 9.5 3.5"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
						{item.name}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.fill-chips {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.chip-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.group-label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-height: 2.25rem;
		padding: 0.25rem var(--space-sm);
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color var(--motion-duration-fast) var(--motion-ease-out),
			border-color var(--motion-duration-fast) var(--motion-ease-out);
	}

	.chip.selected {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		border-color: var(--color-primary);
		color: var(--color-primary);
		font-weight: 600;
	}

	.chip-check {
		width: 0.75rem;
		height: 0.75rem;
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.chip {
			transition: none;
		}
	}
</style>
