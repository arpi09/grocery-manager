<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { PantryHealthInsight } from '$lib/domain/pantry-health';
	import { trackProductEvent } from '$lib/client/product-events';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	interface Props {
		insights: PantryHealthInsight[];
	}

	let { insights }: Props = $props();

	let shownTracked = $state(false);

	onMount(() => {
		if (insights.length > 0 && !shownTracked) {
			shownTracked = true;
			void trackProductEvent('pantry_health_insight_shown', {
				count: insights.length,
				kinds: insights.map((entry) => entry.kind)
			});
		}
	});

	function messageForInsight(entry: PantryHealthInsight): string {
		if (entry.kind === 'stale') {
			return t('pantryHealth.stale', { count: entry.count });
		}
		if (entry.kind === 'duplicate') {
			return t('pantryHealth.duplicate', {
				count: entry.count,
				name: entry.displayName ?? ''
			});
		}
		return t('pantryHealth.overstock', {
			count: entry.count,
			name: entry.displayName ?? ''
		});
	}

	function trackClick(entry: PantryHealthInsight) {
		void trackProductEvent('pantry_health_insight_clicked', {
			kind: entry.kind,
			count: entry.count
		});
	}
</script>

{#if insights.length > 0}
	<section class="pantry-health" aria-label={t('pantryHealth.ariaLabel')}>
		<h2 class="heading">{t('pantryHealth.title')}</h2>
		<ul class="insights">
			{#each insights as insight (insight.id)}
				<li>
					<Card class="insight-card">
						<a href={insight.href} class="insight-link" onclick={() => trackClick(insight)}>
							<span class="message">{messageForInsight(insight)}</span>
							<span class="arrow" aria-hidden="true">→</span>
						</a>
					</Card>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.pantry-health {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.heading {
		margin: 0;
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
	}

	.insights {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	:global(.insight-card) {
		padding: var(--space-sm) var(--space-md);
	}

	.insight-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		color: inherit;
		text-decoration: none;
		min-height: 2.75rem;
	}

	.insight-link:hover .message {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.message {
		font-size: 0.9375rem;
		line-height: 1.45;
		color: var(--color-text);
	}

	.arrow {
		flex-shrink: 0;
		color: var(--color-text-muted);
	}
</style>
