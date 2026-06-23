<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { WastePreventedSnapshot } from '$lib/domain/waste-prevented';
	import { t } from '$lib/i18n';

	interface Props {
		snapshot: WastePreventedSnapshot;
	}

	let { snapshot }: Props = $props();
</script>

{#if snapshot.hasData && snapshot.preventedSek > 0}
	<Card class="waste-prevented" data-testid="waste-prevented-card">
		<p class="amount">
			{t('brain.wastePrevented.amount', {
				amount: snapshot.preventedSek,
				month: snapshot.monthLabel
			})}
		</p>
		<p class="body">{t('brain.wastePrevented.body', { count: snapshot.consumedCount })}</p>
	</Card>
{/if}

<style>
	.waste-prevented {
		margin-bottom: var(--space-md);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.amount {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.body {
		margin: 0.35rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.35;
	}
</style>
