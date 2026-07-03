<script lang="ts">
	import BackLink from '$lib/components/atoms/BackLink.svelte';
	import ExpandableCopy from '$lib/components/molecules/ExpandableCopy.svelte';

	interface Props {
		title: string;
		subtitle?: string;
		subtitlePreview?: string;
		backHref?: string;
		backFallback?: string;
		backLabel?: string;
	}

	let { title, subtitle, subtitlePreview, backHref, backFallback, backLabel = 'Tillbaka' }: Props =
		$props();
</script>

<header class="page-header">
	{#if backHref}
		<a class="back-link" href={backHref}>← {backLabel}</a>
	{:else if backFallback}
		<BackLink fallbackHref={backFallback} label={backLabel} testId="app-header-back" />
	{/if}
	<h1>{title}</h1>
	{#if subtitle}
		{#if subtitlePreview}
			<ExpandableCopy preview={subtitlePreview} class="subtitle">
				<p>{subtitle}</p>
			</ExpandableCopy>
		{:else}
			<p class="subtitle">{subtitle}</p>
		{/if}
	{/if}
</header>

<style>
	.page-header {
		width: 100%;
		max-width: var(--page-max-width);
		margin-inline: auto;
		margin-top: 0;
		margin-bottom: var(--page-section-gap);
		padding-top: var(--space-sm);
	}

	@media (min-width: 900px) {
		.page-header {
			padding-top: var(--space-md);
		}
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		margin-bottom: var(--space-xs);
		color: var(--color-primary);
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: none;
		opacity: 0.85;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.35rem, 2.5vw, 1.65rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.subtitle {
		margin: var(--space-xs) 0 0;
		font-size: 0.92rem;
	}

	:global(.subtitle.expandable-copy .body),
	.subtitle {
		color: var(--color-text-muted);
		line-height: 1.45;
		max-width: 42ch;
	}
</style>
