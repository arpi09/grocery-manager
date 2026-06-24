<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<span class="pro-nav-badge" role="status" aria-label={t('nav.proBadgeAria')}>
	{t('settings.plan.proBadge')}
</span>

<style>
	.pro-nav-badge {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		line-height: 1.2;
		color: var(--color-on-primary);
		background: linear-gradient(
			120deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 65%, var(--color-learning-ai))
		);
		box-shadow: 0 1px 2px color-mix(in srgb, var(--color-primary) 25%, transparent);
	}

	@media (prefers-color-scheme: dark) {
		.pro-nav-badge {
			box-shadow: 0 1px 3px color-mix(in srgb, var(--color-text) 35%, transparent);
		}
	}
</style>
