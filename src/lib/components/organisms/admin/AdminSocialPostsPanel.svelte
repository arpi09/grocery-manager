<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import type { GuideArticleStatus } from '$lib/domain/guide-article';
	import type { SocialPostStatus } from '$lib/domain/social-post';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';

	interface SocialPostLinkStatus {
		isRapportLink: boolean;
		reportMonth: string | null;
		meetsKAnonymity: boolean | null;
		needsBetterLink: boolean;
		suggestedLink: {
			linkUrl: string;
			utmContent: string;
			reason: 'report_ready' | 'latest_guide' | 'landing';
		} | null;
	}

	interface SerializedGuide {
		id: string;
		slug: string;
		status: GuideArticleStatus;
		title: string;
		description: string;
		body: string;
		qualityWarnings: string[] | null;
		socialPostId: string | null;
		createdAt: string;
	}

	interface CampaignRow {
		guide: SerializedGuide;
		socialPost: SerializedPost | null;
	}

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
		linkStatus?: SocialPostLinkStatus;
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
		openAiConfigured: boolean;
	}

	let { active, linkedIn, openAiConfigured }: Props = $props();

	let loading = $state(false);
	let campaignsLoading = $state(false);
	let generating = $state(false);
	let error = $state<string | null>(null);
	let campaignError = $state<string | null>(null);
	let posts = $state<SerializedPost[]>([]);
	let campaigns = $state<CampaignRow[]>([]);
	let statusFilter = $state<SocialPostStatus | 'all'>('draft');
	let campaignStatusFilter = $state<GuideArticleStatus | 'all'>('draft');
	let loaded = $state(false);
	let campaignsLoaded = $state(false);
	let submittingPostId = $state<string | null>(null);
	let submittingGuideId = $state<string | null>(null);

	const linkedCampaignPostIds = $derived(
		new Set(campaigns.map((row) => row.socialPost?.id).filter(Boolean) as string[])
	);

	const standalonePosts = $derived(posts.filter((post) => !linkedCampaignPostIds.has(post.id)));

	$effect(() => {
		if (!active) {
			return;
		}
		void loadPosts();
		void loadCampaigns();
	});

	async function loadCampaigns() {
		campaignsLoading = true;
		campaignError = null;
		try {
			const params = new URLSearchParams();
			if (campaignStatusFilter !== 'all') {
				params.set('status', campaignStatusFilter);
			}
			const response = await fetch(`/api/admin/marketing-campaigns?${params}`);
			if (!response.ok) {
				throw new Error('fetch failed');
			}
			const payload = (await response.json()) as { campaigns: CampaignRow[] };
			campaigns = payload.campaigns;
			campaignsLoaded = true;
		} catch {
			campaignError = t('admin.loadError');
		} finally {
			campaignsLoading = false;
		}
	}

	async function generateCampaign() {
		generating = true;
		campaignError = null;
		try {
			const response = await fetch('/api/admin/marketing-campaigns/generate', { method: 'POST' });
			const payload = (await response.json()) as { error?: string };
			if (!response.ok) {
				campaignError = payload.error ?? t('admin.marketingCampaigns.generateFailed');
				return;
			}
			showClientToast(t('admin.marketingCampaigns.generateSuccess'));
			await Promise.all([loadCampaigns(), loadPosts()]);
		} catch {
			campaignError = t('admin.marketingCampaigns.generateFailed');
		} finally {
			generating = false;
		}
	}

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

	function guideStatusLabel(status: GuideArticleStatus): string {
		return t(`admin.marketingCampaigns.status.${status}`);
	}

	function canEditGuide(status: GuideArticleStatus): boolean {
		return status === 'draft' || status === 'approved';
	}

	function linkWarning(post: SerializedPost): string | null {
		const status = post.linkStatus;
		if (!status?.needsBetterLink) {
			return null;
		}
		if (status.isRapportLink && status.meetsKAnonymity === false) {
			return t('admin.socialPosts.linkWarningRapportNotReady', {
				month: status.reportMonth ?? ''
			});
		}
		return t('admin.socialPosts.linkWarningGeneric');
	}

	function suggestedLinkLabel(post: SerializedPost): string | null {
		const reason = post.linkStatus?.suggestedLink?.reason;
		if (!reason) {
			return null;
		}
		return t(`admin.socialPosts.suggestedLinkReason.${reason}`);
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

	<section class="campaigns">
		<Card>
			<div class="queue-header">
				<h2>{t('admin.marketingCampaigns.title')}</h2>
				<Button type="button" disabled={generating || !openAiConfigured} onclick={() => void generateCampaign()}>
					{t('admin.marketingCampaigns.generate')}
				</Button>
			</div>
			<p class="note">{t('admin.marketingCampaigns.note')}</p>
			{#if !openAiConfigured}
				<p class="openai-hint" role="status">{t('admin.marketingCampaigns.openAiHint')}</p>
			{/if}
			{#if campaignError}
				<p class="panel-error" role="alert">{campaignError}</p>
			{/if}
			<label>
				{t('admin.socialPosts.filter')}
				<select
					value={campaignStatusFilter}
					onchange={(event) => {
						const value = (event.currentTarget as HTMLSelectElement).value;
						campaignStatusFilter = value === 'all' ? 'all' : (value as GuideArticleStatus);
						void loadCampaigns();
					}}
				>
					<option value="all">{t('admin.socialPosts.filterAll')}</option>
					<option value="draft">{guideStatusLabel('draft')}</option>
					<option value="approved">{guideStatusLabel('approved')}</option>
					<option value="published">{guideStatusLabel('published')}</option>
				</select>
			</label>

			{#if campaignsLoading && !campaignsLoaded}
				<p class="panel-status">{t('admin.loading')}</p>
			{:else if campaigns.length === 0}
				<p class="empty">{t('admin.marketingCampaigns.empty')}</p>
			{:else}
				<ul class="post-list">
					{#each campaigns as row (row.guide.id)}
						<li class="post-card campaign-card">
							<div class="post-meta">
								<span class="badge">{guideStatusLabel(row.guide.status)}</span>
								<strong>{row.guide.title}</strong>
								<span class="source">/{row.guide.slug}</span>
							</div>

							{#if row.guide.qualityWarnings?.length}
								<ul class="quality-warnings">
									{#each row.guide.qualityWarnings as warning}
										<li>{warning}</li>
									{/each}
								</ul>
							{/if}

							<p class="preview-link">
								<a href="/admin/guide-preview/{row.guide.id}" target="_blank" rel="noopener noreferrer">
									{t('admin.marketingCampaigns.previewLink')}
								</a>
							</p>

							{#if canEditGuide(row.guide.status)}
								<form
									method="POST"
									action="?/updateGuide"
									class="edit-form"
									use:enhance={bindSubmitting((v) => {
										submittingGuideId = v ? row.guide.id : null;
									})}
								>
									<input type="hidden" name="guideId" value={row.guide.id} />
									<label>
										{t('admin.marketingCampaigns.titleLabel')}
										<input name="title" type="text" value={row.guide.title} required />
									</label>
									<label>
										{t('admin.marketingCampaigns.descriptionLabel')}
										<input name="description" type="text" value={row.guide.description} required />
									</label>
									<label>
										{t('admin.marketingCampaigns.bodyLabel')}
										<textarea name="body" rows="8" required>{row.guide.body}</textarea>
									</label>
									<Button type="submit" variant="secondary" disabled={submittingGuideId === row.guide.id}>
										{t('common.save')}
									</Button>
								</form>
							{/if}

							<div class="actions">
								{#if row.guide.status === 'draft'}
									<form
										method="POST"
										action="?/approveGuide"
										use:enhance={bindSubmitting((v) => {
											submittingGuideId = v ? row.guide.id : null;
										})}
									>
										<input type="hidden" name="guideId" value={row.guide.id} />
										<Button type="submit" disabled={submittingGuideId === row.guide.id}>
											{t('admin.marketingCampaigns.approveGuide')}
										</Button>
									</form>
								{/if}
								{#if row.guide.status === 'approved'}
									<form
										method="POST"
										action="?/publishGuide"
										use:enhance={bindSubmitting((v) => {
											submittingGuideId = v ? row.guide.id : null;
										})}
									>
										<input type="hidden" name="guideId" value={row.guide.id} />
										<Button type="submit" disabled={submittingGuideId === row.guide.id}>
											{t('admin.marketingCampaigns.publishGuide')}
										</Button>
									</form>
								{/if}
							</div>

							{#if row.socialPost}
								<div class="linked-post">
									<h3>{t('admin.marketingCampaigns.linkedInDraft')}</h3>
									<div class="post-meta">
										<span class="badge">{statusLabel(row.socialPost.status)}</span>
									</div>
									{#if canEdit(row.socialPost.status)}
										<form
											method="POST"
											action="?/updateSocialPost"
											class="edit-form"
											use:enhance={bindSubmitting((v) => {
												submittingPostId = v ? row.socialPost!.id : null;
											})}
										>
											<input type="hidden" name="postId" value={row.socialPost.id} />
											<label>
												{t('admin.socialPosts.bodyLabel')}
												<textarea name="body" rows="5" required>{row.socialPost.body}</textarea>
											</label>
											{#if row.socialPost.builtLinkUrl}
												<p class="built-link">
													<a href={row.socialPost.builtLinkUrl} target="_blank" rel="noopener noreferrer">
														{row.socialPost.builtLinkUrl}
													</a>
												</p>
											{/if}
											<Button type="submit" variant="secondary" disabled={submittingPostId === row.socialPost.id}>
												{t('common.save')}
											</Button>
										</form>
									{:else}
										<pre class="preview">{row.socialPost.body}</pre>
									{/if}
									<div class="actions">
										{#if row.socialPost.status === 'draft' || row.socialPost.status === 'failed'}
											<form
												method="POST"
												action="?/approveSocialPost"
												use:enhance={bindSubmitting((v) => {
													submittingPostId = v ? row.socialPost!.id : null;
												})}
											>
												<input type="hidden" name="postId" value={row.socialPost.id} />
												<Button type="submit" disabled={submittingPostId === row.socialPost.id}>
													{t('admin.socialPosts.approve')}
												</Button>
											</form>
										{/if}
										<Button type="button" variant="secondary" onclick={() => copyToClipboard(row.socialPost!)}>
											{t('admin.socialPosts.copyToLinkedIn')}
										</Button>
										{#if row.socialPost.status === 'approved' && linkedIn.configured && linkedIn.connected}
											<form
												method="POST"
												action="?/publishSocialPost"
												use:enhance={bindSubmitting((v) => {
													submittingPostId = v ? row.socialPost!.id : null;
												})}
											>
												<input type="hidden" name="postId" value={row.socialPost.id} />
												<Button type="submit" disabled={submittingPostId === row.socialPost.id}>
													{t('admin.socialPosts.publish')}
												</Button>
											</form>
										{/if}
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
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

			{#if standalonePosts.length === 0}
				<p class="empty">{t('admin.socialPosts.empty')}</p>
			{:else}
				<ul class="post-list">
					{#each standalonePosts as post (post.id)}
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
									{#if linkWarning(post)}
										<p class="link-warning" role="status">{linkWarning(post)}</p>
										{#if post.linkStatus?.suggestedLink}
											<p class="suggested-link-note">
												{t('admin.socialPosts.suggestedLink')}: {suggestedLinkLabel(post)}
												<a
													href={post.linkStatus.suggestedLink.linkUrl}
													target="_blank"
													rel="noopener noreferrer"
												>
													{post.linkStatus.suggestedLink.linkUrl}
												</a>
											</p>
											<form
												method="POST"
												action="?/suggestBetterSocialPostLink"
												use:enhance={bindSubmitting((v) => {
													submittingPostId = v ? post.id : null;
												})}
											>
												<input type="hidden" name="postId" value={post.id} />
												<Button type="submit" variant="secondary" disabled={submittingPostId === post.id}>
													{t('admin.socialPosts.suggestBetterLink')}
												</Button>
											</form>
										{/if}
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
	.campaigns,
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

	.link-warning {
		margin: 0 0 var(--space-sm);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-warning) 14%, var(--color-surface));
		color: var(--color-warning);
		font-size: 0.85rem;
	}

	.suggested-link-note {
		margin: 0 0 var(--space-sm);
		font-size: 0.85rem;
		color: var(--color-text-muted);
		word-break: break-all;
	}

	.suggested-link-note a {
		color: var(--color-primary);
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
		color: var(--color-on-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.openai-hint {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface));
		color: var(--color-warning);
		font-size: 0.85rem;
	}

	.campaign-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.quality-warnings {
		margin: 0;
		padding-left: 1.25rem;
		color: var(--color-warning);
		font-size: 0.85rem;
	}

	.preview-link a {
		color: var(--color-primary);
		font-size: 0.9rem;
	}

	.linked-post {
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px dashed var(--color-border);
	}

	.linked-post h3 {
		margin: 0 0 var(--space-sm);
		font-size: 1rem;
	}
</style>
