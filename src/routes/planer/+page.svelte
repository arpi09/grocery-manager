<script lang="ts">
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import MealPlanCalendar from '$lib/components/organisms/MealPlanCalendar.svelte';

	let { data } = $props();

	const todayIso = new Date().toISOString().slice(0, 10);
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('planer.title')} subtitle={t('planer.subtitle')} />

	<PageContainer>
	<section class="planner-grid">
		<MealPlanCalendar
			weeks={data.weeks}
			month={data.month}
			monthLabel={data.monthLabel}
			previousMonth={data.previousMonth}
			nextMonth={data.nextMonth}
			{todayIso}
		/>

		<aside class="ideas-card" aria-label={t('planer.ideasAria')}>
			<h3>{t('planer.ideasTitle')}</h3>
			<p class="ideas-sub">
				{t('planer.ideasIntro')}
			</p>
			{#if data.ideas.length === 0}
				<p class="empty">{t('planer.ideasEmpty')}</p>
			{:else}
				<div class="idea-list">
					{#each data.ideas as idea (idea.id)}
						<details class="idea-item">
							<summary>{idea.title}</summary>
							<p>{idea.whyItFits}</p>
							<p><strong>{t('planer.usesLabel')}</strong> {idea.ingredientsToUse.join(', ')}</p>
							<p><strong>{t('planer.missingLabel')}</strong> {idea.missingIngredients.join(', ') || t('common.none')}</p>
							<ol>
								{#each idea.steps as step}
									<li>{step}</li>
								{/each}
							</ol>
							<form method="POST" action="?/scheduleIdea" class="schedule-form">
								<input type="hidden" name="month" value={data.month} />
								<input type="hidden" name="ideaId" value={idea.id} />
								<label>
									{t('planer.scheduleDate')}
									<input type="date" name="plannedDate" required />
								</label>
								<button type="submit">{t('planer.addToCalendar')}</button>
							</form>
						</details>
					{/each}
				</div>
			{/if}
		</aside>
	</section>
	</PageContainer>
</AppLayout>

<style>
	h3 {
		margin: 0;
	}

	.planner-grid {
		display: grid;
		grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
		gap: var(--space-md);
		align-items: start;
		min-width: 0;
	}

	.ideas-card {
		min-width: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		box-shadow: var(--shadow-sm);
	}

	.ideas-sub {
		margin: 0.45rem 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.85rem;
		line-height: 1.45;
	}

	.empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.idea-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.idea-item {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-sm);
		background: var(--color-surface-muted);
	}

	.idea-item summary {
		cursor: pointer;
		font-weight: 700;
		font-size: 0.92rem;
		min-height: 2.75rem;
		display: flex;
		align-items: center;
	}

	.idea-item p {
		margin: var(--space-xs) 0;
		font-size: 0.85rem;
	}

	.idea-item ol {
		margin: var(--space-sm) 0;
		padding-left: 1.1rem;
		font-size: 0.84rem;
	}

	.schedule-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px dashed var(--color-border);
	}

	.schedule-form label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.schedule-form input {
		min-width: 0;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.schedule-form button {
		min-height: 2.75rem;
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: #fff;
		font-weight: 700;
		padding: 0.55rem 0.75rem;
		cursor: pointer;
	}

	@media (max-width: 1100px) {
		.planner-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
