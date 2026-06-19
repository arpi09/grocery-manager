<script lang="ts">
import type { HomeBriefingMessagePresentation } from '$lib/domain/home-briefing-presenter';
import type { MessageKey } from '$lib/i18n/messages';
import { t } from '$lib/i18n';

	interface ChipLink {
		href: string;
		labelKey: MessageKey;
		labelParams?: Record<string, string | number>;
		ariaKey: MessageKey;
		accent?: boolean;
		onTap?: () => void;
	}

	interface Props {
		useSoon: HomeBriefingMessagePresentation;
		shopping: { useTripName: boolean; tripName: string };
		useSoonHref: string;
		shoppingHref: string;
		householdHref: string;
		pantryHref: string;
		showUseSoon?: boolean;
		onChipTap?: (chip: 'useSoon' | 'shopping' | 'household' | 'pantry') => void;
	}

	let {
		useSoon,
		shopping,
		useSoonHref,
		shoppingHref,
		householdHref,
		pantryHref,
		showUseSoon = true,
		onChipTap
	}: Props = $props();

	const chips = $derived.by((): ChipLink[] => {
		const list: ChipLink[] = [];

		if (showUseSoon && (useSoon.params.count as number) > 0) {
			list.push({
				href: useSoonHref,
				labelKey: useSoon.key,
				labelParams: useSoon.params,
				ariaKey: 'home.v6.chips.useSoonAria',
				accent: true,
				onTap: () => onChipTap?.('useSoon')
			});
		}

		list.push({
			href: shoppingHref,
			labelKey: shopping.useTripName ? 'home.v6.chips.shopping' : 'home.v6.chips.shoppingDefault',
			labelParams: shopping.useTripName ? { tripName: shopping.tripName } : undefined,
			ariaKey: 'home.v6.chips.shoppingAria',
			onTap: () => onChipTap?.('shopping')
		});

		list.push({
			href: householdHref,
			labelKey: 'home.v6.chips.householdSynced',
			ariaKey: 'home.v6.chips.householdAria',
			onTap: () => onChipTap?.('household')
		});

		list.push({
			href: pantryHref,
			labelKey: 'home.v6.chips.pantry',
			ariaKey: 'home.v6.chips.pantryAria',
			onTap: () => onChipTap?.('pantry')
		});

		return list;
	});
</script>

<section class="home-briefing-chips" aria-labelledby="home-briefing-chips-label" data-testid="home-v2-chips">
	<p id="home-briefing-chips-label" class="section-label">{t('home.v6.chips.sectionLabel')}</p>
	<div class="chips">
		{#each chips as chip (chip.labelKey + (chip.labelParams?.tripName ?? ''))}
			<a
				class={['chip', chip.accent ? 'accent' : ''].filter(Boolean).join(' ')}
				href={chip.href}
				aria-label={t(chip.ariaKey)}
				onclick={() => chip.onTap?.()}
			>
				{chip.labelParams ? t(chip.labelKey, chip.labelParams) : t(chip.labelKey)}
			</a>
		{/each}
	</div>
</section>

<style>
	.section-label {
		margin: 0 0 var(--space-sm);
		font-size: var(--font-size-label, 0.75rem);
		font-weight: var(--font-weight-label, 700);
		letter-spacing: var(--letter-spacing-label, 0.06em);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min, 3rem);
		padding: 10px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
		text-decoration: none;
	}

	.chip.accent {
		background: color-mix(in srgb, var(--color-accent) 15%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
	}

	.chip:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
