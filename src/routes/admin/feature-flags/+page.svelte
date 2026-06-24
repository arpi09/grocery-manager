<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import { t } from '$lib/i18n';
	import type { FeatureFlagPattern } from '$lib/server/feature-flags';

	let { data } = $props();

	const patternLabels: Record<FeatureFlagPattern, string> = {
		exactTrue: t('admin.featureFlags.pattern.exactTrue'),
		defaultOn: t('admin.featureFlags.pattern.defaultOn'),
		notFalse: t('admin.featureFlags.pattern.notFalse')
	};
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('admin.featureFlags.title')} subtitle={t('admin.featureFlags.subtitle')} />

	<PageContainer>
		<p class="read-only-note">{t('admin.featureFlags.readOnlyNote')}</p>

		<p class="back-link">
			<a href="/admin">{t('admin.featureFlags.backToAdmin')}</a>
		</p>

		<section class="flag-section">
			<h2>{t('admin.featureFlags.serverSection')}</h2>
			<Card>
				<div class="table-wrap">
					<table class="flag-table">
						<thead>
							<tr>
								<th scope="col">{t('admin.featureFlags.colFlag')}</th>
								<th scope="col">{t('admin.featureFlags.colEnv')}</th>
								<th scope="col">{t('admin.featureFlags.colEffective')}</th>
								<th scope="col">{t('admin.featureFlags.colSource')}</th>
								<th scope="col">{t('admin.featureFlags.colDefault')}</th>
							</tr>
						</thead>
						<tbody>
							{#each data.serverFlags as flag (flag.id)}
								<tr>
									<td>
										<span class="flag-label">{flag.label}</span>
										<span class="flag-pattern">{patternLabels[flag.pattern]}</span>
									</td>
									<td><code>{flag.envKey}</code></td>
									<td>
										<Badge tone={flag.effective ? 'warning' : 'default'}>
											{flag.effective ? t('admin.on') : t('admin.off')}
										</Badge>
									</td>
									<td>
										{#if flag.source === 'env'}
											<span class="source-env">
												{t('admin.featureFlags.sourceEnv', { value: flag.envValue ?? '' })}
											</span>
										{:else}
											<span class="source-default">{t('admin.featureFlags.sourceDefault')}</span>
										{/if}
									</td>
									<td>
										<Badge tone={flag.codeDefault ? 'warning' : 'default'}>
											{flag.codeDefault ? t('admin.on') : t('admin.off')}
										</Badge>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		</section>

		<section class="flag-section">
			<h2>{t('admin.featureFlags.layoutSection')}</h2>
			<p class="section-note">{t('admin.featureFlags.layoutNote')}</p>
			<Card>
				<div class="table-wrap">
					<table class="flag-table">
						<thead>
							<tr>
								<th scope="col">{t('admin.featureFlags.colClientProp')}</th>
								<th scope="col">{t('admin.featureFlags.colEnv')}</th>
								<th scope="col">{t('admin.featureFlags.colEffective')}</th>
								<th scope="col">{t('admin.featureFlags.colSource')}</th>
							</tr>
						</thead>
						<tbody>
							{#each data.layoutFlags as flag (flag.propName)}
								<tr>
									<td><code>{flag.propName}</code></td>
									<td>
										<code>{flag.envKey}</code>
										{#if flag.fallbackNote}
											<span class="fallback-note">{flag.fallbackNote}</span>
										{/if}
									</td>
									<td>
										<Badge tone={flag.effective ? 'warning' : 'default'}>
											{flag.effective ? t('admin.on') : t('admin.off')}
										</Badge>
									</td>
									<td>
										{#if flag.source === 'env'}
											<span class="source-env">
												{t('admin.featureFlags.sourceEnv', { value: flag.envValue ?? '' })}
											</span>
										{:else}
											<span class="source-default">{t('admin.featureFlags.sourceDefault')}</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		</section>
	</PageContainer>
</AppLayout>

<style>
	.read-only-note {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.back-link {
		margin: 0 0 var(--space-lg);
		font-size: 0.9rem;
	}

	.flag-section {
		margin-bottom: var(--space-xl);
	}

	h2 {
		margin: 0 0 var(--space-sm);
		font-size: 1.1rem;
	}

	.section-note {
		margin: 0 0 var(--space-md);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.table-wrap {
		overflow-x: auto;
	}

	.flag-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.flag-table th,
	.flag-table td {
		padding: var(--space-sm) var(--space-md);
		text-align: left;
		vertical-align: top;
		border-bottom: 1px solid var(--color-border);
	}

	.flag-table th {
		font-weight: 700;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.flag-table tbody tr:last-child td {
		border-bottom: none;
	}

	.flag-label {
		display: block;
		font-weight: 600;
		color: var(--color-text);
	}

	.flag-pattern {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	code {
		font-size: 0.8125rem;
		word-break: break-all;
	}

	.source-env {
		font-size: 0.8125rem;
		color: var(--color-text);
	}

	.source-default {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.fallback-note {
		display: block;
		margin-top: 0.2rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
