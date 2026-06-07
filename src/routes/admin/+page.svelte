<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import AdminHealthDashboard from '$lib/components/organisms/AdminHealthDashboard.svelte';
	import AdminSectionTabs, {
		type AdminTab
	} from '$lib/components/organisms/admin/AdminSectionTabs.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import { parseAdminTab } from '$lib/client/admin-data';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';

	let { data, form } = $props();
	let emailSendingSubmitting = $state(false);
	let emailSendingEnabled = $state(data.emailSending.enabledInApp);
	/** Value from the latest toggle click — used at submit time before DOM/state flush. */
	let emailSendingSubmitEnabled: boolean | undefined = $state(undefined);
	let emailSendingForm: HTMLFormElement | undefined = $state();

	let activeTab = $state<AdminTab>(parseAdminTab(data.tab));

	$effect(() => {
		activeTab = parseAdminTab($page.url.searchParams.get('tab') ?? data.tab);
	});

	$effect(() => {
		emailSendingEnabled = data.emailSending.enabledInApp;
	});

	function selectTab(tab: AdminTab) {
		activeTab = tab;
		if (!browser) {
			return;
		}
		const url = new URL(window.location.href);
		if (tab === 'overview') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', tab);
		}
		history.replaceState(history.state, '', `${url.pathname}${url.search}`);
	}
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />

	<PageContainer>
		{#if form?.message}
			<p class="banner" role="alert">{form.message}</p>
		{/if}

		<AdminSectionTabs active={activeTab} onSelect={selectTab} />

		{#if activeTab === 'overview'}
			<AdminHealthDashboard stats={data.stats} />

			<section class="email-settings">
				<Card>
					<h2>{t('admin.emailSending.title')}</h2>
					<p class="email-settings-note">{t('admin.emailSending.note')}</p>
					{#if data.emailSending.envDisabled}
						<p class="email-settings-env" role="status">
							{t('admin.emailSending.envDisabled')}
						</p>
					{/if}
					<form
						method="POST"
						action="?/setEmailSending"
						class="email-settings-form"
						bind:this={emailSendingForm}
						use:enhance={bindSubmitting(
							(v) => (emailSendingSubmitting = v),
							(formData) => {
								const enabled = emailSendingSubmitEnabled ?? emailSendingEnabled;
								formData.set('enabled', enabled ? 'true' : 'false');
								emailSendingSubmitEnabled = undefined;
							}
						)}
					>
						<input type="hidden" name="enabled" value={emailSendingEnabled ? 'true' : 'false'} />
						<Toggle
							checked={emailSendingEnabled}
							disabled={emailSendingSubmitting || data.emailSending.envDisabled}
							label={t('admin.emailSending.enable')}
							onchange={(enabled) => {
								emailSendingSubmitEnabled = enabled;
								emailSendingEnabled = enabled;
								emailSendingForm?.requestSubmit();
							}}
						/>
						<p class="email-settings-status">
							{t('admin.emailSending.status', {
								state: data.emailSending.effective
									? t('admin.on')
									: t('admin.off')
							})}
						</p>
						{#if emailSendingSubmitting}
							<span class="email-settings-saving">{t('common.saving')}</span>
						{/if}
					</form>
				</Card>
			</section>

			<section class="session-mgmt">
				<Card>
					<h2>{t('admin.sessionManagement')}</h2>
					<p class="logout-note">{t('admin.logoutAllNote')}</p>
					<form method="POST" action="?/logoutAll" class="logout-all-form">
						<label>
							{t('admin.confirmYes', { yes: 'yes' })}
							<input name="confirm" required autocomplete="off" placeholder="yes" />
						</label>
						<Button type="submit" variant="danger">{t('admin.logoutAll')}</Button>
					</form>
				</Card>
			</section>
		{:else if activeTab === 'analytics'}
			{#await import('$lib/components/organisms/admin/AdminAnalyticsPanel.svelte') then { default: AdminAnalyticsPanel }}
				<AdminAnalyticsPanel active={true} />
			{/await}
		{:else if activeTab === 'behavior'}
			{#await import('$lib/components/organisms/admin/AdminBehaviorPanel.svelte') then { default: AdminBehaviorPanel }}
				<AdminBehaviorPanel active={true} />
			{/await}
		{:else if activeTab === 'aiUsage'}
			{#await import('$lib/components/organisms/admin/AdminAiUsagePanel.svelte') then { default: AdminAiUsagePanel }}
				<AdminAiUsagePanel active={true} />
			{/await}
		{:else if activeTab === 'users' && data.user}
			{#await import('$lib/components/organisms/admin/AdminUsersPanel.svelte') then { default: AdminUsersPanel }}
				<AdminUsersPanel active={true} currentUserId={data.user.id} />
			{/await}
		{:else if activeTab === 'logs'}
			{#await import('$lib/components/organisms/admin/AdminErrorLogsPanel.svelte') then { default: AdminErrorLogsPanel }}
				<AdminErrorLogsPanel active={true} />
			{/await}
		{:else if activeTab === 'feedback'}
			{#await import('$lib/components/organisms/admin/AdminFeedbackPanel.svelte') then { default: AdminFeedbackPanel }}
				<AdminFeedbackPanel active={true} />
			{/await}
		{:else if activeTab === 'pmfSurvey'}
			{#await import('$lib/components/organisms/admin/AdminPmfSurveyPanel.svelte') then { default: AdminPmfSurveyPanel }}
				<AdminPmfSurveyPanel active={true} />
			{/await}
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.banner {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
		color: var(--color-danger);
		border: 1px solid color-mix(in srgb, var(--color-danger) 28%, var(--color-border));
	}

	.email-settings {
		margin-bottom: var(--space-lg);
	}

	.email-settings-note,
	.email-settings-env,
	.email-settings-status,
	.email-settings-saving {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.email-settings-env {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-warning) 14%, var(--color-surface));
		color: var(--color-warning);
		border: 1px solid color-mix(in srgb, var(--color-warning) 30%, var(--color-border));
	}

	.email-settings-form {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-sm);
	}

	.email-settings-status {
		margin-bottom: 0;
		font-weight: 600;
		color: var(--color-text);
	}

	.session-mgmt {
		margin-bottom: var(--space-lg);
	}

	h2 {
		margin: 0 0 var(--space-md);
		font-size: 1.1rem;
	}

	.logout-note {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.logout-all-form {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: flex-end;
	}

	.logout-all-form label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		min-width: 12rem;
	}

	.logout-all-form input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}
</style>
