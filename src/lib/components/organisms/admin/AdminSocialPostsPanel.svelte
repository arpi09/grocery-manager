<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import type { SocialPostStatus } from '$lib/domain/social-post';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';

	interface SerializedPost {
		id: string;
		status: SocialPostStatus;
		title: string | null;
		body: string;
		linkUrl: string | null;
		utmSource: string | null;
		utmMedium: string | null;
		utmCampaign: string | null;
		utmContent: string | null;
		source: string;
		publishError: string | null;
		externalId: string | null;
		createdAt: string;
		approvedAt: string | null;
		publishedAt: string | null;
		builtLinkUrl: string | null;
	}

	interface LinkedInStatus {
		configured: boolean;
		connected: boolean;
		organizationId: string | null;
		scopeHint: string | null;
	}

	interface Props {
		active: boolean;
		linkedIn: LinkedInStatus;
	}

	let { active, linkedIn }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let posts = $state<SerializedPost[]>([]);
	let statusFilter = $state<SocialPostStatus | 'all'>('draft');
	let loaded = $state(false);
	let submittingPostId = $state<string | null>(null);

	$effect(() => {
		if (!active) {
			return;
		}
		void loadPosts();
	});

	async function loadPosts() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams();
			if (statusFilter !== 'all') {
				params.set('status', statusFilter);
			}
			const response = await fetch(`/api/admin/social-posts?${params}`);
			if (!response.ok) {
				throw new Error('fetch failed');
			}
			const payload = (await response.json()) as { posts: SerializedPost[] };
			posts = payload.posts;
			loaded = true;
		} catch {
			error = t('admin.loadError');
		} finally {
			loading = false;
		}
	}

	function canEdit(status: SocialPostStatus): boolean {
		return status === 'draft' || status === 'approved' || status === 'failed';
	}

	async function copyToClipboard(post: SerializedPost) {
		const parts = [post.body.trim()];
		if (post.builtLinkUrl) {
			parts.push('', post.builtLinkUrl);
		}
		const text = parts.join('\n');
		try {
			await navigator.clipboard.writeText(text);
			showClientToast(t('admin.socialPosts.copied'));
		} catch {
			showClientToast(t('admin.socialPosts.copyFailed'), { variant: 'error' });
		}
	}

	function statusLabel(status: SocialPostStatus): string {
		return t(`admin.socialPosts.status.${status}`);
	}
</script>

