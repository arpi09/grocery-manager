<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { celebrationMessage } from '$lib/utils/gamification-celebrate';
	import {
		markCelebrationShown,
		shouldShowCelebration
	} from '$lib/utils/gamification-celebrations';
	import {
		addMissingIngredientsToList,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
	} from '$lib/utils/recipe-add-missing';

	interface Props {
		expiringItems: InventoryItem[];
		canEdit?: boolean;
		householdId?: string | null;
	}

	let { expiringItems, canEdit = false, householdId = null }: Props = $props();

	let loading = $state(false);
	let suggestions = $state<RecipeIdea[]>([]);
	let errorMessage = $state<string | null>(null);
	let addingMissingKey = $state<string | null>(null);
	let schedulingKey = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);
	let scheduleDates = $state<Record<string, string>>({});

	const todayIso = new Date().toISOString().slice(0, 10);
	const previewItems = $derived(expiringItems.slice(0, 5));
	const overflowCount = $derived(Math.max(0, expiringItems.length - previewItems.length));
	const hasSuggestions = $derived(suggestions.length > 0);

	async function generateSuggestions() {
		loading = true;
		errorMessage = null;
		feedbackBanner = null;

		try {
			const response = await fetch('/api/eat-first', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});

			const data = (await response.json()) as {
				error?: string;
				suggestions?: RecipeIdea[];
			};

			if (!response.ok) {
				errorMessage = data.error ?? t('eatFirst.generateFailed');
				suggestions = [];
				return;
			}

			suggestions = data.suggestions ?? [];

			if (suggestions.length === 0) {
				errorMessage = t('eatFirst.noneGenerated');
			}
		} catch {
			errorMessage = t('recipe.networkError');
			suggestions = [];
		} finally {
			loading = false;
		}
	}

	async function addMissing(idea: RecipeIdea) {
		if (!canEdit || idea.missingIngredients.length === 0) {
			return;
		}

		addingMissingKey = idea.id;
		feedbackBanner = null;
		const presented = presentAddMissingFeedback(
			getLocale(),
			await addMissingIngredientsToList(idea.missingIngredients)
		);
		toastMessage = presented.message;
		feedbackBanner = presented;
		addingMissingKey = null;
	}

	async function scheduleIdea(idea: RecipeIdea) {
		const plannedDate = scheduleDates[idea.id];
		if (!canEdit || !plannedDate) {
			return;
		}

		schedulingKey = idea.id;
		errorMessage = null;

		try {
			const response = await fetch('/api/planer/schedule-idea', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ideaId: idea.id, plannedDate })
			});

			const data = (await response.json()) as {
				error?: string;
				ok?: boolean;
				celebration?: 'eatFirstRitual';
			};

			if (!response.ok) {
				errorMessage = data.error ?? t('eatFirst.scheduleFailed');
				return;
			}

			toastMessage = t('eatFirst.scheduleSuccess', { title: idea.title, date: plannedDate });

			if (
				data.celebration === 'eatFirstRitual' &&
				householdId &&
				shouldShowCelebration('eatFirstRitual', householdId)
			) {
				toastMessage = `${toastMessage} ${celebrationMessage(getLocale(), 'eatFirstRitual')}`;
				markCelebrationShown('eatFirstRitual', householdId);
			}
		} catch {
			errorMessage = t('eatFirst.scheduleFailed');
		} finally {
			schedulingKey = null;
		}
	}

	function updateScheduleDate(ideaId: string, event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		scheduleDates = { ...scheduleDates, [ideaId]: target.value };
	}

	function dismissToast() {
		toastMessage = null;
	}
</script>

