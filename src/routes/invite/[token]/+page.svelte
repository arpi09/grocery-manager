<script lang="ts">
	import { getLocale, t } from '$lib/i18n';
	import { inviteRoleLabel } from '$lib/domain/household';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';

	let { data, form } = $props();

	const acceptError = $derived(form?.acceptError ?? null);
	const loginHref = $derived(
		`/login?redirect=${encodeURIComponent(data.redirectTo)}&message=${encodeURIComponent(t('invite.loginRedirectMessage'))}`
	);
	const registerHref = '/register';
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('invite.title')} />
	<PageContainer>
	<Card>
		{#if !data.preview}
			<p class="message error">{t('invite.notFound')}</p>
			<a class="login-link" href={APP_HOME_PATH}>{t('invite.goHome')}</a>
		{:else}
			<h2 class="title">{t('invite.invitedTo', { name: data.preview.householdName })}</h2>
			<p class="detail">
				{t('invite.roleLabel')} <strong>{inviteRoleLabel(data.preview.role, getLocale())}</strong>
			</p>
			{#if data.isShareInvite}
				<p class="detail share-lead">{t('invite.shareLead')}</p>
			{:else}
				<p class="detail">
					{t('invite.emailLabel')} <strong>{data.preview.email}</strong>
				</p>
			{/if}

			{#if data.preview.status === 'accepted'}
				<p class="message info">{t('invite.alreadyAccepted')}</p>
				<a class="login-link" href={APP_HOME_PATH}>{t('invite.goHome')}</a>
			{:else if data.preview.status === 'revoked'}
				<p class="message error">{t('invite.revoked')}</p>
			{:else if data.preview.expired}
				<p class="message error">{t('invite.expired')}</p>
			{:else if !data.user}
				<p class="message info">
					{data.isShareInvite
						? t('invite.shareLoginPrompt')
						: t('invite.loginPrompt', { email: data.preview.email })}
				</p>
				<a class="login-link" href={loginHref}>{t('invite.loginLink')}</a>
				{#if data.isShareInvite}
					<a class="register-link" href={registerHref}>{t('invite.registerLink')}</a>
				{/if}
			{:else if !data.emailMatches}
				<p class="message error">
					{t('invite.wrongAccount', { current: data.user.email, expected: data.preview.email })}
				</p>
				<a class="login-link" href={loginHref}>{t('invite.switchAccount')}</a>
			{:else if data.canAccept}
				{#if acceptError}
					<p class="message error" role="alert">{acceptError}</p>
				{/if}
				<form method="POST" action="?/accept">
					<Button type="submit" fullWidth>
						{data.isShareInvite ? t('invite.shareAccept') : t('invite.accept')}
					</Button>
				</form>
			{/if}
		{/if}
	</Card>
	</PageContainer>
</AppLayout>

<style>
	.title {
		margin: 0 0 var(--space-md);
		font-size: 1.1rem;
	}

	.detail {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.share-lead {
		color: var(--color-text);
	}

	.message {
		margin: var(--space-md) 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}

	.message.error {
		background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
		color: var(--color-danger);
		border: 1px solid color-mix(in srgb, var(--color-danger) 28%, var(--color-border));
	}

	.message.info {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
		border: 1px solid color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
	}

	.login-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: var(--touch-target-min);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: #fff;
		text-decoration: none;
		font-weight: 600;
	}

	.register-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: var(--touch-target-min);
		margin-top: var(--space-sm);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: transparent;
		color: var(--color-text);
		text-decoration: none;
		font-weight: 600;
	}
</style>
