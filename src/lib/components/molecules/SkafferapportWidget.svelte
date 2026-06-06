<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import AnimatedNumber from '$lib/components/atoms/AnimatedNumber.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { SavingsReport } from '$lib/domain/savings-estimate';
	import { t } from '$lib/i18n';

	interface Props {
		savings: SavingsReport;
	}

	let { savings }: Props = $props();
</script>

<section class="skafferapport motion-fade-in" aria-labelledby="skafferapport-heading">
	<Card href="/statistik" interactive class="skafferapport-card">
		<div class="card-header">
			<span class="card-icon" aria-hidden="true">
				<FeatureIcon id="sparkle" size={20} />
			</span>
			<h2 id="skafferapport-heading">{t('skafferapport.title')}</h2>
		</div>
		<p class="saved-line">
			{t('skafferapport.saved', { sek: savings.savedSek, kg: savings.savedKg })}
		</p>
		<p class="lead">{t('skafferapport.lead')}</p>
		<div class="metrics" aria-label={t('skafferapport.metricsAria')}>
			<div class="metric">
				<p class="metric-value">
					<AnimatedNumber value={savings.consumedCount} />
				</p>
				<p class="metric-label">{t('skafferapport.consumed')}</p>
			</div>
			<div class="metric">
				<p class="metric-value net">
					<AnimatedNumber value={savings.netSek} />
					<span class="unit">kr</span>
				</p>
				<p class="metric-label">{t('skafferapport.net')}</p>
			</div>
		</div>
		<span class="link-label">{t('skafferapport.viewStats')}</span>
	</Card>
</section>

<style>
	.skafferapport :global(.skafferapport-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--color-success) 8%, var(--color-surface)),
			var(--color-surface)
		);
		border-color: color-mix(in srgb, var(--color-success) 22%, var(--color-border));
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.card-header h2 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.card-icon {
		display: flex;
		color: var(--color-success);
	}

	.saved-line {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.metrics {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
	}

	.metric {
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.metric-value {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1.1;
	}

	.metric-value.net {
		display: flex;
		align-items: baseline;
		gap: 0.15rem;
	}

	.unit {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.metric-label {
		margin: 0.15rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.link-label {
		margin-top: var(--space-xs);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
	}
</style>
