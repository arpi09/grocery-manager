<script lang="ts">

	import Card from '$lib/components/atoms/Card.svelte';

	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';

	import EmptyState from '$lib/components/molecules/EmptyState.svelte';

	import MilestonesSection from '$lib/components/molecules/MilestonesSection.svelte';

	import StatistikSpendHero from '$lib/components/molecules/StatistikSpendHero.svelte';

	import StatistikSpendTrend from '$lib/components/molecules/StatistikSpendTrend.svelte';

	import StatistikInsightCards from '$lib/components/molecules/StatistikInsightCards.svelte';

	import { EMPTY_RECEIPT_SPEND_REPORT } from '$lib/domain/receipt-spend';

	import type { StatistikDashboard, StatistikRapportLink } from '$lib/application/statistik.service';

	import { ZERO_WASTE_STREAK_CELEBRATION, type MilestoneState } from '$lib/domain/gamification';

	import { eatFirstWeekHref } from '$lib/navigation/context-hrefs';



	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';

	import { getLocale, t } from '$lib/i18n';

	import { locationLabel } from '$lib/i18n/domain-labels';



	type StatistikTab = 'overview' | 'money' | 'more';



	interface Props {

		dashboard: StatistikDashboard;

		milestones?: MilestoneState[];

		householdId?: string | null;

		isPro?: boolean;

		rapportLink?: StatistikRapportLink | null;

	}



	let {
		dashboard,
		milestones = [],
		householdId = null,
		isPro = false,
		rapportLink = null
	}: Props = $props();

	const analytics = $derived(dashboard.analytics);
	const addedTrend = $derived(dashboard.addedTrend);
	const addedWeekOverWeek = $derived(dashboard.addedWeekOverWeek);
	const impact = $derived(dashboard.impact);
	const savings = $derived(dashboard.savings);
	const spend = $derived(dashboard.spend ?? EMPTY_RECEIPT_SPEND_REPORT);
	const highlights = $derived(dashboard.highlights ?? []);

	const isEmpty = $derived(analytics.totalItems === 0);

	const showDashboard = $derived(!isEmpty || spend.hasData);



	let activeTab = $state<StatistikTab>('overview');



	const locationIcons: Record<StorageLocation, FeatureIconId> = {

		fridge: 'fridge',

		freezer: 'freezer',

		cupboard: 'cupboard'

	};



	function formatDelta(delta: number | null | undefined): string {

		if (delta == null) return '—';

		return delta > 0 ? `+${delta}` : String(delta);

	}



	function formatOptional(value: number | null | undefined): string {

		return value == null ? '—' : String(value);

	}



	function weekLabel(label: string): string {

		return label === 'current' ? t('stats.trendCurrentWeek') : label;

	}



	function selectTab(tab: StatistikTab) {

		if (tab === activeTab) return;

		activeTab = tab;

	}

</script>



