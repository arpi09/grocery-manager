<script lang="ts">
	import type { MarketingContent } from '$lib/marketing/content';

	interface Props {
		content: MarketingContent;
		loginUrl: string;
	}

	let { content, loginUrl }: Props = $props();
</script>

<footer class="footer">
	<div class="inner">
		<div class="brand-block">
			<p class="site-name">{content.siteName}</p>
			<p class="tagline">{content.footer.tagline}</p>
		</div>

		<nav class="links" aria-label="Sidfot">
			{#each content.nav as link (link.href)}
				<a href={link.href}>{link.label}</a>
			{/each}
			<a href={loginUrl}>{content.cta.login}</a>
		</nav>
	</div>

	<p class="rights">{content.footer.rights}</p>
</footer>

<style>
	.footer {
		margin-top: auto;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		padding: var(--space-xl) var(--space-lg) var(--space-lg);
	}

	.inner {
		max-width: 72rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.site-name {
		margin: 0;
		font-weight: var(--font-weight-display);
		font-size: var(--font-size-body);
		color: var(--color-text);
	}

	.tagline {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md) var(--space-lg);
	}

	.links a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.links a:hover {
		color: var(--color-primary);
	}

	.rights {
		max-width: 72rem;
		margin: var(--space-lg) auto 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
	}
</style>
