<script lang="ts">
	import { t } from '$lib/i18n';
	import { scanHubHref, scanSubFlowFrom } from '$lib/utils/scan-nav';

	export type ScanModeTab = 'hub' | 'barcode' | 'receipt' | 'photoRound' | 'manual';

	interface Props {
		active: ScanModeTab | null;
		returnTo: string;
		defaultLocation?: string;
		showManual?: boolean;
	}

	let { active, returnTo, defaultLocation, showManual = true }: Props = $props();

	const hubHref = $derived(scanHubHref(returnTo));
	const subFlowFrom = $derived(scanSubFlowFrom(returnTo));
	const locationQuery = $derived(defaultLocation ? `&location=${defaultLocation}` : '');

	const tabs = $derived.by(() => {
		const items: { id: ScanModeTab; href: string; label: string }[] = [
			{
				id: 'hub',
				href: hubHref,
				label: t('scan.title')
			},
			{
				id: 'barcode',
				href: `${hubHref}&mode=barcode${locationQuery}`,
				label: t('scan.modes.barcode')
			},
			{
				id: 'receipt',
				href: `/scan/kvitto?from=${subFlowFrom}`,
				label: t('scan.modes.receipt')
			},
			{
				id: 'photoRound',
				href: `/inventory/foto?from=${encodeURIComponent(subFlowFrom)}${locationQuery ? `&location=${defaultLocation}` : ''}`,
				label: t('photoRound.title')
			}
		];

		if (showManual) {
			items.push({
				id: 'manual',
				href: `/item/new?from=${encodeURIComponent(subFlowFrom)}${locationQuery}`,
				label: t('scan.modes.manual')
			});
		}

		return items;
	});
</script>

<nav class="mode-tabs" aria-label={t('scan.hubAria')}>
	<div class="mode-tabs-scroll">
		{#each tabs as tab (tab.id)}
			<a
				href={tab.href}
				class="tab"
				class:active={active === tab.id}
				aria-current={active === tab.id ? 'page' : undefined}
			>
				{tab.label}
			</a>
		{/each}
	</div>
</nav>

<style>
	.mode-tabs {
		margin-bottom: var(--space-md);
	}

	.mode-tabs-scroll {
		display: flex;
		gap: var(--space-xs);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		padding-bottom: 2px;
	}

	.mode-tabs-scroll::-webkit-scrollbar {
		display: none;
	}

	.tab {
		flex: 0 0 auto;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.45rem 0.9rem;
		min-height: 2.5rem;
		display: inline-flex;
		align-items: center;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		text-decoration: none;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--color-text);
		text-decoration: none;
	}

	.tab.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}
</style>
