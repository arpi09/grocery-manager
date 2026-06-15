<script lang="ts">
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import { formatCadenceWeekday, type HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		shoppingCadence?: HouseholdShoppingCadence | null;
		intelligence?: HomeIntelligenceSnapshot;
	}

	let { shoppingCadence = null, intelligence = { replenishment: [], pantryHealth: [], waste: null, dedupeByKey: {} } }: Props =
		$props();

	const locale = $derived(getLocale());

	const lines = $derived.by(() => {
		const result: string[] = [];

		if (shoppingCadence) {
			const weekday = formatCadenceWeekday(shoppingCadence.weekday, locale);
			result.push(
				shoppingCadence.storeLabel
					? t('home.cadenceLineStore', { weekday, store: shoppingCadence.storeLabel })
					: t('home.cadenceLine', { weekday })
			);
		}

		const topReplenishment = intelligence.replenishment[0];
		if (topReplenishment?.name) {
			result.push(t('home.memory.replenishmentHint', { name: topReplenishment.name }));
		}

		return result.slice(0, 3);
	});
</script>

{#if lines.length > 0}
	<section class="memory-lines" aria-label={t('home.memory.ariaLabel')} data-testid="home-memory-lines">
		{#each lines as line (line)}
			<p class="memory-line">{line}</p>
		{/each}
	</section>
{/if}

<style>
	.memory-lines {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: 0 var(--space-xs);
	}

	.memory-line {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
