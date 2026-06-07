<script lang="ts">
	import { browser } from '$app/environment';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { shouldPromoteWrappedBanner, toMonthKey } from '$lib/domain/wrapped';
	import { t } from '$lib/i18n';

	const DISMISS_KEY = 'skaffu-wrapped-banner-dismissed';

	let visible = $state(false);

	function readDismissedMonth(): string | null {
		if (!browser) {
			return null;
		}
		try {
			return localStorage.getItem(DISMISS_KEY);
		} catch {
			return null;
		}
	}

	function dismiss() {
		if (!browser) {
			return;
		}
		try {
			localStorage.setItem(DISMISS_KEY, toMonthKey(new Date()));
		} catch {
			// ignore
		}
		visible = false;
	}

	$effect(() => {
		if (!browser) {
			return;
		}
		visible = shouldPromoteWrappedBanner(new Date(), readDismissedMonth());
	});
</script>

{#if visible}
	<aside class="wrapped-banner motion-fade-in" aria-labelledby="wrapped-banner-heading">
		<div class="banner-copy">
			<span class="banner-badge">{t('wrapped.bannerBadge')}</span>
			<h2 id="wrapped-banner-heading">{t('wrapped.bannerTitle')}</h2>
			<p>{t('wrapped.bannerBody')}</p>
			<div class="banner-actions">
				<a class="banner-cta" href="/statistik/wrapped" data-analytics-id="wrapped.banner_cta">{t('wrapped.bannerCta')}</a>
				<button type="button" class="banner-dismiss" onclick={dismiss}>
					{t('wrapped.bannerDismiss')}
				</button>
			</div>
		</div>
		<span class="banner-icon" aria-hidden="true">
			<FeatureIcon id="sparkle" size={26} />
		</span>
	</aside>
{/if}

<style>
	.wrapped-banner {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 14%, var(--color-surface)),
			color-mix(in srgb, var(--color-success) 10%, var(--color-surface))
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		box-shadow: var(--shadow-md);
	}

	.banner-badge {
		display: inline-block;
		margin-bottom: var(--space-xs);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-primary);
	}

	.banner-copy h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 800;
	}

	.banner-copy p {
		margin: var(--space-xs) 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.banner-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		align-items: center;
	}

	.banner-cta {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: none;
	}

	.banner-cta:hover {
		text-decoration: underline;
	}

	.banner-dismiss {
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0;
	}

	.banner-icon {
		display: flex;
		color: var(--color-primary);
		flex-shrink: 0;
	}
</style>
