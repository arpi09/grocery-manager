<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.guide.title} — {t('admin.marketingCampaigns.previewTitle')}</title>
</svelte:head>

<main class="preview-page">
	<p class="banner" role="status">
		{t('admin.marketingCampaigns.previewBanner', { status: data.articleStatus })}
	</p>

	<article class="article">
		<header class="article-header">
			<p class="back">
				<a href="/admin?tab=social">
					<ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
					{t('admin.marketingCampaigns.backToAdmin')}
				</a>
			</p>
			<h1>{data.guide.title}</h1>
			<p class="lead">{data.guide.description}</p>
			<time class="date" datetime={data.guide.date}>{data.guide.date}</time>
		</header>

		<div class="prose">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html data.guide.html}
		</div>
	</article>
</main>

<style>
	.preview-page {
		max-width: 42rem;
		margin: 0 auto;
		padding: var(--space-lg);
	}

	.banner {
		margin: 0 0 var(--space-lg);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-warning) 14%, var(--color-surface));
		color: var(--color-warning);
		font-size: 0.9rem;
	}

	.back a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.article-header h1 {
		margin: var(--space-md) 0 0;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
	}

	.lead {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
	}

	.date {
		display: block;
		margin-top: var(--space-md);
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
	}

	.prose {
		margin-top: var(--space-xl);
		line-height: 1.65;
	}

	.prose :global(h2) {
		margin: var(--space-xl) 0 var(--space-md);
		font-size: 1.35rem;
	}

	.prose :global(p),
	.prose :global(li) {
		color: var(--color-text-muted);
	}
</style>
