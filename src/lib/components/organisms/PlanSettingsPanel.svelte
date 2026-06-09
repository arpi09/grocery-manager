<script lang="ts">
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import PlanLimitBanner from '$lib/components/molecules/PlanLimitBanner.svelte';
	import ProActivePanel from '$lib/components/molecules/ProActivePanel.svelte';
	import ProUpgradePanel from '$lib/components/molecules/ProUpgradePanel.svelte';
	import ProWaitlistForm from '$lib/components/marketing/ProWaitlistForm.svelte';
	import { FREE_LIMITS, PRICE_HYPOTHESIS_SEK, PRO_LIMITS } from '$lib/domain/plan';
	import { planLimitUsageLabelKey, type PlanLimitsSnapshot } from '$lib/domain/plan-limits';
	import type { HouseholdBillingState } from '$lib/domain/billing';
	import { t } from '$lib/i18n';

	interface Props {
		isPro: boolean;
		isAdmin?: boolean;
		isOwner: boolean;
		stripeCheckoutEnabled: boolean;
		checkoutStatus: 'success' | 'cancel' | 'portal' | null;
		planLimits: PlanLimitsSnapshot | null;
		billing: HouseholdBillingState | null;
		userEmail: string;
		form: Record<string, unknown> | null | undefined;
	}

	let {
		isPro,
		isAdmin = false,
		isOwner,
		stripeCheckoutEnabled,
		checkoutStatus,
		planLimits,
		billing,
		userEmail,
		form
	}: Props = $props();
</script>

<SettingsSection
	id="settings-plan"
	title={t('settings.plan.title')}
	description={isPro ? t('settings.plan.descriptionPro') : t('settings.plan.description')}
>
	{#if planLimits && !isPro}
		<PlanLimitBanner snapshot={planLimits} {stripeCheckoutEnabled} />
	{/if}
	{#if isAdmin}
		<p class="plan-copy plan-admin-note">{t('settings.plan.adminUnlimited')}</p>
	{/if}
	{#if isPro}
		<ProActivePanel
			{isOwner}
			{billing}
			{stripeCheckoutEnabled}
			checkoutStatus={checkoutStatus}
		/>
	{:else}
		<SettingsRow
			title={t('settings.plan.currentTier')}
			note={t('settings.plan.currentFree')}
			last={false}
		/>
		<div class="plan-panel plan-upgrade-panel">
			{#if stripeCheckoutEnabled}
				<ProUpgradePanel
					{isOwner}
					checkoutStatus={checkoutStatus === 'portal' ? null : checkoutStatus}
				/>
			{:else}
				<p class="plan-copy plan-muted">{t('settings.plan.comingSoon')}</p>
				<ProWaitlistForm
					action="?/joinProWaitlist"
					source="settings"
					title={t('settings.plan.waitlistTitle')}
					description={t('settings.plan.waitlistDescription')}
					emailLabel={t('settings.plan.waitlistEmailLabel')}
					submitLabel={t('settings.plan.waitlistSubmitLabel')}
					successMessage={t('settings.plan.waitlistSuccess')}
					existsMessage={t('settings.plan.waitlistExists')}
					email={userEmail}
					emailReadonly
					{form}
				/>
			{/if}
		</div>
	{/if}
	{#if planLimits && !isPro}
		<div class="plan-panel plan-usage-panel">
			<h3 class="plan-heading">{t('settings.plan.usageTitle')}</h3>
			<ul class="plan-usage-list">
				{#each planLimits.limits as row (row.key)}
					<li class:at-limit={row.atLimit}>
						<span class="plan-usage-label">{t(planLimitUsageLabelKey(row.key))}</span>
						<span class="plan-usage-value">
							{#if row.limit === null}
								{t('settings.plan.usageUnlimited')}
							{:else}
								{t('settings.plan.usageCount', { used: row.used, limit: row.limit })}
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	<details class="settings-disclosure plan-compare">
		<summary class="settings-disclosure-summary">{t('settings.plan.compareSummary')}</summary>
		<div class="plan-panel">
			<h3 class="plan-heading">{t('settings.plan.freeLimitsTitle')}</h3>
			<p class="plan-copy">
				{t('settings.plan.freeLimitsItems', {
					items: FREE_LIMITS.maxInventoryItems,
					members: FREE_LIMITS.maxHouseholdMembers,
					aiScans: FREE_LIMITS.aiScansPerMonth,
					receipts: FREE_LIMITS.receiptPdfParsesPerMonth,
					smartFill: FREE_LIMITS.smartFillPerWeek
				})}
			</p>
			<h3 class="plan-heading">{t('settings.plan.proTitle')}</h3>
			<ul class="plan-pro-list">
				<li>{t('settings.plan.proUnlimitedAi')}</li>
				<li>{t('settings.plan.proUnlimitedReceipt')}</li>
				<li>{t('settings.plan.proUnlimitedSmartFill')}</li>
				<li>{t('settings.plan.proInsights')}</li>
				<li>
					{t('settings.plan.proMembers', { max: PRO_LIMITS.maxHouseholdMembers ?? 6 })}
				</li>
			</ul>
			<p class="plan-copy plan-muted">
				{t('settings.plan.priceHint', {
					monthly: PRICE_HYPOTHESIS_SEK.monthly,
					yearly: PRICE_HYPOTHESIS_SEK.yearly
				})}
			</p>
		</div>
	</details>
	<SettingsRow
		href="/priser"
		title={t('settings.plan.seeAllPlans')}
		note={t('settings.plan.seeAllPlansNote')}
		last
	/>
</SettingsSection>

<style>
	.settings-disclosure {
		border-top: 1px solid var(--color-border);
	}

	.settings-disclosure-summary {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: var(--space-md) var(--space-lg);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
		list-style: none;
	}

	.settings-disclosure-summary::-webkit-details-marker {
		display: none;
	}

	.settings-disclosure-summary::after {
		content: '▾';
		margin-left: auto;
		color: var(--color-text-muted);
		transition: transform 0.15s;
	}

	.settings-disclosure[open] .settings-disclosure-summary::after {
		transform: rotate(180deg);
	}

	.plan-compare .plan-panel {
		border-top: none;
	}

	.plan-panel {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.plan-heading {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.plan-heading:not(:first-child) {
		margin-top: var(--space-md);
	}

	.plan-copy {
		margin: 0;
		font-size: 0.86rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.plan-muted {
		margin-top: var(--space-sm);
	}

	.plan-admin-note {
		padding: var(--space-sm) var(--space-lg) 0;
	}

	.plan-pro-list {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.86rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.plan-pro-list li + li {
		margin-top: 0.25rem;
	}

	.plan-usage-list {
		list-style: none;
		margin: 0 0 var(--space-md);
		padding: 0;
	}

	.plan-usage-list li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-xs) 0;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--color-border);
	}

	.plan-usage-list li.at-limit .plan-usage-value {
		color: var(--color-danger);
		font-weight: 600;
	}

	.plan-usage-label {
		color: var(--color-text-muted);
	}
</style>
