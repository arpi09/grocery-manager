<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { fetchAdminData, parseIsoDate } from '$lib/client/admin-data';
	import type { ChurnReason, ProductFeedbackEntry } from '$lib/domain/product-feedback';
	import {
		PRODUCT_FEEDBACK_LIST_DEFAULT,
		PRODUCT_FEEDBACK_LIST_MAX
	} from '$lib/domain/product-feedback';
	import type { WaitlistEntry } from '$lib/domain/waitlist';
	import { WAITLIST_LIST_DEFAULT, WAITLIST_LIST_MAX } from '$lib/domain/waitlist';
	import { getLocale, t } from '$lib/i18n';

	interface FeedbackPayload {
		productFeedback: (Omit<ProductFeedbackEntry, 'createdAt'> & { createdAt: string })[];
		limit: number;
	}

	interface WaitlistPayload {
		waitlistCount: number;
		waitlistTarget: number;
		waitlistEntries: (Omit<WaitlistEntry, 'createdAt'> & { createdAt: string })[];
		limit: number;
	}

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let productFeedback = $state<ProductFeedbackEntry[]>([]);
	let feedbackLimit = $state(PRODUCT_FEEDBACK_LIST_DEFAULT);
	let waitlistCount = $state(0);
	let waitlistTarget = $state(0);
	let waitlistEntries = $state<WaitlistEntry[]>([]);
	let waitlistLimit = $state(WAITLIST_LIST_DEFAULT);
	let loaded = $state(false);

	$effect(() => {
		if (!active) {
			return;
		}
		void loadAll();
	});

	async function loadAll(
		nextFeedbackLimit = feedbackLimit,
		nextWaitlistLimit = waitlistLimit
	) {
		loading = true;
		error = null;
		try {
			const [feedbackPayload, waitlistPayload] = await Promise.all([
				fetchAdminData<FeedbackPayload>('feedback', { limit: nextFeedbackLimit }),
				fetchAdminData<WaitlistPayload>('waitlist', { limit: nextWaitlistLimit })
			]);
			productFeedback = feedbackPayload.productFeedback.map((entry) => ({
				...entry,
				createdAt: parseIsoDate(entry.createdAt)
			}));
			feedbackLimit = feedbackPayload.limit;
			waitlistCount = waitlistPayload.waitlistCount;
			waitlistTarget = waitlistPayload.waitlistTarget;
			waitlistEntries = waitlistPayload.waitlistEntries.map((entry) => ({
				...entry,
				createdAt: parseIsoDate(entry.createdAt)
			}));
			waitlistLimit = waitlistPayload.limit;
			loaded = true;
		} catch {
			error = t('admin.loadError');
		} finally {
			loading = false;
		}
	}

	function formatDate(value: Date) {
		const tag = getLocale() === 'sv' ? 'sv-SE' : 'en-GB';
		return new Intl.DateTimeFormat(tag, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(value);
	}
</script>

{#if loading && !loaded}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else}
	<section class="pro-waitlist" id="waitlist">
		<Card>
			<div class="waitlist-header">
				<h2>{t('admin.waitlist.title')}</h2>
				<label>
					{t('admin.showLatest')}
					<select
						value={waitlistLimit}
						disabled={loading}
						onchange={(e) => loadAll(feedbackLimit, Number(e.currentTarget.value))}
					>
						{#each [25, 50, 100] as option}
							<option value={option} disabled={option > WAITLIST_LIST_MAX}>{option}</option>
						{/each}
					</select>
				</label>
			</div>
			<p class="waitlist-note">{t('admin.waitlist.note')}</p>
			<p class="waitlist-count">
				{t('admin.waitlist.count', { count: waitlistCount, target: waitlistTarget })}
			</p>
			{#if waitlistEntries.length === 0}
				<p class="waitlist-empty">{t('admin.waitlist.empty')}</p>
			{:else}
				<ul class="waitlist-list">
					{#each waitlistEntries as entry (entry.id)}
						<li class="waitlist-item">
							<time datetime={entry.createdAt.toISOString()}>{formatDate(entry.createdAt)}</time>
							<span class="waitlist-source">{entry.source}</span>
							<span class="waitlist-email">{entry.email}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</section>

	<section class="product-feedback" id="feedback">
		<Card>
			<div class="feedback-header">
				<h2>{t('admin.feedback.title')}</h2>
				<label>
					{t('admin.showLatest')}
					<select
						value={feedbackLimit}
						disabled={loading}
						onchange={(e) => loadAll(Number(e.currentTarget.value), waitlistLimit)}
					>
						{#each [25, 50, 100] as option}
							<option value={option} disabled={option > PRODUCT_FEEDBACK_LIST_MAX}>
								{option}
							</option>
						{/each}
					</select>
				</label>
			</div>
			<p class="feedback-note">{t('admin.feedback.note')}</p>
			{#if productFeedback.length === 0}
				<p class="feedback-empty">{t('admin.feedback.empty')}</p>
			{:else}
				<ul class="feedback-list">
					{#each productFeedback as entry (entry.id)}
						<li class="feedback-item">
							<div class="feedback-summary">
								<time datetime={entry.createdAt.toISOString()}>
									{formatDate(entry.createdAt)}
								</time>
								<span class="feedback-source">{entry.source}</span>
								{#if entry.churnReason}
									<span class="feedback-reason">
										{t(`feedback.churnReasons.${entry.churnReason as ChurnReason}`)}
									</span>
								{/if}
								<span class="feedback-user">{entry.userEmail}</span>
							</div>
							<p class="feedback-message">{entry.message}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</section>
{/if}

<style>
	.panel-status {
		margin: 0 0 var(--space-lg);
		color: var(--color-text-muted);
	}

	.panel-error {
		color: var(--color-danger);
	}

	.pro-waitlist {
		margin-bottom: var(--space-lg);
	}

	.waitlist-header,
	.feedback-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.waitlist-header h2,
	.feedback-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.waitlist-header label,
	.feedback-header label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.9rem;
	}

	.waitlist-header select,
	.feedback-header select {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.waitlist-note,
	.waitlist-empty,
	.waitlist-count,
	.feedback-note,
	.feedback-empty {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.waitlist-count {
		font-weight: 600;
		color: var(--color-text);
	}

	.waitlist-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.waitlist-item {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.waitlist-item:last-child {
		border-bottom: none;
	}

	.waitlist-source {
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.waitlist-email {
		font-weight: 500;
	}

	.product-feedback {
		margin-bottom: var(--space-lg);
	}

	.feedback-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.feedback-item {
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.feedback-item:last-child {
		border-bottom: none;
	}

	.feedback-summary {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: baseline;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.feedback-reason {
		font-weight: 600;
		color: var(--color-text);
	}

	.feedback-message {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		white-space: pre-wrap;
	}
</style>
