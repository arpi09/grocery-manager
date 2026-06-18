<script lang="ts">
	import type { TripProgress } from '$lib/domain/shopping-trip';
	import { t } from '$lib/i18n';

	interface Props {
		progress: TripProgress;
	}

	let { progress }: Props = $props();

	const label = $derived(
		progress.total === 0
			? t('shopping.v2.shop.progressEmpty')
			: progress.picked >= progress.total
				? t('shopping.v2.shop.progressComplete')
				: t('shopping.v2.shop.progress', { picked: progress.picked, total: progress.total })
	);
</script>

<div class="trip-progress" data-testid="shopping-v2-trip-progress">
	<div
		class="track"
		role="progressbar"
		aria-valuemin={0}
		aria-valuemax={progress.total}
		aria-valuenow={progress.picked}
		aria-label={t('shopping.v2.shop.progressAria', {
			picked: progress.picked,
			total: progress.total
		})}
	>
		<div class="fill" style:width="{progress.percent}%"></div>
	</div>
	<p class="label">{label}</p>
</div>

<style>
	.trip-progress {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.track {
		height: 8px;
		border-radius: 999px;
		background: var(--color-surface-muted);
		overflow: hidden;
		border: 1px solid var(--color-border);
	}

	.fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: inherit;
		transition: width 0.2s ease;
	}

	.label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}
</style>
