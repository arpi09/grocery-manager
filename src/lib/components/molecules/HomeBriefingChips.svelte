<script lang="ts">
	import MarqueeText from '$lib/components/atoms/MarqueeText.svelte';
	import type {
		HomeBriefingChipId,
		HomeBriefingChipPresentation,
		HomeBriefingMessagePresentation
	} from '$lib/domain/home-briefing-presenter';
	import { LOCATIONS, LOCATION_COLORS } from '$lib/domain/location';
	import { t } from '$lib/i18n';

	interface Props {
		chips: HomeBriefingChipPresentation[];
		shoppingHref: string;
		storageHref: string;
		recipeHref?: string | null;
		funFactHref?: string;
		onChipTap?: (chip: HomeBriefingChipId) => void;
	}

	let {
		chips,
		shoppingHref,
		storageHref,
		recipeHref = null,
		funFactHref = '/statistik',
		onChipTap
	}: Props = $props();

	function chipHref(id: HomeBriefingChipId): string {
		switch (id) {
			case 'shopping':
				return shoppingHref;
			case 'storage':
				return storageHref;
			case 'eat':
				return recipeHref ?? '/recept';
			case 'funFact':
				return funFactHref;
		}
	}

	function chipAriaKey(id: HomeBriefingChipId) {
		return `home.v6.chips.${id}Aria` as const;
	}

	function hintText(chip: HomeBriefingChipPresentation): string {
		if (!chip.hint) return '';
		if ('kind' in chip.hint && chip.hint.kind === 'recipeTitle') {
			return chip.hint.title;
		}
		const messageHint = chip.hint as HomeBriefingMessagePresentation;
		return t(messageHint.key, messageHint.params);
	}

	function chipAriaLabel(chip: HomeBriefingChipPresentation): string {
		const action = t(chipAriaKey(chip.id));
		const title = t(chip.titleKey);
		const hint = hintText(chip);
		if (hint) return `${action}: ${title}. ${hint}`;
		return `${action}: ${title}`;
	}
</script>

<section class="home-briefing-chips" aria-labelledby="home-briefing-chips-label" data-testid="home-v2-chips">
	<p id="home-briefing-chips-label" class="section-label">{t('home.v6.chips.sectionLabel')}</p>
	<div class="chip-grid">
		{#each chips as chip (chip.id)}
			<a
				class="chip-card"
				href={chipHref(chip.id)}
				data-testid="home-v2-chip-{chip.id}"
				aria-label={chipAriaLabel(chip)}
				onclick={() => onChipTap?.(chip.id)}
			>
				<MarqueeText class="chip-title" text={t(chip.titleKey)} />
				{#if chip.id === 'storage' && chip.zoneCounts}
					<span class="zone-hints" aria-hidden="true">
						{#each LOCATIONS as location (location)}
							<span class="zone-count" style={`--zone-color: ${LOCATION_COLORS[location]}`}>
								<span class="zone-dot" aria-hidden="true"></span>
								{chip.zoneCounts[location]}
							</span>
						{/each}
					</span>
				{:else if hintText(chip)}
					<MarqueeText class="chip-hint" text={hintText(chip)} />
				{/if}
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

	.chip-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-sm);
	}

	.chip-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		min-height: var(--touch-target-min, 3rem);
		padding: 12px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		text-decoration: none;
		box-shadow: var(--shadow-sm);
	}

	.chip-card :global(.chip-title) {
		font-size: var(--font-size-label, 0.75rem);
		font-weight: var(--font-weight-label, 700);
		letter-spacing: var(--letter-spacing-label, 0.04em);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.chip-card :global(.chip-hint) {
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
		line-height: 1.3;
	}

	.chip-card:hover :global(.marquee-track.animate),
	.chip-card:focus-visible :global(.marquee-track.animate) {
		animation-play-state: paused;
	}

	.zone-hints {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}

	.zone-count {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
		line-height: 1;
	}

	.zone-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--zone-color);
		flex-shrink: 0;
	}

	.chip-card:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
