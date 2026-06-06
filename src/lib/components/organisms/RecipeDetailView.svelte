<script lang="ts">
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import RecipeIngredientChecklist from '$lib/components/molecules/RecipeIngredientChecklist.svelte';
	import RecipeStepTimeline from '$lib/components/molecules/RecipeStepTimeline.svelte';
	import { DEFAULT_RECIPE_PORTIONS, totalMinutes } from '$lib/domain/recipe';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { getLocale, t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		addMissingIngredientsToList,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
	} from '$lib/utils/recipe-add-missing';

	interface Props {
		idea: RecipeIdea;
		portions?: number;
		canEdit?: boolean;
		showBackLink?: boolean;
	}

	let {
		idea,
		portions = DEFAULT_RECIPE_PORTIONS,
		canEdit = false,
		showBackLink = true
	}: Props = $props();

	let addingMissing = $state(false);
	let scheduling = $state(false);
	let scheduleDate = $state('');
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);

	const stepCount = $derived(idea.steps.length);
	const missingCount = $derived(idea.missingIngredients.length);
	const estimatedMinutes = $derived(totalMinutes(idea.steps));

	function startCooking() {
		void goto(`/recept/${idea.id}/laga`);
	}

	async function addMissing() {
		if (!canEdit || idea.missingIngredients.length === 0) {
			return;
		}

		addingMissing = true;
		feedbackBanner = null;
		const presented = presentAddMissingFeedback(
			getLocale(),
			await addMissingIngredientsToList(idea.missingIngredients)
		);
		showClientToast(presented.message, {
			variant: presented.tone === 'error' ? 'error' : presented.tone === 'warning' ? 'info' : 'success'
		});
		feedbackBanner = presented;
		addingMissing = false;
	}

	async function scheduleToCalendar() {
		if (!canEdit || !scheduleDate) {
			return;
		}

		scheduling = true;
		try {
			const response = await fetch('/api/planer/schedule-idea', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ideaId: idea.id, plannedDate: scheduleDate })
			});

			const data = (await response.json()) as { error?: string; ok?: boolean };

			if (!response.ok) {
				showClientToast(data.error ?? t('eatFirst.scheduleFailed'), { variant: 'error' });
				return;
			}

			showClientToast(t('eatFirst.scheduleSuccess', { title: idea.title, date: scheduleDate }), {
				variant: 'success'
			});
		} catch {
			showClientToast(t('eatFirst.scheduleFailed'), { variant: 'error' });
		} finally {
			scheduling = false;
		}
	}
</script>

<article class="recipe-detail" data-testid="recipe-detail">
	{#if showBackLink}
		<a href="/hem" class="back-link">{t('recipe.detail.back')}</a>
	{/if}

	<header class="recipe-hero">
		<h1 class="recipe-title">{idea.title}</h1>
		<p class="recipe-lead">{idea.whyItFits}</p>
		<div class="meta-row" aria-label={t('recipe.metaAria')}>
			<Badge tone="default">{t('recipe.portionsBadge', { count: portions })}</Badge>
			{#if estimatedMinutes}
				<Badge tone="default">{t('recipe.totalMinutesBadge', { count: estimatedMinutes })}</Badge>
			{/if}
			{#if stepCount > 0}
				<Badge tone="default">{t('recipe.stepCount', { count: stepCount })}</Badge>
			{/if}
			{#if missingCount > 0}
				<Badge tone="warning">{t('recipe.missingBadge', { count: missingCount })}</Badge>
			{/if}
		</div>
	</header>

	<div class="cta-row">
		<Button type="button" fullWidth onclick={startCooking} data-testid="recipe-start-cooking">
			{t('recipe.detail.startCooking')}
		</Button>
		{#if canEdit && missingCount > 0}
			<Button
				type="button"
				variant="secondary"
				fullWidth
				loading={addingMissing}
				loadingLabel={t('common.loading')}
				onclick={addMissing}
			>
				{t('recipe.addMissingBtnShort', { count: missingCount })}
			</Button>
		{/if}
	</div>

	{#if feedbackBanner}
		<AddMissingFeedback feedback={feedbackBanner} />
	{/if}

	{#if canEdit}
		<section class="schedule-section" aria-label={t('recipe.detail.scheduleAria')}>
			<h2 class="section-label">{t('recipe.detail.scheduleTitle')}</h2>
			<div class="schedule-row">
				<label class="schedule-label" for="recipe-schedule-date">
					{t('recipe.detail.scheduleDate')}
					<input id="recipe-schedule-date" type="date" bind:value={scheduleDate} required />
				</label>
				<Button
					type="button"
					variant="secondary"
					loading={scheduling}
					loadingLabel={t('common.loading')}
					disabled={!scheduleDate}
					onclick={scheduleToCalendar}
				>
					{t('planer.addToCalendar')}
				</Button>
			</div>
		</section>
	{/if}

	<RecipeIngredientChecklist
		recipeId={idea.id}
		fromStock={idea.ingredientsToUse}
		missing={idea.missingIngredients}
	/>

	<RecipeStepTimeline steps={idea.steps} recipeTitle={idea.title} />
</article>

<style>
	.recipe-detail {
		display: flex;
		flex-direction: column;
		gap: var(--page-section-gap);
		min-width: 0;
	}

	.back-link {
		align-self: flex-start;
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.recipe-hero {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-border);
	}

	.recipe-title {
		margin: 0;
		font-size: clamp(1.35rem, 4vw, 1.75rem);
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.recipe-lead {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 1rem;
		line-height: 1.5;
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.cta-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.schedule-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.section-label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.schedule-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.schedule-label {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.schedule-label input {
		min-height: 2.75rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	@media (min-width: 480px) {
		.schedule-row {
			flex-direction: row;
			align-items: flex-end;
		}

		.schedule-label {
			flex: 1;
		}
	}
</style>
