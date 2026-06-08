<script lang="ts">
	import { page } from '$app/state';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';

	interface Props {
		staleCount?: number;
		canWrite?: boolean;
	}

	let { staleCount = 0, canWrite = true }: Props = $props();

	const pathname = $derived(page.url.pathname);
	const scanHref = $derived(scanHubHref(pathname));
	const hasStale = $derived(staleCount > 0);
</script>

<nav class="core-action-bar" aria-label={t('coreActionBar.ariaLabel')} data-testid="core-action-bar">
	<a class="action" href={scanHref} data-analytics-id="core_action.scan" data-testid="core-action-scan">
		<span class="icon" aria-hidden="true"><FeatureIcon id="photo" size={20} /></span>
		<span class="label">{t('coreActionBar.scan')}</span>
	</a>
	<a
		class="action"
		href="/inventory/fridge"
		data-analytics-id="core_action.pantry"
		data-testid="core-action-pantry"
	>
		<span class="icon" aria-hidden="true"><FeatureIcon id="fridge" size={20} /></span>
		<span class="label">{t('coreActionBar.pantry')}</span>
	</a>
	{#if hasStale && canWrite}
		<a
			class="action"
			href="/inventory/synk"
			data-analytics-id="core_action.confirm"
			data-testid="core-action-confirm"
		>
			<span class="icon" aria-hidden="true"><FeatureIcon id="check" size={20} /></span>
			<span class="label">{t('coreActionBar.confirm')}</span>
			<span class="badge" aria-label={t('coreActionBar.confirmBadge', { count: staleCount })}>
				{staleCount}
			</span>
		</a>
	{:else}
		<span
			class="action action--disabled"
			aria-disabled="true"
			title={t('coreActionBar.confirmDisabled')}
			data-testid="core-action-confirm-disabled"
		>
			<span class="icon" aria-hidden="true"><FeatureIcon id="check" size={20} /></span>
			<span class="label">{t('coreActionBar.confirm')}</span>
		</span>
	{/if}
	<a class="action" href="/planer" data-analytics-id="core_action.eat" data-testid="core-action-eat">
		<span class="icon" aria-hidden="true"><FeatureIcon id="sparkle" size={20} /></span>
		<span class="label">{t('coreActionBar.eat')}</span>
	</a>
</nav>

<style>
	.core-action-bar {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		align-items: stretch;
		gap: 0;
		width: 100%;
		min-height: var(--core-action-bar-height);
		border-top: 1px solid var(--nav-border);
		background: var(--nav-surface);
		box-shadow: 0 -2px 12px rgba(31, 42, 36, 0.05);
	}

	.action {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		min-height: var(--touch-target-min);
		padding: var(--space-xs) var(--space-xs) calc(var(--space-xs) + 2px);
		color: var(--color-text-muted);
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1.2;
		text-decoration: none;
		text-align: center;
		position: relative;
	}

	a.action:hover {
		color: var(--color-primary);
		text-decoration: none;
	}

	.action--disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.label {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		position: absolute;
		top: 0.2rem;
		right: calc(50% - 1.35rem);
		min-width: 1.1rem;
		height: 1.1rem;
		padding: 0 0.2rem;
		border-radius: 999px;
		background: var(--color-warning);
		color: var(--color-on-primary);
		font-size: 0.625rem;
		font-weight: 700;
		line-height: 1.1rem;
		text-align: center;
	}

	@media (min-width: 900px) {
		.core-action-bar {
			position: sticky;
			top: calc(var(--header-height-desktop) + env(safe-area-inset-top, 0));
			z-index: calc(var(--z-nav-header) - 1);
			margin: 0 calc(-1 * var(--page-padding-x)) var(--space-md);
			width: calc(100% + 2 * var(--page-padding-x));
			border: 1px solid var(--nav-border);
			border-radius: var(--radius-md);
			box-shadow: var(--shadow-sm);
		}

		.action {
			flex-direction: row;
			gap: var(--space-xs);
			font-size: 0.8125rem;
			padding: var(--space-sm) var(--space-md);
		}

		.badge {
			position: static;
			min-width: 1.25rem;
			height: 1.25rem;
			line-height: 1.25rem;
			font-size: 0.6875rem;
		}
	}

	@media (max-width: 899px) {
		.core-action-bar {
			position: fixed;
			left: 0;
			right: 0;
			bottom: calc(var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom, 0));
			z-index: calc(var(--z-nav-bottom) - 1);
		}
	}
</style>
