<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<aside class="demo-banner" aria-label={t('demo.banner.aria')}>
	<span class="badge">{t('demo.banner.badge')}</span>
	<p>{t('demo.banner.body')}</p>
</aside>

<style>
	.demo-banner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm) var(--space-md);
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
	}

	.badge {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	p {
		margin: 0;
		flex: 1 1 12rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}
</style>
