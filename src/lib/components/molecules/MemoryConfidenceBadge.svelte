<script lang="ts">
	import type { ConfidenceTier } from '$lib/domain/learning/prediction-trust';
	import { t } from '$lib/i18n';

	interface Props {
		tier: ConfidenceTier;
	}

	let { tier }: Props = $props();

	const label = $derived(
		tier === 'high' ? t('memory.confidence.high') : t('memory.confidence.medium')
	);
</script>

<span class="badge" data-tier={tier}>{label}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.35;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-text);
	}

	.badge[data-tier='high'] {
		background: color-mix(in srgb, var(--color-success, #2e7d32) 14%, var(--color-surface));
	}
</style>
