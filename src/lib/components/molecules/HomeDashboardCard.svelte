<script lang="ts">
	import SkaffuCard from '$lib/components/molecules/SkaffuCard.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		href: string;
		testId?: string;
		tone?: 'default' | 'attention';
		meta?: Snippet;
		body?: Snippet;
		footerLabel: string;
	}

	let { title, href, testId, tone = 'default', meta, body, footerLabel }: Props = $props();
</script>

<SkaffuCard {href} clickable {tone} data-testid={testId}>
	<div class="card-inner">
		<h2 class="card-title">{title}</h2>
		{#if meta}
			<div class="card-meta">
				{@render meta()}
			</div>
		{/if}
		{#if body}
			<div class="card-body">
				{@render body()}
			</div>
		{/if}
	</div>
	{#snippet actions()}
		<span class="card-footer">{footerLabel} →</span>
	{/snippet}
</SkaffuCard>

<style>
	.card-inner {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.card-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 650;
		line-height: 1.25;
	}

	.card-meta {
		font-size: var(--font-size-label);
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.card-body {
		font-size: var(--font-size-body-sm);
		color: var(--color-text);
		line-height: 1.4;
	}

	.card-footer {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
	}
</style>
