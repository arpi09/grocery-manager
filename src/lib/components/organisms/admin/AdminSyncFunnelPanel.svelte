<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { SyncFunnelSnapshot } from '$lib/domain/sync-funnel-admin';
	import { t } from '$lib/i18n';

	interface Props {
		snapshot: SyncFunnelSnapshot;
	}

	let { snapshot }: Props = $props();

	function percent(value: number | null): string {
		if (value === null) return t('pmf.noData');
		return new Intl.NumberFormat('sv-SE', { style: 'percent', maximumFractionDigits: 1 }).format(value);
	}
</script>

<section class="sync-funnel" aria-label={t('admin.syncFunnel.title')}>
	<h2>{t('admin.syncFunnel.title')}</h2>
	<div class="grid">
		<Card>
			<p>{t('admin.syncFunnel.write7d')}</p>
			<strong>{snapshot.counts.householdsWithWrite7d}</strong>
		</Card>
		<Card>
			<p>{t('admin.syncFunnel.review7d')}</p>
			<strong>{snapshot.counts.householdsWithBatchReview7d}</strong>
		</Card>
		<Card>
			<p>{t('admin.syncFunnel.conversion')}</p>
			<strong>{percent(snapshot.conversionToBatchReview)}</strong>
		</Card>
	</div>
</section>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-sm);
	}
</style>
