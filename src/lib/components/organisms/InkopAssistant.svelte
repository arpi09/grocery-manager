<script lang="ts">
	import { t } from '$lib/i18n';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';

	type Tab = 'insights' | 'ica';

	interface InventoryInsight {
		type: string;
		title: string;
		detail: string;
		priority: 'high' | 'medium' | 'low';
		relatedItems: string[];
	}

	interface IcaShoppingItem {
		name: string;
		quantity: string;
		category: string;
		reason: string;
		priority: 'high' | 'medium' | 'low';
		searchQuery: string;
	}

	let activeTab = $state<Tab>('insights');
	let loadingInsights = $state(false);
	let loadingIca = $state(false);
	let focus = $state('');
	let preferences = $state('');
	let householdSize = $state(2);
	let summary = $state<string | null>(null);
	let insights = $state<InventoryInsight[]>([]);
	let icaItems = $state<IcaShoppingItem[]>([]);
	let icaNote = $state<string | null>(null);
	let checked = $state<Record<string, boolean>>({});
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);

	const insightTypeLabels: Record<string, string> = {
		expiring: t('shopping.insightExpiring'),
		running_low: t('shopping.insightRunningLow'),
		use_soon: t('shopping.insightUseSoon'),
		restock: t('shopping.insightRestock'),
		meal_plan: t('shopping.insightMealPlan'),
		tip: t('shopping.insightTip')
	};

	const priorityTone = (priority: string) => {
		if (priority === 'high') return 'warning' as const;
		return 'default' as const;
	};

	function icaSearchUrl(query: string): string {
		return `https://www.ica.se/handla/sok/?query=${encodeURIComponent(query)}`;
	}

	async function generateInsights() {
		loadingInsights = true;
		errorMessage = null;
		note = null;

		try {
			const response = await fetch('/api/inventory-insights', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ focus })
			});
			const data = (await response.json()) as {
				error?: string;
				note?: string;
				summary?: string;
				insights?: InventoryInsight[];
			};

			if (!response.ok) {
				errorMessage = data.error ?? t('shopping.insightsError');
				return;
			}

			summary = data.summary ?? null;
			insights = data.insights ?? [];
			note = data.note ?? null;
		} catch {
			errorMessage = t('shopping.insightsNetwork');
		} finally {
			loadingInsights = false;
		}
	}

	async function generateIcaList() {
		loadingIca = true;
		errorMessage = null;

		try {
			const response = await fetch('/api/ica-shopping-list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ preferences, householdSize })
			});
			const data = (await response.json()) as {
				error?: string;
				note?: string | null;
				items?: IcaShoppingItem[];
			};

			if (!response.ok) {
				errorMessage = data.error ?? t('shopping.icaError');
				return;
			}

			icaItems = data.items ?? [];
			icaNote = data.note ?? null;
			checked = {};
		} catch {
			errorMessage = t('shopping.icaNetwork');
		} finally {
			loadingIca = false;
		}
	}

	function toggleChecked(key: string) {
		checked = { ...checked, [key]: !checked[key] };
	}

	function copyIcaList() {
		if (icaItems.length === 0) return;
		const lines = icaItems
			.filter((item) => !checked[item.name + item.quantity])
			.map((item) => `- [ ] ${item.quantity} ${item.name} (${item.category})`)
			.join('\n');
		void navigator.clipboard.writeText(lines);
	}

	const groupedIca = $derived.by(() => {
		const groups = new Map<string, IcaShoppingItem[]>();
		for (const item of icaItems) {
			const list = groups.get(item.category) ?? [];
			list.push(item);
			groups.set(item.category, list);
		}
		return [...groups.entries()];
	});
</script>

