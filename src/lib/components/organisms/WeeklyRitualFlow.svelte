<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
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
	import { distributeMealDates, getPlanningWindowLabel } from '$lib/domain/weekly-ritual';
	import { getLocale, t } from '$lib/i18n';
	import type { GamificationCelebrationKind } from '$lib/domain/gamification';
	import { getCelebrationRegistryEntry } from '$lib/domain/gamification.registry';
	import { presentCelebration } from '$lib/utils/present-celebration.svelte';
	import { aiServiceErrorMessage } from '$lib/utils/ai-service-error';

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
	}

	let {
		expiringItems,
		planningDates,
		todayIso,
		plannedMeals,
		savings,
		canEdit = false,
		householdId = null
	}: Props = $props();

	let loading = $state(false);
	let approving = $state(false);
	let mealIntent = $state<MealIntent>(DEFAULT_MEAL_INTENT);
	let suggestions = $state<RecipeIdea[]>([]);
	let scheduleDates = $state<Record<string, string>>({});
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);
	let approved = $state(false);

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

	function assignDefaultDates(ideas: RecipeIdea[]) {
		const dates = distributeMealDates(ideas.length);
		const next: Record<string, string> = {};
		for (let index = 0; index < ideas.length; index += 1) {
			const idea = ideas[index]!;
			next[idea.id] = dates[index] ?? planningDates[0] ?? todayIso;
		}
		scheduleDates = next;
	}

	async function generateSuggestions() {
		loading = true;
		errorMessage = null;
		note = null;
		approved = false;

		try {
			const response = await fetch('/api/eat-first', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mealIntent })
			});

			const data = (await response.json()) as {
				error?: string;
				note?: string;
				suggestions?: RecipeIdea[];
			};

			if (!response.ok) {
				errorMessage = aiServiceErrorMessage(response.status, data.error, 'weeklyRitual.generateFailed');
				suggestions = [];
				return;
			}

			suggestions = data.suggestions ?? [];
			note = data.note ?? null;
			assignDefaultDates(suggestions);

			if (suggestions.length === 0 && !note) {
				errorMessage = t('weeklyRitual.noneGenerated');
			}
		} catch {
			errorMessage = t('weeklyRitual.networkError');
			suggestions = [];
		} finally {
			loading = false;
		}
	}

	function updateScheduleDate(ideaId: string, event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		scheduleDates = { ...scheduleDates, [ideaId]: target.value };
	}

	async function approveWeek() {
		if (!canEdit || suggestions.length === 0) {
			return;
		}

		const assignments = suggestions
			.map((idea) => ({
				ideaId: idea.id,
				plannedDate: scheduleDates[idea.id]
			}))
			.filter((entry) => Boolean(entry.plannedDate));

		if (assignments.length === 0) {
			errorMessage = t('weeklyRitual.approveFailed');
			return;
		}

		const hasPastDate = assignments.some(
			(entry) => entry.plannedDate != null && entry.plannedDate < todayIso
		);
		if (hasPastDate) {
			errorMessage = t('weeklyRitual.approveFailed');
			return;
		}

		approving = true;
		errorMessage = null;

		try {
			const response = await fetch('/api/planer/weekly-ritual/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignments, addMissingToList: true })
			});

			const data = (await response.json()) as {
				error?: string;
				ok?: boolean;
				mealsScheduled?: number;
				listAdded?: number;
				celebration?: GamificationCelebrationKind;
			};

			if (!response.ok) {
				errorMessage = data.error ?? t('weeklyRitual.approveFailed');
				return;
			}

			showClientToast(
				t('weeklyRitual.approveSuccess', {
					count: data.mealsScheduled ?? assignments.length,
					listAdded: data.listAdded ?? 0
				}),
				{ variant: 'success' }
			);

			if (data.celebration && householdId) {
				const entry = getCelebrationRegistryEntry(data.celebration);
				presentCelebration({
					kind: data.celebration,
					surface: entry?.defaultSurface ?? 'moment',
					householdId,
					metadata:
						data.celebration === 'weeklyRitualFirst'
							? { milestoneId: 'weeklyRitualFirst' }
							: undefined
				});
			}
			approved = true;
			suggestions = [];
		} catch {
			errorMessage = t('weeklyRitual.approveFailed');
		} finally {
			approving = false;
		}
	}
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

	{#if plannedMeals.length > 0}
		<p class="planned-hint" role="status">
			{t('weeklyRitual.plannedThisWeek', { count: plannedMeals.length })}
		</p>
	{/if}

	{#if previewItems.length > 0}
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
		<FeedbackBanner tone="success" message={t('weeklyRitual.successTitle')} />
		<div class="post-approve-links">
			<a href="/planer">{t('weeklyRitual.linkPlaner')}</a>
			<a href="/inkop">{t('weeklyRitual.linkInkop')}</a>
		</div>
	{:else if canEdit}
		<div class="actions">
			<Button type="button" loading={loading} disabled={approving} onclick={generateSuggestions}>
				{t('weeklyRitual.generateBtn')}
			</Button>
		</div>

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

			<div class="approve-wrap">
			<Button type="button" loading={approving} disabled={loading} onclick={approveWeek}>
				{t('weeklyRitual.approveBtn')}
			</Button>
			</div>
		{/if}
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
	.planned-hint,
	.no-expiring,
	.note,
	.readonly-hint,
	.expiring-overflow {
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

	.post-approve-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		font-weight: 600;
		font-size: 0.9rem;
	}

	@media (max-width: 600px) {
		.hero-card {
			flex-direction: column;
			align-items: stretch;
		}

		.approve-wrap {
			align-self: stretch;
		}

		.approve-wrap :global(.btn) {
			width: 100%;
		}
	}
</style>
