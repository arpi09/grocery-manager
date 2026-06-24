<script lang="ts">
	import type { ReceiptImportQualityReport } from '$lib/domain/receipt-quality-report';
	import { t } from '$lib/i18n';

	interface Props {
		report: ReceiptImportQualityReport;
	}

	let { report }: Props = $props();
</script>

<div class="quality-meter" role="status" data-testid="receipt-quality-meter">
	<p class="quality-lead">{t('brain.receiptQuality.lead', { percent: report.bbfCoveragePercent })}</p>
	<div class="quality-bar" aria-hidden="true">
		<span class="quality-fill" style="width: {Math.min(100, report.bbfCoveragePercent)}%"></span>
	</div>
	<ul class="quality-stats">
		<li>{t('brain.receiptQuality.highConfidence', { count: report.highConfidence })}</li>
		<li>{t('brain.receiptQuality.estimated', { count: report.estimated })}</li>
		<li>{t('brain.receiptQuality.missing', { count: report.missing })}</li>
	</ul>
</div>

<style>
	.quality-meter {
		margin: var(--space-md) 0;
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.quality-lead {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.quality-bar {
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
		margin-bottom: var(--space-sm);
	}

	.quality-fill {
		display: block;
		height: 100%;
		background: color-mix(in srgb, var(--color-primary) 70%, var(--color-success));
		border-radius: inherit;
	}

	.quality-stats {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
	}
</style>
