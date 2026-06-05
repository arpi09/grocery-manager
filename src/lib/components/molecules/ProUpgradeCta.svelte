<script lang="ts">
	import { Sparkles } from '@lucide/svelte';
	import { t } from '$lib/i18n';

	interface Props {
		variant: 'banner' | 'card' | 'nav';
		class?: string;
	}

	let { variant, class: className = '' }: Props = $props();
</script>

{#if variant === 'nav'}
	<a href="/settings#plan-upgrade" class="pro-upgrade-nav {className}">
		<span class="nav-badge">{t('proUpgrade.navBadge')}</span>
		<span class="nav-cta">{t('proUpgrade.cta')}</span>
	</a>
{:else if variant === 'banner'}
	<a href="/settings#plan-upgrade" class="pro-upgrade-banner {className}">
		<span class="banner-badge label-caps">
			<Sparkles size={14} strokeWidth={2} aria-hidden="true" />
			{t('proUpgrade.navBadge')}
		</span>
		<span class="banner-copy">
			<span class="banner-title">{t('proUpgrade.bannerTitle')}</span>
			<span class="banner-lead">{t('proUpgrade.bannerLead')}</span>
		</span>
		<span class="banner-cta">{t('proUpgrade.cta')}</span>
	</a>
{:else}
	<a href="/settings#plan-upgrade" class="pro-upgrade-card {className}">
		<span class="card-badge label-caps">
			<Sparkles size={14} strokeWidth={2} aria-hidden="true" />
			{t('proUpgrade.navBadge')}
		</span>
		<span class="card-title">{t('proUpgrade.cardTitle')}</span>
		<span class="card-lead">{t('proUpgrade.cardLead')}</span>
		<span class="card-cta">{t('proUpgrade.cta')}</span>
	</a>
{/if}

<style>
	.pro-upgrade-nav,
	.pro-upgrade-banner,
	.pro-upgrade-card {
		text-decoration: none;
		color: inherit;
	}

	.pro-upgrade-nav {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1.2;
		white-space: nowrap;
	}

	.pro-upgrade-nav:hover {
		border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
	}

	.nav-badge {
		display: inline-flex;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		color: var(--color-on-primary, #fff);
		background: linear-gradient(
			120deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 65%, #6d28d9)
		);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.nav-cta {
		color: var(--color-primary);
	}

	.pro-upgrade-banner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm) var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)),
			var(--color-surface)
		);
		box-shadow: var(--shadow-sm);
	}

	.banner-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--color-primary);
	}

	.banner-copy {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		flex: 1;
		min-width: 12rem;
	}

	.banner-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.banner-lead {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.banner-cta,
	.card-cta {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.pro-upgrade-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-lg);
		border: 1px dashed color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
	}

	.card-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--color-primary);
	}

	.card-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.card-lead {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}
</style>
