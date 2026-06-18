<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		count: number;
		names: string[];
		href: string;
	}

	let { count, names, href }: Props = $props();

	const listText = $derived(names.join(', '));
</script>

{#if count > 0}
	<aside class="use-soon-band" aria-label={t('pantry.v2.useSoon.aria')} data-testid="pantry-v2-use-soon">
		<span class="icon" aria-hidden="true">⏳</span>
		<div class="copy">
			<h2>{t('pantry.v2.useSoon.title', { count })}</h2>
			{#if listText}
				<p>{t('pantry.v2.useSoon.list', { items: listText })}</p>
			{/if}
			<a class="cta" {href}>{t('pantry.v2.useSoon.cta')}</a>
		</div>
	</aside>
{/if}

<style>
	.use-soon-band {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		margin: var(--space-md) 0 var(--page-section-gap, var(--space-lg));
		background: color-mix(in srgb, var(--color-accent) 18%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-warning) 20%, var(--color-surface));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		flex-shrink: 0;
	}

	.copy {
		min-width: 0;
		flex: 1;
	}

	h2 {
		margin: 0 0 2px;
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 700;
	}

	p {
		margin: 0 0 var(--space-xs);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.cta {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
	}

	.cta:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
