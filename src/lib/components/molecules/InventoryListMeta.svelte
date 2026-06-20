<script lang="ts">
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import {
		buildInventoryListMetaParts,
		isInventoryExpiryEstimated
	} from '$lib/domain/inventory-list-presenter';
	import { daysUntilExpiry, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		item: Pick<InventoryItem, 'quantity' | 'unit' | 'expiresOn' | 'expiresOnSource'>;
	}

	let { item }: Props = $props();

	const locale = $derived(getLocale());
	const parts = $derived(buildInventoryListMetaParts(item, locale));
	const estimated = $derived(isInventoryExpiryEstimated(item.expiresOnSource));
	const warn = $derived.by(() => {
		if (!item.expiresOn) {
			return false;
		}
		const days = daysUntilExpiry(item.expiresOn);
		return days >= 0 && days <= EXPIRING_SOON_DAYS;
	});

	const metaLine = $derived.by(() => {
		const segments: string[] = [];
		if (parts.quantity) {
			segments.push(parts.quantity);
		}
		if (parts.expiry) {
			segments.push(parts.expiry);
		}
		return segments.join(' · ');
	});

	const ariaLabel = $derived.by(() => {
		if (!metaLine) {
			return undefined;
		}
		return t('inventory.listMetaAria', { meta: metaLine });
	});
</script>

{#if metaLine}
	<span
		class="inventory-list-meta"
		class:warn
		class:estimated
		aria-label={ariaLabel}
		data-testid="inventory-list-meta"
	>
		{metaLine}
	</span>
{/if}

<style>
	.inventory-list-meta {
		display: block;
		font-size: 0.75rem;
		line-height: 1.3;
		color: var(--color-text-muted);
	}

	.inventory-list-meta.warn {
		color: color-mix(in srgb, var(--color-warning) 40%, var(--color-text));
		font-weight: 600;
	}

	.inventory-list-meta.estimated {
		color: color-mix(in srgb, var(--color-text-muted) 85%, var(--color-text));
	}

	.inventory-list-meta.warn.estimated {
		color: color-mix(in srgb, var(--color-warning) 30%, var(--color-text-muted));
	}
</style>
