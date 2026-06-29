<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { BrainTimelineEntry } from '$lib/domain/brain-timeline';
	import { formatBrainTimelineEntry } from '$lib/domain/brain-timeline';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		entries: BrainTimelineEntry[];
	}

	let { entries }: Props = $props();

	const locale = $derived(getLocale());
	const visible = $derived(entries.slice(0, 3));
</script>

{#if visible.length > 0}
	<Card class="brain-timeline" data-testid="brain-timeline-card">
		<h2 class="title">{t('brain.timeline.title')}</h2>
		<ul class="entries">
			{#each visible as entry (entry.id)}
				<li>{formatBrainTimelineEntry(entry, locale)}</li>
			{/each}
		</ul>
	</Card>
{/if}

<style>
	.title {
		margin: 0 0 var(--space-sm);
		font-size: 0.9375rem;
		font-weight: 700;
	}

	.entries {
		margin: 0;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		color: var(--color-text-muted);
		font-size: 0.875rem;
		line-height: 1.4;
	}
</style>
