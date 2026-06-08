<script lang="ts">
	import { t } from '$lib/i18n';
	import { scanHubHref, scanModeHref } from '$lib/utils/scan-nav';
	import type { StorageLocation } from '$lib/domain/location';

	export type ScanModeTab = 'hub' | 'barcode' | 'receipt' | 'photoRound' | 'manual';

	interface Props {
		active: ScanModeTab | null;
		returnTo: string;
		defaultLocation?: StorageLocation | string;
		showManual?: boolean;
	}

	let { active, returnTo, defaultLocation, showManual = true }: Props = $props();

	const locationOption = $derived(
		defaultLocation ? { location: defaultLocation as StorageLocation | string } : undefined
	);

	const tabs = $derived.by(() => {
		const items: { id: ScanModeTab; href: string; label: string }[] = [
			{
				id: 'photoRound',
				href: scanModeHref('photo', returnTo, locationOption),
				label: t('photoRound.title')
			},
			{
				id: 'receipt',
				href: scanModeHref('receipt', returnTo),
				label: t('scan.modes.receipt')
			},
			{
				id: 'barcode',
				href: scanModeHref('barcode', returnTo, locationOption),
				label: t('scan.modes.barcode')
			}
		];

		if (showManual) {
			items.push({
				id: 'manual',
				href: `/item/new?from=${encodeURIComponent(scanHubHref(returnTo))}${defaultLocation ? `&location=${defaultLocation}` : ''}`,
				label: t('scan.modes.manual')
			});
		}

		return items;
	});
</script>

<nav class="mode-tabs" aria-label={t('scan.hubAria')}>
	<div class="mode-tabs-scroll">
		<a
			href={scanHubHref(returnTo)}
			class="tab"
			class:active={active === 'hub'}
			aria-current={active === 'hub' ? 'page' : undefined}
		>
			{t('scan.moreWays')}
		</a>
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
		min-height: var(--touch-target-min);
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
		color: var(--color-on-primary);
	}
</style>
