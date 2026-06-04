<script lang="ts">
	import NewsMilestoneCard from '$lib/components/organisms/NewsMilestoneCard.svelte';
	import type { AppNewsItem } from '$lib/data/app-news';
	import { t } from '$lib/i18n';

	interface ResolvedNewsItem extends AppNewsItem {
		title: string;
		body: string;
		dateLabel: string;
	}

	interface Props {
		items: AppNewsItem[];
	}

	let { items }: Props = $props();

	const resolvedItems = $derived(
		items.map(
			(item): ResolvedNewsItem => ({
				...item,
				title: t(item.titleKey),
				body: t(item.bodyKey),
				dateLabel: formatNewsDate(item.date)
			})
		)
	);

	function formatNewsDate(isoDate: string): string {
		const date = new Date(`${isoDate}T12:00:00`);
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}
</script>

<div class="timeline">
	<div class="path-line" aria-hidden="true"></div>
	<ol class="milestones" aria-label={t('news.trailAria')}>
		{#each resolvedItems as item, index (item.id)}
			<li class="milestone-item">
				<NewsMilestoneCard {item} title={item.title} body={item.body} dateLabel={item.dateLabel} {index} />
			</li>
		{/each}
	</ol>
</div>

<style>
	.timeline {
		position: relative;
		padding-top: var(--space-sm);
	}

	.path-line {
		position: absolute;
		top: 0.5rem;
		bottom: var(--space-lg);
		left: calc(1.25rem - 1px);
		width: 2px;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--color-primary) 55%, transparent),
			color-mix(in srgb, var(--color-primary) 12%, var(--color-border))
		);
		border-radius: 999px;
	}

	.milestones {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.milestone-item:last-child :global(.milestone) {
		padding-bottom: 0;
	}
</style>
