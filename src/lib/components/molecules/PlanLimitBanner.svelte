<script lang="ts">
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import {
		planLimitBannerDetailKey,
		type PlanLimitKey,
		type PlanLimitsSnapshot
	} from '$lib/domain/plan-limits';

	interface Props {
		snapshot: PlanLimitsSnapshot;
		class?: string;
	}

	let { snapshot, class: className = '' }: Props = $props();

	const primaryKey = $derived(snapshot.blockedKeys[0] as PlanLimitKey | undefined);
	const detailMessage = $derived(
		primaryKey
			? t(planLimitBannerDetailKey(primaryKey))
			: t('settings.plan.limitBanner.generic')
	);
	const bannerMessage = $derived(
		t('settings.plan.limitBanner.body', { detail: detailMessage })
	);
</script>

{#if snapshot.blockedKeys.length > 0}
	<div class="plan-limit-banner {className}">
		<FeedbackBanner tone="warning" message={bannerMessage} />
		<div class="plan-limit-actions">
			<a class="plan-upgrade-link" href="/priser">
				{t('settings.plan.limitBanner.upgradeCta')}
			</a>
			<p class="plan-limit-note">{t('settings.plan.limitBanner.comingSoonNote')}</p>
		</div>
	</div>
{/if}

<style>
	.plan-limit-banner {
		margin-bottom: var(--space-md);
	}

	.plan-limit-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
	}

	.plan-limit-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.plan-upgrade-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary, #fff);
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
	}

	.plan-upgrade-link:hover {
		filter: brightness(1.05);
	}
</style>
