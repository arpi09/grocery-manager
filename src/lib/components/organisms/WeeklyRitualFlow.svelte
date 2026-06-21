<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import AiLoadingSkeleton from '$lib/components/molecules/AiLoadingSkeleton.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import RecipeSuggestionCard from '$lib/components/molecules/RecipeSuggestionCard.svelte';
	import SkafferapportWidget from '$lib/components/molecules/SkafferapportWidget.svelte';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import type { SavingsReport } from '$lib/domain/savings-estimate';
	import { formatCalendarDayLabel } from '$lib/domain/calendar-display';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { DEFAULT_MEAL_INTENT, DEFAULT_RECIPE_PORTIONS, type MealIntent } from '$lib/domain/recipe';
	import type { EatFirstWeekInboundSource } from '$lib/domain/eat-first-week';
	import { shouldShowEatFirstWeekInboundBanner } from '$lib/domain/eat-first-week';
	import { distributeMealDates, getPlanningWindowLabel } from '$lib/domain/weekly-ritual';
	import { getLocale, t } from '$lib/i18n';
	import type { GamificationCelebrationKind } from '$lib/domain/gamification';
	import { getCelebrationRegistryEntry } from '$lib/domain/gamification.registry';
	import { presentCelebration } from '$lib/utils/present-celebration.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import type { ActionData } from '../../../routes/planer/vecka/$types';

	interface PlannedMealPreview {
		id: string;
		title: string;
		plannedDate: string;
	}

	interface Props {
		expiringItems: InventoryItem[];
		planningDates: string[];
		todayIso: string;
		plannedMeals: PlannedMealPreview[];
		savings: SavingsReport;
		canEdit?: boolean;
		householdId?: string | null;
		inboundSource?: EatFirstWeekInboundSource | null;
		expiringCount?: number;
		hasInventory?: boolean;
		form?: ActionData | null;
	}

	let {
		expiringItems,
		planningDates,
		todayIso,
		plannedMeals,
		savings,
		canEdit = false,
		householdId = null,
		inboundSource = null,
		expiringCount = 0,
		hasInventory = false,
		form = null
	}: Props = $props();

	let generating = $state(false);
	let approving = $state(false);
	let mealIntent = $state<MealIntent>(DEFAULT_MEAL_INTENT);
	let suggestions = $state<RecipeIdea[]>([]);
	let scheduleDates = $state<Record<string, string>>({});
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);
	let approved = $state(false);
	let listAddedCount = $state(0);
	let lastHandledGenerateKey = $state<string | null>(null);
	let lastHandledApproveKey = $state<string | null>(null);

	const previewItems = $derived(expiringItems.slice(0, 6));
	const overflowCount = $derived(Math.max(0, expiringItems.length - previewItems.length));
	const hasSuggestions = $derived(suggestions.length > 0);
	const planningWindow = $derived(getPlanningWindowLabel(planningDates));
	const maxPlanningDate = $derived(planningDates[planningDates.length - 1] ?? todayIso);
	const weekLabel = $derived(
		planningWindow
			? `${formatCalendarDayLabel(planningWindow.from, getLocale())} – ${formatCalendarDayLabel(planningWindow.to, getLocale())}`
			: ''
	);
	const showInboundBanner = $derived(shouldShowEatFirstWeekInboundBanner(inboundSource));
	const inboundLead = $derived(
		inboundSource === 'email'
			? t('weeklyRitual.inboundEmailLead', { count: expiringCount })
			: t('weeklyRitual.inboundPushLead', { count: expiringCount })
	);
	const showPreGenerateHint = $derived(
		hasInventory && canEdit && !approved && !hasSuggestions && !generating
	);

	function assignDefaultDates(ideas: RecipeIdea[]) {
		const dates = distributeMealDates(ideas.length);
		const next: Record<string, string> = {};
		for (let index = 0; index < ideas.length; index += 1) {
			const idea = ideas[index]!;
			next[idea.id] = dates[index] ?? planningDates[0] ?? todayIso;
		}
		scheduleDates = next;
	}

	function updateScheduleDate(ideaId: string, event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		scheduleDates = { ...scheduleDates, [ideaId]: target.value };
	}

	function buildAssignments() {
		return suggestions
			.map((idea) => ({
				ideaId: idea.id,
				plannedDate: scheduleDates[idea.id]
			}))
			.filter((entry) => Boolean(entry.plannedDate));
	}

	const generateEnhance = bindSubmitting((value) => {
		generating = value;
		if (value) {
			errorMessage = null;
			note = null;
			approved = false;
		}
	});

	const approveEnhance = bindSubmitting(
		(value) => {
			approving = value;
			if (value) {
				errorMessage = null;
			}
		},
		(formData) => {
			formData.set('assignments', JSON.stringify(buildAssignments()));
			formData.set('addMissingToList', 'true');
		}
	);

	$effect(() => {
		if (!form) return;

		if ('generateSuggestions' in form || 'generateNote' in form || 'generateError' in form) {
			const generateError =
				'generateError' in form && typeof form.generateError === 'string'
					? form.generateError
					: null;
			const generateNote =
				'generateNote' in form && typeof form.generateNote === 'string' ? form.generateNote : null;
			const generateSuggestions =
				'generateSuggestions' in form && Array.isArray(form.generateSuggestions)
					? (form.generateSuggestions as RecipeIdea[])
					: null;
			const key = `${generateError ?? ''}:${generateSuggestions?.length ?? 'x'}:${generateNote ?? ''}`;
			if (key === lastHandledGenerateKey) return;
			lastHandledGenerateKey = key;

			if (generateError) {
				errorMessage = generateError;
				suggestions = [];
				note = null;
				return;
			}

			if (generateSuggestions) {
				suggestions = generateSuggestions;
				note = generateNote;
				assignDefaultDates(suggestions);
				errorMessage =
					suggestions.length === 0 && !note ? t('weeklyRitual.noneGenerated') : null;
				approved = false;
			}
		}

		if ('approveSuccess' in form || 'approveError' in form) {
			const approveError =
				'approveError' in form && typeof form.approveError === 'string' ? form.approveError : null;
			const approveSuccess =
				'approveSuccess' in form &&
				form.approveSuccess &&
				typeof form.approveSuccess === 'object'
					? (form.approveSuccess as {
							mealsScheduled: number;
							listAdded: number;
							celebration?: GamificationCelebrationKind | null;
						})
					: null;
			const key = `${approveError ?? ''}:${approveSuccess?.mealsScheduled ?? 'x'}:${approveSuccess?.listAdded ?? 'x'}`;
			if (key === lastHandledApproveKey) return;
			lastHandledApproveKey = key;

			if (approveError) {
				errorMessage = approveError;
				return;
			}

			if (approveSuccess) {
				showClientToast(
					t('weeklyRitual.approveSuccess', {
						count: approveSuccess.mealsScheduled,
						listAdded: approveSuccess.listAdded
					}),
					{ variant: 'success' }
				);

				if (approveSuccess.celebration && householdId) {
					const entry = getCelebrationRegistryEntry(approveSuccess.celebration);
					presentCelebration({
						kind: approveSuccess.celebration,
						surface: entry?.defaultSurface ?? 'moment',
						householdId,
						metadata:
							approveSuccess.celebration === 'weeklyRitualFirst'
								? { milestoneId: 'weeklyRitualFirst' }
								: undefined
					});
				}

				approved = true;
				listAddedCount = approveSuccess.listAdded;
				suggestions = [];
			}
		}
	});
