<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { Snippet } from 'svelte';

	export type HomeOverviewTone = 'default' | 'attention' | 'dominant';

	interface Props {
		id?: string;
		title: string;
		titleId?: string;
		href?: string;
		tone?: HomeOverviewTone;
		testId?: string;
		illustration?: Snippet;
		body?: Snippet;
		secondary?: Snippet;
		cta?: Snippet;
		onclick?: () => void;
	}

	let {
		id,
		title,
		titleId,
		href,
		tone = 'default',
		testId,
		illustration,
		body,
		secondary,
		cta,
		onclick
	}: Props = $props();
</script>

{#if href}
	<a
		{id}
		class="overview-card tone-{tone}"
		href={href}
		data-testid={testId}
		onclick={onclick}
	>
		{@render cardInner()}
	</a>
{:else}
	<Card class="overview-card tone-{tone}" {id} data-testid={testId}>
		{@render cardInner()}
	</Card>
{/if}

{#snippet cardInner()}
	<div class="inner">
		{#if illustration}
			<div class="illus" aria-hidden="true">{@render illustration()}</div>
		{/if}
		<div class="copy">
			<h2 class="title" id={titleId}>{title}</h2>
			{#if body}
				<div class="body">{@render body()}</div>
			{/if}
			{#if secondary}
				<div class="secondary">{@render secondary()}</div>
			{/if}
			{#if cta}
				<div class="cta">{@render cta()}</div>
			{/if}
		</div>
	</div>
{/snippet}

<style>
	:global(.overview-card),
	.overview-card {
		display: block;
		text-decoration: none;
		color: inherit;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		padding: var(--space-md);
		transition: transform 160ms ease, box-shadow 160ms ease;
	}

	.overview-card.tone-dominant {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
	}

	.overview-card.tone-attention {
		border-color: color-mix(in srgb, var(--color-warning, #c9870a) 35%, var(--color-border));
	}

	@media (min-width: 720px) and (prefers-reduced-motion: no-preference) {
		:global(a.overview-card:hover),
		:global(a.overview-card:focus-visible) {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px color-mix(in srgb, var(--color-text) 8%, transparent);
		}
	}

	.inner {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.illus {
		flex-shrink: 0;
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-width: 0;
		flex: 1;
	}

	.title {
		margin: 0;
		font-size: var(--font-size-label);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.body :global(p) {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.35;
	}

	.secondary :global(p) {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.cta {
		margin-top: var(--space-sm);
	}
</style>