<section class="assistant">
	<p class="intro">
		{t('shopping.assistantIntro')}
	</p>

	<div class="tabs" role="tablist" aria-label={t('shopping.assistantAria')}>
		<button
			type="button"
			class:active={activeTab === 'insights'}
			role="tab"
			aria-selected={activeTab === 'insights'}
			onclick={() => (activeTab = 'insights')}
		>
			{t('shopping.insightsTab')}
		</button>
		<button
			type="button"
			class:active={activeTab === 'ica'}
			role="tab"
			aria-selected={activeTab === 'ica'}
			onclick={() => (activeTab = 'ica')}
		>
			{t('shopping.icaTab')}
		</button>
	</div>

	{#if activeTab === 'insights'}
		<div class="panel" role="tabpanel">
			<label class="label" for="insight-focus">{t('shopping.focusOptional')}</label>
			<textarea
				id="insight-focus"
				class="textarea"
				rows="2"
				maxlength="300"
				bind:value={focus}
				placeholder={t('shopping.focusPlaceholder')}
			></textarea>
			<Button
				type="button"
				onclick={generateInsights}
				loading={loadingInsights}
				loadingLabel={t('common.thinking')}
				fullWidth
			>
				{t('shopping.generateInsightsBtn')}
			</Button>

			{#if summary}
				<p class="summary">{summary}</p>
			{/if}

			{#if note}
				<p class="note">{note}</p>
			{/if}

			{#if insights.length > 0}
				<ul class="insight-list">
					{#each insights as insight}
						<li class="insight-card">
							<div class="insight-head">
								<strong>{insight.title}</strong>
								<div class="badges">
									<Badge tone={priorityTone(insight.priority)}>{insight.priority}</Badge>
									<Badge>
										{insightTypeLabels[insight.type] ?? insight.type}
									</Badge>
								</div>
							</div>
							<p>{insight.detail}</p>
							{#if insight.relatedItems.length > 0}
								<p class="related">
									<strong>{t('shopping.relatedItems')}</strong> {insight.relatedItems.join(', ')}
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else}
		<div class="panel" role="tabpanel">
			<label class="label" for="ica-preferences">{t('shopping.preferences')}</label>
			<textarea
				id="ica-preferences"
				class="textarea"
				rows="2"
				maxlength="300"
				bind:value={preferences}
				placeholder={t('shopping.preferencesPlaceholder')}
			></textarea>

			<label class="label" for="household-size">{t('shopping.householdSizeLabel')}</label>
			<input
				id="household-size"
				class="number-input"
				type="number"
				min="1"
				max="8"
				bind:value={householdSize}
			/>

			<Button
				type="button"
				onclick={generateIcaList}
				loading={loadingIca}
				loadingLabel={t('common.thinking')}
				fullWidth
			>
				{t('shopping.createIcaList')}
			</Button>

			{#if icaNote}
				<p class="note">{icaNote}</p>
			{/if}

			{#if icaItems.length > 0}
				<div class="ica-actions">
					<Button type="button" variant="secondary" onclick={copyIcaList}>
						{t('shopping.copyChecklist')}
					</Button>
				</div>

				{#each groupedIca as [category, items]}
					<section class="ica-group">
						<h3>{category}</h3>
						<ul>
							{#each items as item}
								{@const key = item.name + item.quantity}
								<li class:checked={checked[key]}>
									<label class="check-row">
										<input
											type="checkbox"
											checked={checked[key] ?? false}
											onchange={() => toggleChecked(key)}
										/>
										<span>
											<strong>{item.quantity}</strong>
											{item.name}
										</span>
									</label>
									<p class="reason">{item.reason}</p>
									<a
										class="ica-link"
										href={icaSearchUrl(item.searchQuery)}
										target="_blank"
										rel="noopener noreferrer"
									>
										{t('shopping.searchOnIca')}
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			{/if}
		</div>
	{/if}

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}
</section>

<style>
	.assistant {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		min-width: 0;
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
	}

	.tabs {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.tabs button {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.45rem 0.9rem;
		font-weight: 600;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.tabs button.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.label {
		font-weight: 600;
	}

	.textarea,
	.number-input {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.number-input {
		max-width: 6rem;
	}

	.summary {
		margin: 0;
		font-weight: 600;
	}

	.note {
		margin: 0;
		color: var(--color-text-muted);
	}

	.insight-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.insight-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-md);
		background: var(--color-surface-muted);
	}

	.insight-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.insight-card p {
		margin: 0;
	}

	.related {
		margin-top: var(--space-xs) !important;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.badges {
		display: flex;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.ica-actions {
		display: flex;
		justify-content: flex-end;
	}

	.ica-group h3 {
		margin: 0 0 var(--space-sm);
		font-size: 1rem;
	}

	.ica-group ul {
		list-style: none;
		margin: 0 0 var(--space-lg);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.ica-group li {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
	}

	.ica-group li.checked {
		opacity: 0.55;
		text-decoration: line-through;
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
	}

	.reason {
		margin: var(--space-xs) 0 !important;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.ica-link {
		font-size: 0.875rem;
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.tabs {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: var(--space-xs);
		}

		.tabs button {
			min-height: 2.75rem;
			padding: 0.5rem 0.65rem;
			font-size: 0.875rem;
			text-align: center;
		}

		.panel {
			padding: var(--space-sm);
		}

		.insight-head {
			flex-direction: column;
			align-items: flex-start;
		}

		.badges {
			flex-wrap: wrap;
		}

		.ica-actions {
			justify-content: stretch;
		}

		.ica-actions :global(.btn) {
			width: 100%;
			min-height: 2.75rem;
		}

		.ica-group li {
			min-width: 0;
		}
	}
</style>