</script>

<section class="weekly-ritual" aria-labelledby="weekly-ritual-heading">
	<div class="hero-card">
		<div class="hero-copy">
			<span class="hero-badge">{t('weeklyRitual.heroBadge')}</span>
			<h2 id="weekly-ritual-heading">{t('weeklyRitual.heroTitle')}</h2>
			<p class="hero-sub">{t('weeklyRitual.flowLead')}</p>
			{#if weekLabel}
				<p class="week-range">{weekLabel}</p>
			{/if}
		</div>
		<span class="hero-icon" aria-hidden="true">
			<FeatureIcon id="sparkle" size={28} />
		</span>
	</div>

	{#if showInboundBanner}
		<p class="inbound-banner" role="status">
			{inboundLead}
		</p>
	{/if}

	{#if plannedMeals.length > 0}
		<p class="planned-hint" role="status">
			{t('weeklyRitual.plannedThisWeek', { count: plannedMeals.length })}
		</p>
	{/if}

	{#if !hasInventory}
		<section class="empty-pantry" aria-labelledby="weekly-ritual-empty-pantry">
			<h3 id="weekly-ritual-empty-pantry">{t('weeklyRitual.emptyPantryTitle')}</h3>
			<p class="empty-pantry-lead">{t('weeklyRitual.emptyPantryLead')}</p>
			<a class="empty-pantry-cta" href="/scan" data-analytics-id="weekly_ritual.empty_pantry_scan">
				{t('weeklyRitual.emptyPantryCta')}
			</a>
		</section>
	{:else if previewItems.length > 0}
		<ul class="expiring-chips" aria-label={t('eatFirst.expiringLabel')}>
			{#each previewItems as item (item.id)}
				{@const daysLeft = item.expiresOn ? daysUntilExpiry(item.expiresOn) : null}
				<li>
					<Card href="/item/{item.id}/edit" interactive class="expiring-chip">
						<span class="chip-name">{item.name}</span>
						{#if daysLeft !== null}
							<Badge tone="warning">{formatDaysLeft(daysLeft, getLocale())}</Badge>
						{/if}
					</Card>
				</li>
			{/each}
		</ul>
		{#if overflowCount > 0}
			<p class="expiring-overflow">{t('home.expiringMore', { count: overflowCount })}</p>
		{/if}
	{:else}
		<p class="no-expiring">{t('weeklyRitual.noExpiring')}</p>
	{/if}

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	{#if approved}
		<section class="next-step-card" aria-labelledby="weekly-ritual-next-step">
			<span class="next-step-badge">{t('weeklyRitual.nextStepBadge')}</span>
			<h3 id="weekly-ritual-next-step">{t('weeklyRitual.nextStepTitle')}</h3>
			<p class="next-step-lead">
				{t('weeklyRitual.nextStepLead', { count: listAddedCount })}
			</p>
			<a class="next-step-cta" href="/inkop" data-analytics-id="weekly_ritual.next_step_inkop">
				{t('weeklyRitual.nextStepCta')}
			</a>
			<a class="next-step-secondary" href="/planer">{t('weeklyRitual.linkPlaner')}</a>
		</section>
	{:else if canEdit && hasInventory}
		{#if showPreGenerateHint}
			<p class="pre-generate-hint">{t('weeklyRitual.preGenerateHint')}</p>
		{/if}

		<form method="POST" action="?/generate" class="actions" use:enhance={generateEnhance}>
			<input type="hidden" name="mealIntent" value={mealIntent} />
			<Button
				type="submit"
				loading={generating}
				disabled={approving}
				data-analytics-id="weekly_ritual.generate"
			>
				{t('weeklyRitual.generateBtn')}
			</Button>
		</form>

		{#if generating}
			<AiLoadingSkeleton messageKey="ai.loadingWeekly" />
		{/if}

		{#if note}
			<p class="note">{note}</p>
		{/if}

		{#if hasSuggestions}
			<ul class="suggestions motion-stagger-children">
				{#each suggestions as idea (idea.id)}
					<li class="suggestion-row">
						<label class="date-field">
							<span class="date-label">{t('planer.addMeal')}</span>
							<input
								type="date"
								class="date-input"
								value={scheduleDates[idea.id] ?? ''}
								min={todayIso}
								max={maxPlanningDate}
								onchange={(event) => updateScheduleDate(idea.id, event)}
							/>
						</label>
						<RecipeSuggestionCard
							title={idea.title}
							whyItFits={idea.whyItFits}
							ingredientsToUse={idea.ingredientsToUse}
							missingIngredients={idea.missingIngredients}
							steps={idea.steps}
							portions={DEFAULT_RECIPE_PORTIONS}
						/>
					</li>
				{/each}
			</ul>

			<form method="POST" action="?/approve" class="approve-wrap" use:enhance={approveEnhance}>
				<Button
					type="submit"
					loading={approving}
					disabled={generating}
					data-analytics-id="weekly_ritual.approve"
				>
					{t('weeklyRitual.approveBtn')}
				</Button>
			</form>
		{/if}
	{:else if !hasInventory}
		<!-- empty pantry state above replaces generate flow -->
	{:else}
		<p class="readonly-hint">{t('weeklyRitual.readonlyHint')}</p>
	{/if}

	{#if savings.hasData}
		<SkafferapportWidget {savings} />
	{/if}
</section>

<style>
	.weekly-ritual {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.hero-card {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 12%, var(--color-surface)),
			var(--color-surface)
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
	}

	.hero-badge {
		display: inline-block;
		margin-bottom: var(--space-xs);
		padding: 0.15rem 0.55rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		border-radius: 999px;
	}

	.hero-copy h2 {
		margin: 0;
		font-size: 1.35rem;
		letter-spacing: -0.02em;
	}

	.hero-sub,
	.week-range,
	.inbound-banner,
	.planned-hint,
	.no-expiring,
	.note,
	.readonly-hint,
	.expiring-overflow,
	.pre-generate-hint,
	.empty-pantry-lead {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.week-range {
		margin-top: var(--space-xs);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.inbound-banner {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface));
		font-weight: 600;
		color: var(--color-text);
	}

	.empty-pantry {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		border: 1px dashed var(--color-border);
		background: var(--color-surface-muted);
	}

	.empty-pantry h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.empty-pantry-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		align-self: flex-start;
		min-height: var(--touch-target-min);
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.empty-pantry-cta:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	.expiring-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.weekly-ritual :global(.expiring-chip) {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
	}

	.chip-name {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.suggestions {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.suggestion-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.date-field {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.date-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.date-input {
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
		background: var(--color-surface);
	}

	.approve-wrap {
		align-self: flex-start;
	}

	.next-step-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)),
			var(--color-surface)
		);
		box-shadow: var(--shadow-md);
	}

	.next-step-badge {
		align-self: flex-start;
		padding: 0.15rem 0.55rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		border-radius: 999px;
	}

	.next-step-card h3 {
		margin: 0;
		font-size: 1.2rem;
		letter-spacing: -0.02em;
	}

	.next-step-lead {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.next-step-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		margin-top: var(--space-xs);
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.next-step-cta:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	.next-step-secondary {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	@media (max-width: 600px) {
		.hero-card {
			flex-direction: column;
			align-items: stretch;
		}

		.approve-wrap,
		.actions,
		.empty-pantry-cta {
			align-self: stretch;
		}

		.approve-wrap :global(.btn),
		.actions :global(.btn) {
			width: 100%;
		}

		.empty-pantry-cta {
			justify-content: center;
		}
	}
</style>