<section id="eat-first" class="eat-first motion-fade-in" aria-labelledby="eat-first-heading">
	<div class="hero-card">
		<div class="hero-copy">
			<span class="hero-badge">{t('eatFirst.badge')}</span>
			<h2 id="eat-first-heading">{t('eatFirst.title')}</h2>
			<p class="hero-sub">{t('eatFirst.subtitle')}</p>
		</div>
		<span class="hero-icon" aria-hidden="true">
			<FeatureIcon id="sparkle" size={28} />
		</span>
	</div>

	{#if previewItems.length > 0}
		<ul class="expiring-chips motion-stagger-children" aria-label={t('eatFirst.expiringLabel')}>
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
		<p class="no-expiring">{t('eatFirst.noExpiring')}</p>
	{/if}

	{#if canEdit}
		<div class="actions">
			<Button
				type="button"
				onclick={generateSuggestions}
				loading={loading}
				loadingLabel={t('common.thinking')}
				fullWidth
			>
				{t('eatFirst.generateBtn')}
			</Button>
		</div>
	{/if}

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	{#if hasSuggestions}
		{#if feedbackBanner}
			<AddMissingFeedback feedback={feedbackBanner} />
		{/if}

		<div class="suggestions">
			<h3>{t('eatFirst.suggestionsTitle')}</h3>
			{#each suggestions as idea (idea.id)}
				<article class="suggestion-card">
					<h4>{idea.title}</h4>
					<p class="why">{idea.whyItFits}</p>
					<p class="uses">
						<strong>{t('recipe.fromStock')}</strong>
						{idea.ingredientsToUse.join(', ')}
					</p>
					{#if idea.missingIngredients.length > 0}
						<p class="missing">
							<strong>{t('planer.missingLabel')}</strong>
							{idea.missingIngredients.join(', ')}
						</p>
					{/if}

					{#if canEdit}
						<div class="suggestion-actions">
							<label class="date-label">
								{t('planer.scheduleDate')}
								<input
									type="date"
									min={todayIso}
									value={scheduleDates[idea.id] ?? ''}
									oninput={(event) => updateScheduleDate(idea.id, event)}
								/>
							</label>
							<div class="btn-row">
								<Button
									type="button"
									loading={schedulingKey === idea.id}
									loadingLabel={t('common.loading')}
									onclick={() => scheduleIdea(idea)}
									disabled={!scheduleDates[idea.id]}
								>
									{t('eatFirst.addToPlan')}
								</Button>
								{#if idea.missingIngredients.length > 0}
									<Button
										type="button"
										variant="ghost"
										loading={addingMissingKey === idea.id}
										loadingLabel={t('common.loading')}
										onclick={() => addMissing(idea)}
									>
										{t('recipe.addMissingBtnShort', { count: idea.missingIngredients.length })}
									</Button>
								{/if}
							</div>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>

{#if toastMessage}
	<Toast message={toastMessage} visible={true} onDismiss={dismissToast} />
{/if}

<style>
	.eat-first {
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
			color-mix(in srgb, var(--color-warning) 18%, var(--color-surface)),
			color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))
		);
		border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
		box-shadow: var(--shadow-md);
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
		font-size: 1.25rem;
		letter-spacing: -0.02em;
	}

	.hero-sub {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
		max-width: 42ch;
	}

	.hero-icon {
		flex-shrink: 0;
		display: flex;
		color: var(--color-primary);
		opacity: 0.85;
	}

	.expiring-chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	:global(.expiring-chip) {
		display: inline-flex !important;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md) !important;
	}

	.chip-name {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.expiring-overflow,
	.no-expiring {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.actions {
		margin-top: var(--space-xs);
	}

	.suggestions h3 {
		margin: 0 0 var(--space-sm);
		font-size: 1rem;
	}

	.suggestion-card {
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.suggestion-card + .suggestion-card {
		margin-top: var(--space-sm);
	}

	.suggestion-card h4 {
		margin: 0 0 var(--space-xs);
	}

	.why,
	.uses,
	.missing {
		margin: 0 0 var(--space-xs);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.suggestion-actions {
		margin-top: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.date-label {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.date-label input {
		padding: 0.45rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.btn-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
