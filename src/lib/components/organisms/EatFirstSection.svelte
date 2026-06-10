<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { DEFAULT_MEAL_INTENT, type MealIntent } from '$lib/domain/recipe';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { presentCelebration } from '$lib/utils/present-celebration.svelte';
	import {
		addMissingIngredientsToList,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
	} from '$lib/utils/recipe-add-missing';
	import NearbyShareReportButton from '$lib/components/molecules/NearbyShareReportButton.svelte';
	import {
		buildExpiringShareCardRows,
		downloadBlob,
		renderExpiringShareCardPng
	} from '$lib/utils/expiring-share-export';

	interface Props {
		expiringItems: InventoryItem[];
		canEdit?: boolean;
		householdId?: string | null;
		compact?: boolean;
	}

	let { expiringItems, canEdit = false, householdId = null, compact = false }: Props = $props();

	let loading = $state(false);
	let sharing = $state(false);
	let sharingImage = $state(false);
	let mealIntent = $state<MealIntent>(DEFAULT_MEAL_INTENT);
	let suggestions = $state<RecipeIdea[]>([]);
	let errorMessage = $state<string | null>(null);
	let addingMissingKey = $state<string | null>(null);
	let schedulingKey = $state<string | null>(null);
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);
	let scheduleDates = $state<Record<string, string>>({});
	let note = $state<string | null>(null);
	let ideaCompletion = $state<Record<string, 'exiting' | 'done'>>({});
	let nearbyOptedIn = $state(false);
	let nearbyShares = $state<
		Array<{
			id: string;
			itemCount: number;
			previewItems: Array<{ name: string; expiresOn: string | null }>;
			approximateDistanceM: number;
			openPath: string;
		}>
	>([]);
	let nearbyLoading = $state(false);

	const todayIso = new Date().toISOString().slice(0, 10);
	const previewItems = $derived(expiringItems.slice(0, 5));
	const overflowCount = $derived(Math.max(0, expiringItems.length - previewItems.length));
	const hasSuggestions = $derived(suggestions.length > 0);

	const completionDelayMs = 420;
	const completionHoldMs = 900;

	function markIdeaScheduled(ideaId: string) {
		ideaCompletion = { ...ideaCompletion, [ideaId]: 'exiting' };
		window.setTimeout(() => {
			ideaCompletion = { ...ideaCompletion, [ideaId]: 'done' };
		}, completionDelayMs);
		window.setTimeout(() => {
			suggestions = suggestions.filter((entry) => entry.id !== ideaId);
			const next = { ...ideaCompletion };
			delete next[ideaId];
			ideaCompletion = next;
		}, completionDelayMs + completionHoldMs);
	}

	async function readNearbySharingEnabled(): Promise<boolean> {
		try {
			const response = await fetch('/api/expiring-share/nearby-settings');
			if (!response.ok) {
				return false;
			}
			const data = (await response.json()) as { enabled?: boolean };
			return Boolean(data.enabled);
		} catch {
			return false;
		}
	}

	async function requestBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
		if (!navigator.geolocation) {
			return null;
		}
		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) =>
					resolve({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude
					}),
				() => resolve(null),
				{ enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 }
			);
		});
	}

	async function loadNearbyShares() {
		nearbyLoading = true;
		try {
			const response = await fetch('/api/expiring-share/nearby');
			const data = (await response.json()) as {
				ok?: boolean;
				optedIn?: boolean;
				shares?: Array<{
					id: string;
					itemCount: number;
					previewItems: Array<{ name: string; expiresOn: string | null }>;
					approximateDistanceM: number;
					openPath: string;
				}>;
			};
			if (!response.ok || !data.ok) {
				return;
			}
			nearbyOptedIn = Boolean(data.optedIn);
			nearbyShares = data.shares ?? [];
		} catch {
			nearbyShares = [];
		} finally {
			nearbyLoading = false;
		}
	}

	onMount(() => {
		void loadNearbyShares();
	});

	function formatNearbyDistance(metres: number): string {
		return t('nearbySharing.approxDistance', { metres });
	}

	async function shareExpiringList() {
		if (!canEdit || expiringItems.length === 0) {
			return;
		}

		sharing = true;
		errorMessage = null;

		try {
			const attachNearby = await readNearbySharingEnabled();
			const coordinate = attachNearby ? await requestBrowserLocation() : null;
			const response = await fetch('/api/expiring-share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					attachNearby,
					latitude: coordinate?.latitude,
					longitude: coordinate?.longitude
				})
			});
			const data = (await response.json()) as { ok?: boolean; url?: string; error?: string };

			if (!response.ok || !data.ok || !data.url) {
				errorMessage = data.error ?? t('eatFirst.shareFailed');
				return;
			}

			let sharedViaNative = false;
			if (navigator.share && navigator.canShare?.({ url: data.url })) {
				try {
					await navigator.share({
						title: t('eatFirst.shareCardTitle'),
						text: t('eatFirst.shareCardText', { count: expiringItems.length }),
						url: data.url
					});
					sharedViaNative = true;
				} catch (error) {
					if (error instanceof DOMException && error.name === 'AbortError') {
						return;
					}
				}
			}

			if (!sharedViaNative && navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(data.url);
			}

			showClientToast(
				sharedViaNative ? t('eatFirst.shareSuccessNative') : t('eatFirst.shareSuccess'),
				{ variant: 'success' }
			);
			if (attachNearby) {
				void loadNearbyShares();
			}
		} catch {
			errorMessage = t('eatFirst.shareFailed');
		} finally {
			sharing = false;
		}
	}

	async function shareExpiringCard(method: 'share' | 'download') {
		if (!canEdit || expiringItems.length === 0) {
			return;
		}

		sharingImage = true;
		errorMessage = null;

		try {
			const locale = getLocale();
			const { rows, overflowCount } = buildExpiringShareCardRows(
				expiringItems.map((item) => ({ name: item.name, expiresOn: item.expiresOn })),
				locale
			);
			const labels = {
				brand: t('nav.brandName'),
				badge: t('eatFirst.badge'),
				headline: t('eatFirst.shareCardHeadline', { count: expiringItems.length }),
				items: rows,
				overflowText:
					overflowCount > 0 ? t('eatFirst.shareCardOverflow', { count: overflowCount }) : undefined,
				footer: t('eatFirst.shareCardFooter')
			};
			const blob = await renderExpiringShareCardPng(labels);
			const filename = `skaffu-eat-first-${new Date().toISOString().slice(0, 10)}.png`;
			const file = new File([blob], filename, { type: 'image/png' });

			if (
				method === 'share' &&
				navigator.share &&
				navigator.canShare?.({ files: [file] })
			) {
				await navigator.share({
					title: t('eatFirst.shareCardTitle'),
					text: t('eatFirst.shareCardText', { count: expiringItems.length }),
					files: [file]
				});
				showClientToast(t('eatFirst.shareCardSuccess'), { variant: 'success' });
			} else if (method === 'share' && navigator.share) {
				await navigator.share({
					title: t('eatFirst.shareCardTitle'),
					text: t('eatFirst.shareCardText', { count: expiringItems.length }),
					url: window.location.origin
				});
				showClientToast(t('eatFirst.shareCardSuccess'), { variant: 'success' });
			} else {
				downloadBlob(blob, filename);
				showClientToast(t('eatFirst.shareCardDownloaded'), { variant: 'success' });
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			errorMessage = t('eatFirst.shareCardFailed');
		} finally {
			sharingImage = false;
		}
	}

	async function generateSuggestions() {
		loading = true;
		errorMessage = null;
		note = null;
		feedbackBanner = null;

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
				errorMessage = data.error ?? t('eatFirst.generateFailed');
				suggestions = [];
				return;
			}

			suggestions = data.suggestions ?? [];
			note = data.note ?? null;

			if (suggestions.length === 0 && !note) {
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
		showClientToast(presented.message, { variant: 'success' });
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

			showClientToast(t('eatFirst.scheduleSuccess', { title: idea.title, date: plannedDate }), {
				variant: 'success'
			});
			if (data.celebration === 'eatFirstRitual' && householdId) {
				presentCelebration({
					kind: 'eatFirstRitual',
					surface: 'toast',
					householdId
				});
			}
			markIdeaScheduled(idea.id);
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

</script>

<section
	id="eat-first"
	class="eat-first motion-fade-in"
	class:compact
	aria-labelledby="eat-first-heading"
>
	{#if !compact}
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
	{:else}
		<h2 id="eat-first-heading" class="sr-only">{t('eatFirst.title')}</h2>
		<p class="hero-sub compact-sub">{t('eatFirst.subtitle')}</p>
	{/if}

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

	<section class="nearby-panel" aria-labelledby="nearby-sharing-heading">
			<div class="nearby-panel-head">
				<h3 id="nearby-sharing-heading">{t('nearbySharing.panelTitle')}</h3>
				<a class="nearby-map-link" href="/grannskafferiet">{t('nearbySharing.openMapLink')}</a>
			</div>
			<p class="nearby-lead">{t('nearbySharing.panelLead')}</p>
			{#if nearbyLoading}
				<p class="nearby-status">{t('common.loading')}</p>
			{:else if !nearbyOptedIn}
				<p class="nearby-hint">
					{t('nearbySharing.panelOptInHint')}
					<a href="/settings#settings-nearby-sharing">{t('nearbySharing.panelOptInLink')}</a>
				</p>
			{:else if nearbyShares.length === 0}
				<p class="nearby-status">{t('nearbySharing.panelEmpty')}</p>
			{:else}
				<ul class="nearby-list">
					{#each nearbyShares as share (share.id)}
						<li>
							<Card class="nearby-card">
								<div class="nearby-card-main">
									<span class="nearby-distance">{formatNearbyDistance(share.approximateDistanceM)}</span>
									<span class="nearby-count">
										{t('nearbySharing.itemCount', { count: share.itemCount })}
									</span>
									<ul class="nearby-preview">
										{#each share.previewItems as item, index (index)}
											<li>{item.name}</li>
										{/each}
									</ul>
									<div class="nearby-card-actions">
										<a class="nearby-open-link" href={share.openPath}>
											{t('nearbySharing.openShareBtn')}
										</a>
										<NearbyShareReportButton shareId={share.id} />
									</div>
								</div>
							</Card>
						</li>
					{/each}
				</ul>
			{/if}
	</section>

	{#if canEdit}
		{#if compact}
			<details class="intent-disclosure">
				<summary>{t('recipe.mealIntentLabel')}</summary>
				<fieldset class="intent-fieldset">
					<legend class="sr-only">{t('recipe.mealIntentLabel')}</legend>
					<div class="intent-presets" role="group" aria-label={t('recipe.mealIntentAria')}>
						<label class="intent-preset">
							<input type="radio" name="eat-first-intent" value="quick" bind:group={mealIntent} />
							<span>{t('recipe.mealIntentQuick')}</span>
						</label>
						<label class="intent-preset">
							<input type="radio" name="eat-first-intent" value="friday" bind:group={mealIntent} />
							<span>{t('recipe.mealIntentFriday')}</span>
						</label>
						<label class="intent-preset">
							<input
								type="radio"
								name="eat-first-intent"
								value="meal_prep"
								bind:group={mealIntent}
							/>
							<span>{t('recipe.mealIntentMealPrep')}</span>
						</label>
					</div>
				</fieldset>
			</details>
		{:else}
			<fieldset class="intent-fieldset">
				<legend>{t('recipe.mealIntentLabel')}</legend>
				<div class="intent-presets" role="group" aria-label={t('recipe.mealIntentAria')}>
					<label class="intent-preset">
						<input type="radio" name="eat-first-intent" value="quick" bind:group={mealIntent} />
						<span>{t('recipe.mealIntentQuick')}</span>
					</label>
					<label class="intent-preset">
						<input type="radio" name="eat-first-intent" value="friday" bind:group={mealIntent} />
						<span>{t('recipe.mealIntentFriday')}</span>
					</label>
					<label class="intent-preset">
						<input type="radio" name="eat-first-intent" value="meal_prep" bind:group={mealIntent} />
						<span>{t('recipe.mealIntentMealPrep')}</span>
					</label>
				</div>
			</fieldset>
		{/if}
		<div class="actions">
			{#if previewItems.length > 0}
				<Button
					type="button"
					onclick={shareExpiringList}
					loading={sharing}
					loadingLabel={t('eatFirst.shareLoading')}
					variant="secondary"
					fullWidth
					disabled={sharingImage}
				>
					{t('eatFirst.shareBtn')}
				</Button>
				<Button
					type="button"
					data-analytics-id="eat-first.share-card"
					onclick={() => shareExpiringCard('share')}
					loading={sharingImage}
					loadingLabel={t('eatFirst.shareCardLoading')}
					variant="secondary"
					fullWidth
					disabled={sharing}
				>
					{t('eatFirst.shareCardBtn')}
				</Button>
			{/if}
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

	{#if note}
		<p class="note">{note}</p>
	{/if}

	{#if hasSuggestions}
		{#if feedbackBanner}
			<AddMissingFeedback feedback={feedbackBanner} />
		{/if}

		<div class="suggestions">
			<h3>{t('eatFirst.suggestionsTitle')}</h3>
			{#each suggestions as idea (idea.id)}
				{@const completion = ideaCompletion[idea.id]}
				{#if completion === 'done'}
					<div class="idea-complete" aria-live="polite">
						<span class="idea-complete-icon" aria-hidden="true">
							<FeatureIcon id="check" size={22} />
						</span>
						<span class="idea-complete-title">{idea.title}</span>
						<span class="idea-complete-label">{t('eatFirst.scheduledLabel')}</span>
					</div>
				{:else}
					<article class="suggestion-card" class:idea-exiting={completion === 'exiting'}>
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
										disabled={!scheduleDates[idea.id] || completion === 'exiting'}
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
											disabled={completion === 'exiting'}
										>
											{t('recipe.addMissingBtnShort', { count: idea.missingIngredients.length })}
										</Button>
									{/if}
								</div>
							</div>
						{/if}
					</article>
				{/if}
			{/each}
		</div>
	{/if}
</section>


<style>
	.eat-first {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.eat-first.compact {
		gap: var(--space-sm);
	}

	.compact-sub {
		margin: 0 0 var(--space-xs);
		font-size: 0.875rem;
	}

	.intent-disclosure {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.intent-disclosure summary {
		min-height: 2.75rem;
		padding: var(--space-sm) var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	.intent-disclosure summary::-webkit-details-marker {
		display: none;
	}

	.intent-disclosure .intent-fieldset {
		padding: 0 var(--space-md) var(--space-md);
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
		min-height: var(--touch-target-min);
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

	.intent-fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}

	.intent-fieldset legend {
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: var(--space-sm);
	}

	.intent-presets {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-xs);
		margin-bottom: var(--space-sm);
	}

	.intent-preset {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.5rem 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		text-align: center;
	}

	.intent-preset:has(input:checked) {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.intent-preset input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.actions {
		margin-top: var(--space-xs);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
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

	.suggestion-card.idea-exiting {
		animation: idea-exit 0.42s ease forwards;
	}

	@keyframes idea-exit {
		to {
			opacity: 0;
			transform: translateY(-0.35rem) scale(0.98);
			max-height: 0;
			margin: 0;
			padding-block: 0;
			border-width: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.suggestion-card.idea-exiting {
			animation: none;
			opacity: 0;
		}
	}

	.idea-complete {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface-muted));
		animation: idea-check-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both;
	}

	.idea-complete + .idea-complete,
	.idea-complete + .suggestion-card,
	.suggestion-card + .idea-complete {
		margin-top: var(--space-sm);
	}

	.idea-complete-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-success) 16%, transparent);
		color: var(--color-success);
		flex-shrink: 0;
	}

	.idea-complete-title {
		font-weight: 700;
		font-size: 0.9375rem;
	}

	.idea-complete-label {
		margin-left: auto;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-success);
	}

	@keyframes idea-check-in {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.idea-complete {
			animation: none;
		}
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

	.nearby-panel {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface-muted));
	}

	.nearby-panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.nearby-panel h3 {
		margin: 0;
		font-size: 1rem;
	}

	.nearby-map-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		white-space: nowrap;
	}

	.nearby-card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
		align-items: center;
	}

	.nearby-open-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
	}

	.nearby-lead,
	.nearby-status,
	.nearby-hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.nearby-list {
		margin: var(--space-sm) 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	:global(.nearby-card) {
		padding: var(--space-sm) var(--space-md) !important;
	}

	.nearby-card-main {
		display: grid;
		gap: var(--space-2xs);
	}

	.nearby-distance {
		font-weight: 700;
		font-size: 0.875rem;
	}

	.nearby-count {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.nearby-preview {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.nearby-hint {
		margin-top: var(--space-sm);
	}
</style>
