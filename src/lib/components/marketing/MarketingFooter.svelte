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

		<nav class="footer-nav" aria-label={content.footer.navAria}>
			<div class="footer-columns">
				{#each content.footer.sections as section (section.title)}
					<div class="footer-column">
						<p class="column-title">{section.title}</p>
						<ul class="column-links">
							{#each section.links as link (link.href)}
								<li>
									<a href={link.href}>{link.label}</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}

				<div class="footer-column">
					<p class="column-title">{content.footer.socialLabel}</p>
					<ul class="column-links">
						{#each content.footer.socialLinks as link (link.href)}
							<li>
								<a
									href={link.href}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noopener noreferrer' : undefined}
								>
									{link.label}
								</a>
							</li>
						{/each}
						<li>
							<a href={loginUrl}>{content.cta.login}</a>
						</li>
					</ul>
				</div>
			</div>
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
		gap: var(--space-xl);
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
		max-width: 36ch;
	}

	.footer-columns {
		display: grid;
		gap: var(--space-lg);
	}

	@media (min-width: 640px) {
		.footer-columns {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 900px) {
		.footer-columns {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	.column-title {
		margin: 0 0 var(--space-sm);
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		letter-spacing: var(--letter-spacing-label);
		text-transform: uppercase;
		color: var(--color-text);
	}

	.column-links {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.column-links a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-body-sm);
	}

	.column-links a:hover {
		color: var(--color-primary);
	}

	.rights {
		max-width: 72rem;
		margin: var(--space-lg) auto 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
	}
</style>
