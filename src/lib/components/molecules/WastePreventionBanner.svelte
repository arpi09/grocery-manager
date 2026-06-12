<script lang="ts">
	import type { WasteAlert } from '$lib/domain/waste-prevention';
	import { trackProductEvent } from '$lib/client/product-events';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	interface Props {
		alert: WasteAlert;
	}

	let { alert }: Props = $props();

	let shownTracked = $state(false);

	onMount(() => {
		if (!shownTracked) {
			shownTracked = true;
			void trackProductEvent('waste_alert_shown', {
				expiringCount: alert.expiringCount,
				slowMoverCount: alert.slowMoverCount
			});
		}
	});

	function handleClick() {
		void trackProductEvent('waste_alert_clicked', {
			expiringCount: alert.expiringCount,
			slowMoverCount: alert.slowMoverCount
		});
		void trackProductEvent('waste_alert_resolved', {
			expiringCount: alert.expiringCount,
			slowMoverCount: alert.slowMoverCount
		});
	}
</script>

<aside class="waste-banner" aria-label={t('wastePrevention.ariaLabel')}>
	<p class="copy">
		{#if alert.slowMoverCount > 0}
			{t('wastePrevention.slowMoverCopy', {
				expiringCount: alert.expiringCount,
				slowMoverCount: alert.slowMoverCount
			})}
		{:else}
			{t('wastePrevention.copy', { count: alert.expiringCount })}
		{/if}
	</p>
	<a href={alert.href} class="action" onclick={handleClick}>
		{t('wastePrevention.action')}
	</a>
</aside>

<style>
	.waste-banner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm) var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted, rgba(0, 0, 0, 0.04));
		border: 1px solid var(--color-border);
	}

	.copy {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.45;
		color: var(--color-text);
		flex: 1 1 12rem;
	}

	.action {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
	}
</style>
