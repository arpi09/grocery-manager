<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	let { data } = $props();

	const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const todayIso = new Date().toISOString().slice(0, 10);
</script>

<AppLayout wide>
	<AppHeader
		title="Planer"
		subtitle="Planera maltider i kalendern och lagg in ChatGPT-ideer"
		showPetsNav={Boolean(data.user?.petsEnabled)}
	/>

	<section class="month-nav">
		<a href="/planer?month={data.previousMonth}" class="month-btn">← Forra</a>
		<h2>{data.monthLabel}</h2>
		<div class="month-actions">
			<a href="/planer" class="month-btn month-btn-soft">Idag</a>
			<a href="/planer?month={data.nextMonth}" class="month-btn">Nasta →</a>
		</div>
	</section>

	<section class="planner-grid">
		<div class="calendar-card">
			<div class="calendar-scroll">
				<div class="weekday-row">
					{#each weekdayNames as name}
						<div>{name}</div>
					{/each}
				</div>

				<div class="weeks">
					{#each data.weeks as week}
						{#each week as day}
							<div class="day {day.isCurrentMonth ? '' : 'outside'} {day.date === todayIso ? 'today' : ''}">
								<div class="day-top">
									<div class="day-meta">
										<span class="day-number">{day.dayOfMonth}</span>
										{#if day.meals.length > 0}
											<span class="meal-count">{day.meals.length}</span>
										{/if}
									</div>
									<span class="date-label">{day.date.slice(5)}</span>
								</div>

								<details class="create-box">
									<summary>+ Add meal</summary>
									<form method="POST" action="?/create" class="create-form">
										<input type="hidden" name="month" value={data.month} />
										<input type="hidden" name="plannedDate" value={day.date} />
										<input type="hidden" name="notes" value="" />
										<input type="text" name="title" placeholder="Meal title" required />
										<button type="submit">Add</button>
									</form>
								</details>

								<div class="day-meals">
									{#each day.meals as meal}
										<details class="meal-item">
											<summary>{meal.title}</summary>
											<form method="POST" action="?/update" class="edit-form">
												<input type="hidden" name="month" value={data.month} />
												<input type="hidden" name="id" value={meal.id} />
												<label>
													Title
													<input name="title" value={meal.title} required />
												</label>
												<label>
													Date
													<input type="date" name="plannedDate" value={meal.plannedDate} required />
												</label>
												<label>
													Notes
													<textarea name="notes" rows="2">{meal.notes ?? ''}</textarea>
												</label>
												<div class="meal-actions">
													<button class="save" type="submit">Save</button>
												</div>
											</form>
											<form method="POST" action="?/delete" class="delete-form">
												<input type="hidden" name="month" value={data.month} />
												<input type="hidden" name="id" value={meal.id} />
												<button type="submit" class="delete">Delete</button>
											</form>
										</details>
									{/each}
								</div>
							</div>
						{/each}
					{/each}
				</div>
			</div>
		</div>

		<aside class="ideas-card">
			<h3>ChatGPT recipe ideas</h3>
			<p class="ideas-sub">Generated ideas from your inventory. Pick a date and add to your calendar.</p>
			{#if data.ideas.length === 0}
				<p class="empty">No generated ideas yet. Use the Recipe ideas button first.</p>
			{:else}
				<div class="idea-list">
					{#each data.ideas as idea}
						<details class="idea-item">
							<summary>{idea.title}</summary>
							<p>{idea.whyItFits}</p>
							<p><strong>Use:</strong> {idea.ingredientsToUse.join(', ')}</p>
							<p><strong>Missing:</strong> {idea.missingIngredients.join(', ') || 'None'}</p>
							<ol>
								{#each idea.steps as step}
									<li>{step}</li>
								{/each}
							</ol>
							<form method="POST" action="?/scheduleIdea" class="schedule-form">
								<input type="hidden" name="month" value={data.month} />
								<input type="hidden" name="ideaId" value={idea.id} />
								<label>
									Plan date
									<input type="date" name="plannedDate" required />
								</label>
								<button type="submit">Add to calendar</button>
							</form>
						</details>
					{/each}
				</div>
			{/if}
		</aside>
	</section>
</AppLayout>

<style>
	h2,
	h3 {
		margin: 0;
	}

	.month-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
		padding: var(--space-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
	}

	.month-nav h2 {
		font-size: 1.1rem;
		text-transform: capitalize;
	}

	.month-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.month-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.8rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-weight: 700;
		font-size: 0.85rem;
		text-decoration: none;
	}

	.month-btn:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
	}

	.month-btn-soft {
		color: var(--color-primary);
		border-color: rgba(61, 107, 79, 0.35);
	}

	.planner-grid {
		display: grid;
		grid-template-columns: minmax(0, 2.2fr) minmax(320px, 1fr);
		gap: var(--space-md);
		align-items: start;
	}

	.calendar-card,
	.ideas-card {
		background: linear-gradient(180deg, #ffffff 0%, #fcfdfa 100%);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		box-shadow: var(--shadow-sm);
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.6rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-sm);
		min-width: 980px;
	}

	.weekday-row div {
		padding: 0.2rem 0.35rem;
	}

	.calendar-scroll {
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	.weeks {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.6rem;
		min-width: 980px;
	}

	.day {
		min-height: 210px;
		padding: 0.6rem;
		border: 1px solid #dde3d7;
		border-radius: 12px;
		background: #fff;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.day:hover {
		border-color: #c9d5c8;
	}

	.day.outside {
		background: #f7f8f5;
		opacity: 0.7;
	}

	.day.today {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(61, 107, 79, 0.12);
	}

	.day-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.3rem;
	}

	.day-meta {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.day-number {
		font-weight: 700;
		font-size: 1rem;
	}

	.meal-count {
		font-size: 0.7rem;
		font-weight: 700;
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		border-radius: 999px;
		padding: 0.1rem 0.38rem;
	}

	.date-label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.create-box {
		border: 1px dashed #cfd9cf;
		border-radius: 10px;
		padding: 0.35rem 0.4rem;
		background: #f9fbf7;
	}

	.create-box summary {
		cursor: pointer;
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.create-form {
		display: grid;
		gap: 0.35rem;
		margin-top: 0.35rem;
	}

	.create-form input {
		min-width: 0;
		font-size: 0.78rem;
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: #fff;
	}

	.create-form button {
		border: none;
		border-radius: 8px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 700;
		padding: 0.38rem 0.55rem;
	}

	.day-meals {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		overflow: auto;
	}

	.meal-item {
		border: 1px solid #dce5db;
		border-radius: 10px;
		padding: 0.4rem;
		background: var(--color-surface-muted);
	}

	.meal-item summary {
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 700;
	}

	.edit-form,
	.delete-form {
		margin-top: 0.45rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.edit-form label,
	.schedule-form label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.edit-form input,
	.edit-form textarea,
	.schedule-form input {
		padding: 0.4rem 0.45rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: #fff;
	}

	.meal-actions {
		display: flex;
		justify-content: flex-end;
	}

	.save,
	.schedule-form button {
		border: none;
		border-radius: 8px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 700;
		padding: 0.4rem 0.65rem;
	}

	.delete {
		border: none;
		border-radius: 8px;
		background: #b54a4a;
		color: #fff;
		font-weight: 700;
		padding: 0.4rem 0.65rem;
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
		border: 1px solid #d8e2d8;
		border-radius: 12px;
		padding: var(--space-sm);
		background: linear-gradient(180deg, #f6faf7 0%, #eef5f1 100%);
	}

	.idea-item summary {
		cursor: pointer;
		font-weight: 700;
		font-size: 0.92rem;
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
		border-top: 1px dashed #c9d5c8;
	}

	@media (max-width: 1100px) {
		.planner-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 760px) {
		.month-nav {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
