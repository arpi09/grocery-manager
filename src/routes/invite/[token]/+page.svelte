<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import { inviteRoleLabel } from '$lib/domain/household';

	let { data, form } = $props();

	const acceptError = $derived(form?.acceptError ?? null);
	const loginHref = $derived(
		`/login?redirect=${encodeURIComponent(data.redirectTo)}&message=${encodeURIComponent('Logga in med samma e-postadress som inbjudan skickades till.')}`
	);
</script>

<AppLayout user={data.user}>
	<AppHeader title="Hushållsinbjudan" />
	<Card>
		{#if !data.preview}
			<p class="message error">Inbjudan hittades inte eller är ogiltig.</p>
		{:else}
			<h2 class="title">Du är inbjuden till {data.preview.householdName}</h2>
			<p class="detail">
				Roll: <strong>{inviteRoleLabel(data.preview.role)}</strong>
			</p>
			<p class="detail">
				E-post: <strong>{data.preview.email}</strong>
			</p>

			{#if data.preview.status === 'accepted'}
				<p class="message info">Inbjudan har redan accepterats.</p>
			{:else if data.preview.status === 'revoked'}
				<p class="message error">Inbjudan har återkallats.</p>
			{:else if data.preview.expired}
				<p class="message error">Inbjudan har gått ut.</p>
			{:else if !data.user}
				<p class="message info">
					Logga in med kontot {data.preview.email} för att acceptera inbjudan.
				</p>
				<a class="login-link" href={loginHref}>Logga in</a>
			{:else if !data.emailMatches}
				<p class="message error">
					Du är inloggad som {data.user.email}, men inbjudan gäller {data.preview.email}.
					Logga in med rätt konto.
				</p>
				<a class="login-link" href={loginHref}>Byt konto</a>
			{:else if data.canAccept}
				{#if acceptError}
					<p class="message error" role="alert">{acceptError}</p>
				{/if}
				<form method="POST" action="?/accept">
					<Button type="submit" fullWidth>Acceptera inbjudan</Button>
				</form>
			{/if}
		{/if}
	</Card>
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

	.message {
		margin: var(--space-md) 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}

	.message.error {
		background: #fdeaea;
		color: var(--color-danger);
	}

	.message.info {
		background: #e8f5e9;
		color: #1b5e20;
	}

	.login-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: #fff;
		text-decoration: none;
		font-weight: 600;
	}
</style>
