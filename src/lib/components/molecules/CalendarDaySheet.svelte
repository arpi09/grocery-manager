<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { formatCalendarDayLabel, mealSourceVariant } from '$lib/domain/calendar-display';
	import type { PlannedMeal } from '$lib/domain/meal-plan';

	interface DayData {
		date: string;
		dayOfMonth: number;
		isCurrentMonth: boolean;
		meals: PlannedMeal[];
	}

	interface Props {
		open: boolean;
		day: DayData | null;
		month: string;
		onClose: () => void;
	}

	let { open, day, month, onClose }: Props = $props();
	let expandedMealId = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			expandedMealId = null;
		}
	});

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			onClose();
		}
	}

	function toggleMeal(mealId: string) {
		expandedMealId = expandedMealId === mealId ? null : mealId;
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open && day}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={onClose} aria-hidden="true"></div>

	<div
		class="sheet"
		role="dialog"
		aria-modal="true"
		aria-label="Måltider {formatCalendarDayLabel(day.date)}"
	>
		<div class="sheet-handle" aria-hidden="true"></div>

		<header class="sheet-head">
			<div>
				<h2>{formatCalendarDayLabel(day.date)}</h2>
				<p class="sheet-sub">{day.meals.length} planerade måltider</p>
			</div>
			<button type="button" class="close-btn" onclick={onClose} aria-label="Stäng">×</button>
		</header>

		<div class="sheet-body">
			<section class="add-section" aria-label="Lägg till måltid">
				<h3>Lägg till måltid</h3>
				<form method="POST" action="?/create" class="create-form">
					<input type="hidden" name="month" value={month} />
					<input type="hidden" name="plannedDate" value={day.date} />
					<input type="hidden" name="notes" value="" />
					<label class="sr-only" for="new-meal-title">Måltid</label>
					<input
						id="new-meal-title"
						type="text"
						name="title"
						placeholder="Måltidstitel"
						required
					/>
					<Button type="submit" fullWidth>Lägg till</Button>
				</form>
			</section>

			{#if day.meals.length === 0}
				<p class="empty">Inga måltider planerade denna dag.</p>
			{:else}
				<ul class="meal-list">
					{#each day.meals as meal (meal.id)}
						<li class="meal-card" class:expanded={expandedMealId === meal.id}>
							<button
								type="button"
								class="meal-summary"
								aria-expanded={expandedMealId === meal.id}
								onclick={() => toggleMeal(meal.id)}
							>
								<span
									class="source-dot"
									class:source-dot-idea={mealSourceVariant(meal.ideaId) === 'idea'}
									aria-hidden="true"
								></span>
								<span class="meal-title">{meal.title}</span>
								<span class="chevron" aria-hidden="true">{expandedMealId === meal.id ? '−' : '+'}</span>
							</button>

							{#if expandedMealId === meal.id}
								<div class="meal-detail">
									<form method="POST" action="?/update" class="edit-form">
										<input type="hidden" name="month" value={month} />
										<input type="hidden" name="id" value={meal.id} />
										<label>
											Titel
											<input name="title" value={meal.title} required />
										</label>
										<label>
											Datum
											<input type="date" name="plannedDate" value={meal.plannedDate} required />
										</label>
										<label>
											Anteckningar
											<textarea name="notes" rows="2">{meal.notes ?? ''}</textarea>
										</label>
										<Button type="submit" fullWidth>Spara</Button>
									</form>
									<form method="POST" action="?/delete" class="delete-form">
										<input type="hidden" name="month" value={month} />
										<input type="hidden" name="id" value={meal.id} />
										<Button type="submit" variant="danger" fullWidth>Ta bort</Button>
									</form>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: rgba(20, 30, 26, 0.45);
	}

	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 90;
		max-height: min(88vh, 720px);
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-bottom: none;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		box-shadow: var(--shadow-md);
		padding-bottom: env(safe-area-inset-bottom, 0);
		animation: sheet-in 0.24s ease-out;
	}

	@media (min-width: 768px) {
		.sheet {
			left: 50%;
			right: auto;
			bottom: auto;
			top: 50%;
			transform: translate(-50%, -50%);
			width: min(520px, calc(100vw - 2rem));
			max-height: min(85vh, 680px);
			border-radius: var(--radius-lg);
			border-bottom: 1px solid var(--color-border);
			animation: modal-in 0.2s ease-out;
		}
	}

	@keyframes sheet-in {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes modal-in {
		from {
			opacity: 0;
			transform: translate(-50%, -46%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sheet {
			animation: none;
		}
	}

	.sheet-handle {
		width: 2.5rem;
		height: 0.25rem;
		margin: var(--space-sm) auto 0;
		border-radius: 999px;
		background: var(--color-border);
		flex-shrink: 0;
	}

	@media (min-width: 768px) {
		.sheet-handle {
			display: none;
		}
	}

	.sheet-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-md) var(--space-sm);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
		text-transform: capitalize;
	}

	h3 {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
	}

	.sheet-sub {
		margin: 0.2rem 0 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.close-btn {
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
		flex-shrink: 0;
	}

	.sheet-body {
		overflow: auto;
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.add-section {
		padding: var(--space-md);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.create-form input,
	.edit-form input,
	.edit-form textarea {
		width: 100%;
		min-width: 0;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		text-align: center;
		padding: var(--space-md);
	}

	.meal-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.meal-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		overflow: hidden;
	}

	.meal-summary {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		min-height: 2.75rem;
		padding: var(--space-sm) var(--space-md);
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font-weight: 600;
	}

	.source-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: var(--color-primary);
		flex-shrink: 0;
	}

	.source-dot-idea {
		background: var(--color-accent);
	}

	.meal-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		color: var(--color-text-muted);
		font-size: 1.1rem;
		line-height: 1;
	}

	.meal-detail {
		padding: 0 var(--space-md) var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		border-top: 1px solid var(--color-border);
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
	}

	.edit-form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.delete-form {
		margin: 0;
	}
</style>