{#if loading && !loaded}
	<p class="panel-status">{t('admin.loading')}</p>
{:else if error}
	<p class="panel-status panel-error" role="alert">{error}</p>
{:else}
	<section class="linkedin-connection">
		<Card>
			<h2>{t('admin.socialPosts.linkedInTitle')}</h2>
			<p class="note">{linkedIn.scopeHint}</p>
			<p class="status-line">
				{t('admin.socialPosts.linkedInConfigured', {
					state: linkedIn.configured ? t('admin.on') : t('admin.off')
				})}
			</p>
			<p class="status-line">
				{t('admin.socialPosts.linkedInConnected', {
					state: linkedIn.connected ? t('admin.on') : t('admin.off')
				})}
			</p>
			{#if linkedIn.organizationId}
				<p class="org-id">
					{t('admin.socialPosts.organizationId', { id: linkedIn.organizationId })}
				</p>
			{/if}
			{#if linkedIn.configured && !linkedIn.connected}
				<a class="connect-link" href="/api/linkedin/authorize">{t('admin.socialPosts.connectLinkedIn')}</a>
			{/if}
		</Card>
	</section>

	<section class="social-queue">
		<Card>
			<div class="queue-header">
				<h2>{t('admin.socialPosts.title')}</h2>
				<label>
					{t('admin.socialPosts.filter')}
					<select
						value={statusFilter}
						onchange={(event) => {
							const value = (event.currentTarget as HTMLSelectElement).value;
							statusFilter = value === 'all' ? 'all' : (value as SocialPostStatus);
							void loadPosts();
						}}
					>
						<option value="all">{t('admin.socialPosts.filterAll')}</option>
						<option value="draft">{statusLabel('draft')}</option>
						<option value="approved">{statusLabel('approved')}</option>
						<option value="published">{statusLabel('published')}</option>
						<option value="failed">{statusLabel('failed')}</option>
					</select>
				</label>
			</div>
			<p class="note">{t('admin.socialPosts.note')}</p>

			{#if posts.length === 0}
				<p class="empty">{t('admin.socialPosts.empty')}</p>
			{:else}
				<ul class="post-list">
					{#each posts as post (post.id)}
						<li class="post-card">
							<div class="post-meta">
								<span class="badge">{statusLabel(post.status)}</span>
								{#if post.title}
									<strong>{post.title}</strong>
								{/if}
								<span class="source">{post.source}</span>
							</div>

							{#if canEdit(post.status)}
								<form
									method="POST"
									action="?/updateSocialPost"
									class="edit-form"
									use:enhance={bindSubmitting((v) => {
										submittingPostId = v ? post.id : null;
									})}
								>
									<input type="hidden" name="postId" value={post.id} />
									<label>
										{t('admin.socialPosts.bodyLabel')}
										<textarea name="body" rows="6" required>{post.body}</textarea>
									</label>
									<label>
										{t('admin.socialPosts.linkLabel')}
										<input name="linkUrl" type="url" value={post.linkUrl ?? ''} />
									</label>
									{#if post.builtLinkUrl}
										<p class="built-link">
											{t('admin.socialPosts.builtLink')}: <a href={post.builtLinkUrl} target="_blank" rel="noopener noreferrer">{post.builtLinkUrl}</a>
										</p>
									{/if}
									<Button type="submit" variant="secondary" disabled={submittingPostId === post.id}>
										{t('common.save')}
									</Button>
								</form>
							{:else}
								<pre class="preview">{post.body}</pre>
								{#if post.builtLinkUrl}
									<p class="built-link">
										<a href={post.builtLinkUrl} target="_blank" rel="noopener noreferrer">{post.builtLinkUrl}</a>
									</p>
								{/if}
							{/if}

							{#if post.publishError}
								<p class="publish-error" role="alert">{post.publishError}</p>
							{/if}

							<div class="actions">
								{#if post.status === 'draft' || post.status === 'failed'}
									<form
										method="POST"
										action="?/approveSocialPost"
										use:enhance={bindSubmitting((v) => {
											submittingPostId = v ? post.id : null;
										})}
									>
										<input type="hidden" name="postId" value={post.id} />
										<Button type="submit" disabled={submittingPostId === post.id}>
											{t('admin.socialPosts.approve')}
										</Button>
									</form>
								{/if}

								<Button type="button" variant="secondary" onclick={() => copyToClipboard(post)}>
									{t('admin.socialPosts.copyToLinkedIn')}
								</Button>

								{#if post.status === 'approved' && linkedIn.configured && linkedIn.connected}
									<form
										method="POST"
										action="?/publishSocialPost"
										use:enhance={bindSubmitting((v) => {
											submittingPostId = v ? post.id : null;
										})}
									>
										<input type="hidden" name="postId" value={post.id} />
										<Button type="submit" disabled={submittingPostId === post.id}>
											{t('admin.socialPosts.publish')}
										</Button>
									</form>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</section>
{/if}

<style>
	.panel-status {
		color: var(--color-text-muted);
	}

	.panel-error {
		color: var(--color-danger);
	}

	.linkedin-connection,
	.social-queue {
		margin-bottom: var(--space-lg);
	}

	h2 {
		margin: 0 0 var(--space-md);
		font-size: 1.1rem;
	}

	.note,
	.status-line,
	.org-id,
	.empty {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.queue-header {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: var(--space-sm);
	}

	.queue-header label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.queue-header select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		min-width: 10rem;
	}

	.post-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.post-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-md);
		background: color-mix(in srgb, var(--color-surface) 96%, var(--color-border));
	}

	.post-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
		margin-bottom: var(--space-md);
	}

	.badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		color: var(--color-primary);
	}

	.source {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.edit-form label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.edit-form textarea,
	.edit-form input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
	}

	.preview {
		white-space: pre-wrap;
		margin: 0 0 var(--space-md);
		font-family: inherit;
		font-size: 0.95rem;
	}

	.built-link {
		margin: 0 0 var(--space-md);
		font-size: 0.85rem;
		word-break: break-all;
	}

	.built-link a {
		color: var(--color-primary);
	}

	.publish-error {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
		color: var(--color-danger);
		font-size: 0.85rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.connect-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.55rem 1rem;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
		text-decoration: none;
	}
</style>