<section class="statistik" aria-labelledby="statistik-overview-heading">

	<h2 id="statistik-overview-heading" class="sr-only">{t('stats.overviewHeading')}</h2>



	{#if !showDashboard}

		<EmptyState

			iconId="barcode"

			title={t('stats.emptyTitle')}

			description={t('stats.emptyDescription')}

			actionLabel={t('stats.emptyActionScan')}

			actionHref="/scan?mode=barcode&from=/statistik"

			secondaryActionLabel={t('stats.emptyActionPhoto')}

			secondaryActionHref="/scan?mode=photo&from=/statistik"

		/>

	{:else}

		<div class="tablist" role="tablist" aria-label={t('stats.tabsAria')}>

			<button

				type="button"

				role="tab"

				class:active={activeTab === 'overview'}

				aria-selected={activeTab === 'overview'}

				data-testid="statistik-tab-overview"

				onclick={() => selectTab('overview')}

			>

				{t('stats.tabs.overview')}

			</button>

			<button

				type="button"

				role="tab"

				class:active={activeTab === 'money'}

				aria-selected={activeTab === 'money'}

				data-testid="statistik-tab-money"

				onclick={() => selectTab('money')}

			>

				{t('stats.tabs.money')}

			</button>

			<button

				type="button"

				role="tab"

				class:active={activeTab === 'more'}

				aria-selected={activeTab === 'more'}

				data-testid="statistik-tab-more"

				onclick={() => selectTab('more')}

			>

				{t('stats.tabs.more')}

			</button>

		</div>



		{#if activeTab === 'overview'}

			<div role="tabpanel" class="tab-panel motion-fade-in" data-testid="statistik-panel-overview">

				<StatistikSpendHero {spend} />

				<StatistikInsightCards {highlights} />

				<div class="compact-grid" aria-label={t('stats.heroLabel')}>

					<Card class="compact-card">

						<p class="compact-value" class:alert={analytics.expiringSoonCount > 0}>

							{analytics.expiringSoonCount}

						</p>

						<p class="compact-label">{t('stats.expiringThisWeek')}</p>

					</Card>

					<Card class="compact-card compact-primary">

						<p class="compact-value">{analytics.totalItems}</p>

						<p class="compact-label">{t('stats.itemsInPantry')}</p>

					</Card>

				</div>



				{#if impact.hasConsumptionData || spend.hasData}
					<Card href="/statistik/wrapped" interactive class="wrapped-entry">

						<h2 class="section-title">{t('stats.wrappedCta')}</h2>

						<p class="section-lead">{t('stats.wrappedLead')}</p>

					</Card>

				{/if}

			</div>

		{:else if activeTab === 'money'}

			<div role="tabpanel" class="tab-panel tab-panel-money motion-fade-in" data-testid="statistik-panel-money">

				<StatistikSpendTrend {spend} />

				{#if rapportLink}
					<Card href={rapportLink.href} interactive class="rapport-link-card">
						<h2 class="section-title">{t('stats.rapportLinkTitle', { month: rapportLink.month })}</h2>
						<p class="section-lead">{t('stats.rapportLinkLead')}</p>
					</Card>
				{/if}

			</div>

		{:else}

			<div role="tabpanel" class="tab-panel motion-fade-in" data-testid="statistik-panel-more">

				<Card>

					<h2 class="section-title">{t('stats.impactTitle')}</h2>

					<p class="section-lead">{t('stats.impactLead')}</p>

					<div class="impact-grid">

						<div>

							<p class="impact-value">{formatOptional(impact.consumedThisWeek)}</p>

							<p class="impact-label">{t('stats.usedBeforeExpiry')}</p>

						</div>

						<div

							class="impact-streak"

							class:impact-streak-active={(impact.zeroWasteWeeks ?? 0) >= ZERO_WASTE_STREAK_CELEBRATION}

						>

							<p class="impact-value">{formatOptional(impact.zeroWasteWeeks)}</p>

							<p class="impact-label">{t('stats.zeroWasteWeeks')}</p>

						</div>

						<div>

							<p class="impact-value">{analytics.distinctProducts}</p>

							<p class="impact-label">{t('stats.uniqueProducts')}</p>

						</div>

					</div>

					{#if !impact.hasConsumptionData}

						<p class="muted">{t('stats.impactPlaceholder')}</p>

					{/if}

				</Card>



				{#if savings.hasData}

					<Card class="savings-note">

						<p class="savings-line">

							{t('skafferapport.saved', { sek: savings.savedSek, kg: savings.savedKg })}

						</p>

						<p class="muted">{t('skafferapport.lead')}</p>

					</Card>

				{/if}



				{#if milestones.length > 0}

					<Card class="progress-hub">

						<h2 class="section-title">{t('gamification.progressHubTitle')}</h2>

						<p class="section-lead">{t('gamification.progressHubLead')}</p>

					</Card>

					<MilestonesSection {milestones} {householdId} />

				{/if}



				<div class="trends">

					<Card>

						<h2 class="section-title label-caps">{t('stats.addedTrendTitle')}</h2>

						<p class="section-lead">{t('stats.addedTrendLead')}</p>

						<ul class="trend-stats" aria-label={t('stats.addedTrendTitle')}>

							{#each addedTrend as bar (bar.weekStart)}

								<li class="trend-stat" class:trend-stat-current={bar.label === 'current'}>

									<span class="trend-week">{weekLabel(bar.label)}</span>

									<span class="trend-value" aria-label={t('stats.trendCountAria', { count: bar.count })}>

										{bar.count}

									</span>

								</li>

							{/each}

						</ul>

						{#if addedWeekOverWeek}

							<p class="hero-meta">

								{t('stats.vsLastWeek', { delta: formatDelta(addedWeekOverWeek.delta) })}

							</p>

						{/if}

					</Card>

					<Card>

						<h2 class="section-title label-caps">{t('stats.consumedTrendTitle')}</h2>

						<p class="section-lead">{t('stats.consumedTrendLead')}</p>

						{#if impact.hasConsumptionData}

							<ul class="trend-stats" aria-label={t('stats.consumedTrendTitle')}>

								{#each impact.consumedTrend as bar (bar.weekStart)}

									<li class="trend-stat" class:trend-stat-current={bar.label === 'current'}>

										<span class="trend-week">{weekLabel(bar.label)}</span>

										<span

											class="trend-value"

											aria-label={t('stats.trendCountAria', { count: bar.count })}

										>

											{bar.count}

										</span>

									</li>

								{/each}

							</ul>

						{:else}

							<p class="muted">{t('stats.consumedTrendEmpty')}</p>

						{/if}

					</Card>

				</div>



				<Card>

					<h2 class="section-title label-caps">{t('stats.byLocation')}</h2>

					<ul class="bars">

						{#each analytics.byLocationBars as bar (bar.location)}

							<li>

								<div class="bar-header">

									<span class="bar-label">

										<FeatureIcon id={locationIcons[bar.location]} size={18} />

										{locationLabel(getLocale(), bar.location)}

									</span>

									<span>{bar.count}</span>

								</div>

								<div class="track" aria-hidden="true">

									<div

										class="fill"

										style="width:{bar.percent}%; background:{LOCATION_COLORS[bar.location]}"

									></div>

								</div>

							</li>

						{/each}

					</ul>

				</Card>



				<div class="actions">

					<Card href={eatFirstWeekHref('stats')} interactive class="action-card">

						<FeatureIcon id="home" size={22} />

						<div>

							<h2>{t('stats.eatFirstCta')}</h2>

							<p>{t('stats.eatFirstLead')}</p>

						</div>

					</Card>

					<Card href="/scan?mode=photo&from=/statistik" interactive class="action-card">

						<FeatureIcon id="photo" size={22} />

						<div>

							<h2>{t('stats.scanCta')}</h2>

							<p>{t('stats.scanLead')}</p>

						</div>

					</Card>

				</div>



				{#if !isPro}

					<Card class="pro-teaser">

						<p class="pro-badge label-caps">{t('stats.proBadge')}</p>

						<h2>{t('stats.proTitle')}</h2>

						<p class="muted">{t('stats.proLead')}</p>

						<a href="/settings#plan-upgrade">{t('proUpgrade.cta')}</a>

					</Card>

				{/if}

			</div>

		{/if}

	{/if}

</section>



<style>

	.statistik {

		display: flex;

		flex-direction: column;

		gap: var(--page-section-gap);

		min-width: 0;

	}



	.tablist {

		display: flex;

		background: var(--color-surface-muted);

		border-radius: var(--radius-md);

		padding: 3px;

		border: 1px solid var(--color-border);

		gap: 3px;

	}



	.tablist button {

		flex: 1;

		min-height: 2.75rem;

		border: none;

		border-radius: calc(var(--radius-md) - 2px);

		background: transparent;

		font-weight: 600;

		font-size: 0.9375rem;

		color: var(--color-text-muted);

		cursor: pointer;

	}



	.tablist button.active {

		background: var(--color-surface);

		color: var(--color-text);

		box-shadow: 0 1px 2px rgba(31, 42, 36, 0.08);

	}



	.tablist button:focus-visible {

		outline: 2px solid var(--color-primary);

		outline-offset: 2px;

	}



	.tab-panel {

		display: flex;

		flex-direction: column;

		gap: var(--page-section-gap);

	}



	.tab-panel-money {

		gap: var(--space-md);

	}



	:global(.rapport-link-card) {

		background: linear-gradient(

			155deg,

			color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)),

			var(--color-surface)

		);

		border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));

	}



	:global(.wrapped-entry) {

		background: linear-gradient(

			155deg,

			color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)),

			var(--color-surface)

		);

		border-color: color-mix(in srgb, var(--color-primary) 22%, var(--color-border));

	}



	:global(.progress-hub) {

		background: linear-gradient(

			160deg,

			color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)),

			var(--color-surface)

		);

		border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-border));

	}



	.compact-grid {

		display: grid;

		gap: var(--space-md);

		grid-template-columns: repeat(2, minmax(0, 1fr));

	}



	:global(.compact-card) {

		text-align: center;

		padding: var(--space-md);

	}



	:global(.compact-primary) {

		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));

	}



	.compact-value {

		margin: 0;

		font-size: 1.75rem;

		font-weight: 800;

		color: var(--color-primary);

		font-variant-numeric: tabular-nums;

	}



	.compact-value.alert {

		color: var(--color-warning, #c27803);

	}



	.compact-label,

	.impact-label,

	.section-lead,

	.muted {

		color: var(--color-text-muted);

		font-size: 0.85rem;

	}



	.compact-label {

		margin: var(--space-xs) 0 0;

	}



	.hero-meta {

		margin: var(--space-xs) 0 0;

		font-size: 0.75rem;

		color: var(--color-text-muted);

	}



	.section-title {

		margin: 0 0 var(--space-sm);

		font-size: 0.95rem;

		font-weight: 700;

	}



	.impact-grid,

	.trends,

	.actions {

		display: grid;

		gap: var(--space-md);

	}



	.impact-grid {

		grid-template-columns: repeat(3, 1fr);

		text-align: center;

	}



	.impact-value {

		margin: 0;

		font-size: 1.5rem;

		font-weight: 700;

	}



	.impact-streak-active .impact-value {

		color: var(--color-primary);

	}



	.impact-streak-active {

		padding: var(--space-xs);

		border-radius: var(--radius-md);

		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));

	}



	.savings-line {

		margin: 0 0 var(--space-xs);

		font-weight: 700;

		font-size: 0.95rem;

	}



	.trend-stats,

	.bars {

		list-style: none;

		margin: var(--space-sm) 0 0;

		padding: 0;

		display: flex;

		flex-direction: column;

		gap: 0;

	}



	.trend-stat,

	.bar-header {

		display: flex;

		justify-content: space-between;

		align-items: center;

		gap: var(--space-sm);

		font-size: 0.875rem;

		padding: 0.45rem 0.55rem;

		border-radius: var(--radius-sm);

		min-height: 2.75rem;

	}



	.trend-stat-current {

		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));

	}



	.trend-week {

		color: var(--color-text-muted);

	}



	.trend-stat-current .trend-week {

		color: var(--color-text);

		font-weight: 600;

	}



	.trend-value {

		min-width: 2rem;

		text-align: right;

		font-weight: 800;

		font-size: 1rem;

		font-variant-numeric: tabular-nums;

		color: var(--color-primary);

	}



	.track {

		height: 0.45rem;

		background: var(--color-border);

		border-radius: var(--radius-sm);

		overflow: hidden;

	}



	.fill {

		height: 100%;

		border-radius: var(--radius-sm);

	}



	:global(.action-card) {

		display: flex;

		gap: var(--space-md);

		align-items: flex-start;

	}



	:global(.action-card) h2 {

		margin: 0;

		font-size: 1rem;

	}



	:global(.action-card) p {

		margin: var(--space-xs) 0 0;

		color: var(--color-text-muted);

		font-size: 0.85rem;

	}



	:global(.pro-teaser) {

		border-style: dashed;

	}



	.pro-badge {

		margin: 0 0 var(--space-sm);

		color: var(--color-primary);

		font-size: 0.7rem;

		font-weight: 700;

	}



	@media (min-width: 768px) {

		.trends {

			grid-template-columns: 1fr 1fr;

		}



		.actions {

			grid-template-columns: 1fr 1fr;

		}

	}



	@media (max-width: 479px) {

		.impact-grid {

			grid-template-columns: 1fr;

			gap: var(--space-sm);

		}



		.trend-stat,

		.bar-header {

			flex-wrap: wrap;

		}

	}



	@media (prefers-reduced-motion: reduce) {

		.tab-panel {

			animation: none;

		}

	}

</style>


