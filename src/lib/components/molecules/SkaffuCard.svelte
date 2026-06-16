<script lang="ts">
	import Card, { Actions, Content } from '@smui/card';
	import { skaffuSmuiClassNames } from '$lib/design/skaffu-smui-theme';
	import type { Snippet } from 'svelte';

	type Tone = 'default' | 'attention';

	interface Props {
		href?: string;
		clickable?: boolean;
		tone?: Tone;
		'data-testid'?: string;
		children: Snippet;
		actions?: Snippet;
	}

	let {
		href,
		clickable = false,
		tone = 'default',
		'data-testid': dataTestId,
		children,
		actions
	}: Props = $props();

	const isInteractive = $derived(Boolean(href) || clickable);
	const cardClass = $derived(
		`${skaffuSmuiClassNames.card} skaffu-card--${tone}${isInteractive ? ' skaffu-card--clickable' : ''}`
	);
</script>

{#if href}
	<a class="skaffu-card-link" {href} data-testid={dataTestId}>
		<Card class={cardClass} variant="outlined">
			<Content class="skaffu-card__content">
				{@render children()}
			</Content>
			{#if actions}
				<Actions class="skaffu-card__actions">
					{@render actions()}
				</Actions>
			{/if}
		</Card>
	</a>
{:else}
	<div class="skaffu-card-wrap" data-testid={dataTestId}>
		<Card class={cardClass} variant="outlined">
			<Content class="skaffu-card__content">
				{@render children()}
			</Content>
			{#if actions}
				<Actions class="skaffu-card__actions">
					{@render actions()}
				</Actions>
			{/if}
		</Card>
	</div>
{/if}

<style>
	.skaffu-card-link {
		display: block;
		color: inherit;
		text-decoration: none;
		border-radius: var(--radius-lg);
	}

	.skaffu-card-wrap {
		display: block;
	}

	:global(.skaffu-card) {
		border-radius: var(--radius-lg) !important;
		border: 1px solid var(--color-border) !important;
		background: var(--color-surface) !important;
		box-shadow: none !important;
		font-family: var(--font);
	}

	:global(.skaffu-card--attention) {
		border-color: color-mix(in srgb, var(--color-warning) 45%, var(--color-border)) !important;
	}

	:global(.skaffu-card--clickable) {
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	:global(.skaffu-card-link:hover .skaffu-card--clickable),
	:global(.skaffu-card-link:focus-visible .skaffu-card--clickable) {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border)) !important;
	}

	:global(.skaffu-card-link:focus-visible) {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}

	:global(.skaffu-card__content) {
		padding: var(--space-md) !important;
	}

	:global(.skaffu-card__actions) {
		padding: 0 var(--space-md) var(--space-md) !important;
	}
</style>
