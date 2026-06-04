<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import HouseholdSettingsPanel from '$lib/components/organisms/HouseholdSettingsPanel.svelte';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import { bindSubmitting, bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import {
		ACTION_TOAST_PARAM,
		actionToastMessage,
		parseActionToastKind
	} from '$lib/utils/action-toast';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import SettingsSectionNav, {
		type SettingsNavItem
	} from '$lib/components/molecules/SettingsSectionNav.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { ONBOARDING_REPLAY_EVENT, resetOnboarding } from '$lib/utils/onboarding';
	import LanguageSwitcher from '$lib/components/molecules/LanguageSwitcher.svelte';
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import { getLocale, t } from '$lib/i18n';
	import { FREE_LIMITS, PRICE_HYPOTHESIS_SEK, PRO_LIMITS } from '$lib/domain/plan';
	import { planLimitUsageLabelKey } from '$lib/domain/plan-limits';
	import { CHURN_REASONS } from '$lib/domain/product-feedback';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import PlanLimitBanner from '$lib/components/molecules/PlanLimitBanner.svelte';
	import ProUpgradePanel from '$lib/components/molecules/ProUpgradePanel.svelte';
	import ProActivePanel from '$lib/components/molecules/ProActivePanel.svelte';
	import ProActivationCelebration from '$lib/components/organisms/ProActivationCelebration.svelte';
	import {
		isPushSupported,
		pushErrorMessage,
		resyncExistingPushSubscription,
		subscribeToExpiryPush,
		unsubscribeFromExpiryPush
	} from '$lib/utils/push-notifications';
	import ProWaitlistForm from '$lib/components/marketing/ProWaitlistForm.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';

	let { data, form } = $props();
	let petModalOpen = $state(false);
	let copiedInviteLink = $state(false);
	let petsToggleSubmitting = $state(false);
	let expiryRemindersSubmitting = $state(false);
	let expiryRemindersEnabled = $state(data.expiryRemindersEnabled);
	let expiryReminderDays = $state(String(data.expiryReminderDays));
	let autoExpiredGraceSubmitting = $state(false);
	let autoExpiredGraceDays = $state(
		data.autoExpiredGraceDays !== null ? String(data.autoExpiredGraceDays) : '7'
	);
	let pushNotificationsEnabled = $state(data.pushNotificationsEnabled);
	let pushNotificationsSubmitting = $state(false);
	let pushNotificationsError = $state<string | null>(null);
	let shoppingPushEnabled = $state(data.shoppingPushEnabled);
	let shoppingPushSubmitting = $state(false);
	let shoppingPushForm: HTMLFormElement | undefined = $state();
	let pushSupported = $state(false);
	let addPetSubmitting = $state(false);
	let feedbackSubmitting = $state(false);
	let expiryRemindersForm: HTMLFormElement | undefined = $state();
	let autoExpiredGraceForm: HTMLFormElement | undefined = $state();
	let pushToastMessage = $state<string | null>(null);
	let expirySettingsToast = $state<string | null>(null);

	const feedbackErrors = $derived(form?.feedbackErrors ?? {});
	const feedbackSuccess = $derived(form?.feedbackSuccess === true);

	$effect(() => {
		expiryRemindersEnabled = data.expiryRemindersEnabled;
		expiryReminderDays = String(data.expiryReminderDays);
		if (data.autoExpiredGraceDays !== null) {
			autoExpiredGraceDays = String(data.autoExpiredGraceDays);
		}
		pushNotificationsEnabled = data.pushNotificationsEnabled;
		shoppingPushEnabled = data.shoppingPushEnabled;
	});

	$effect(() => {
		if (browser) {
			pushSupported = isPushSupported();
		}
	});

	$effect(() => {
		if (!browser || !pushSupported || pushNotificationsSubmitting || data.pushNotificationsEnabled) {
			return;
		}

		void (async () => {
			if (Notification.permission !== 'granted') {
				return;
			}
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			if (!subscription) {
				return;
			}

			const result = await resyncExistingPushSubscription();
			if (result.ok) {
				await invalidateAll();
			}
		})();
	});

	const inviteLink = $derived(form?.inviteLink ?? null);
	const inviteEmailWarning = $derived(form?.inviteEmailWarning ?? null);
	const householdError = $derived(form?.householdError ?? null);
	const inviteFieldErrors = $derived(form?.inviteErrors ?? {});
	const householdNameErrors = $derived(
		(form as { householdNameErrors?: Record<string, string[] | undefined> } | null)
			?.householdNameErrors ?? {}
	);

	async function copyInviteLink(link: string) {
		if (!browser) return;
		await navigator.clipboard.writeText(link);
		copiedInviteLink = true;
		setTimeout(() => {
			copiedInviteLink = false;
		}, 2000);
	}

	async function shareInviteLink(link: string) {
		if (!browser || !navigator.share) {
			await copyInviteLink(link);
			return;
		}
		try {
			await navigator.share({
				title: t('household.shareInvite'),
				text: t('household.shareInviteNote'),
				url: link
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			await copyInviteLink(link);
		}
	}

	function replayOnboardingGuide() {
		const userId = data.user?.id;
		if (!userId) {
			return;
		}
		resetOnboarding(userId);
		if (browser) {
			window.dispatchEvent(new Event(ONBOARDING_REPLAY_EVENT));
		}
	}

	async function togglePushNotifications(enabled: boolean) {
		pushNotificationsError = null;
		pushNotificationsSubmitting = true;
		try {
			if (enabled) {
				const result = await subscribeToExpiryPush();
				if (!result.ok) {
					pushNotificationsError = pushErrorMessage(result.reason);
					pushNotificationsEnabled = false;
					return;
				}
				pushNotificationsEnabled = true;
				pushToastMessage = t('actionToast.pushEnabled');
				await invalidateAll();
			} else {
				await unsubscribeFromExpiryPush();
				pushNotificationsEnabled = false;
				pushToastMessage = t('actionToast.pushDisabled');
				await invalidateAll();
			}
		} catch {
			pushNotificationsError = pushErrorMessage('failed');
			pushNotificationsEnabled = false;
		} finally {
			pushNotificationsSubmitting = false;
		}
	}

	function dismissPushToast() {
		pushToastMessage = null;
	}

	function dismissExpirySettingsToast() {
		expirySettingsToast = null;
	}

	const settingsNavItems = $derived.by((): SettingsNavItem[] => {
		const items: SettingsNavItem[] = [
			{ id: 'settings-account', label: t('settings.nav.account') },
			...(data.household
				? [{ id: 'settings-household', label: t('settings.nav.household') }]
				: []),
			{ id: 'settings-notifications', label: t('settings.nav.notifications') },
			{ id: 'settings-app', label: t('settings.nav.app') },
			{ id: 'settings-plan', label: t('settings.nav.plan') },
			{ id: 'settings-feedback', label: t('settings.nav.feedback') }
		];
		return items;
	});
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('settings.title')}
		subtitle={t('settings.subtitle')}
	/>

	<PageContainer>
	<div class="settings-page">
		<SettingsSectionNav items={settingsNavItems} />

		<SettingsSection
			id="settings-account"
			title={t('settings.account.title')}
			description={t('settings.account.description')}
		>
			<SettingsRow title={data.user?.email ?? ''} note={t('settings.account.loggedInEmail')} />
			<SettingsRow href="/profile" title={t('settings.account.editProfile')} note={t('settings.account.editProfileNote')} />
			<SettingsRow href="/privacy" title={t('settings.legal.privacyLink')} note={t('settings.legal.privacyNote')} last />
		</SettingsSection>

		{#if data.household}
			<SettingsSection
				id="settings-household"
				title={t('settings.household.title')}
				description={t('settings.household.description')}
			>
				<HouseholdSettingsPanel
					household={data.household}
					isOwner={data.isOwner}
					householdRole={data.householdRole}
					pendingInvites={data.pendingInvites}
					currentUserId={data.user?.id ?? ''}
					{householdError}
					{inviteFieldErrors}
					{inviteLink}
					{inviteEmailWarning}
					{householdNameErrors}
					copiedInviteLink={copiedInviteLink}
					onCopyInviteLink={copyInviteLink}
					onShareInviteLink={shareInviteLink}
				/>
			</SettingsSection>
		{/if}

		<SettingsSection
			id="settings-notifications"
			title={t('settings.notifications.title')}
			description={t('settings.notifications.description')}
		>
			<SettingsRow
				title={t('settings.expiryReminders.title')}
				note={t('settings.expiryReminders.note')}
				last={false}
			>
				<form
					method="POST"
					action="?/updateExpiryReminders"
					class="expiry-reminders-form"
					bind:this={expiryRemindersForm}
					use:enhance={bindSubmittingWithRedirect(
						(v) => (expiryRemindersSubmitting = v),
						async (location) => {
							const url = new URL(location, 'http://local');
							const kind = parseActionToastKind(url.searchParams.get(ACTION_TOAST_PARAM));
							if (kind === 'settingsSaved') {
								expirySettingsToast = actionToastMessage(getLocale(), kind);
							}
						},
						(formData) => {
							formData.set('enabled', expiryRemindersEnabled ? 'true' : 'false');
							// Select is disabled while off; disabled fields are omitted from FormData.
							formData.set('days', expiryReminderDays);
						}
					)}
				>
					<input type="hidden" name="enabled" value={expiryRemindersEnabled ? 'true' : 'false'} />
					<Toggle
						checked={expiryRemindersEnabled}
						label={t('settings.expiryReminders.enable')}
						onchange={(enabled) => {
							expiryRemindersEnabled = enabled;
							expiryRemindersForm?.requestSubmit();
						}}
					/>
					<label class="expiry-days">
						<span>{t('settings.expiryReminders.daysLabel')}</span>
						<select
							name="days"
							disabled={!expiryRemindersEnabled}
							bind:value={expiryReminderDays}
							onchange={(event) => event.currentTarget.form?.requestSubmit()}
						>
							<option value="3">{t('settings.expiryReminders.daysOption', { days: 3 })}</option>
							<option value="7">{t('settings.expiryReminders.daysOption', { days: 7 })}</option>
						</select>
					</label>
					{#if expiryRemindersSubmitting}
						<span class="expiry-saving">{t('common.saving')}</span>
					{/if}
				</form>
			</SettingsRow>

			{#if data.autoExpiredGraceDays != null}
				<SettingsRow
					title={t('settings.autoExpiredGrace.title')}
					note={t('settings.autoExpiredGrace.note')}
					last={false}
				>
					<form
						method="POST"
						action="?/updateAutoExpiredGrace"
						class="expiry-reminders-form"
						bind:this={autoExpiredGraceForm}
						use:enhance={bindSubmitting((v) => (autoExpiredGraceSubmitting = v))}
					>
						<label class="expiry-days">
							<span>{t('settings.autoExpiredGrace.daysLabel')}</span>
							<select
								name="days"
								bind:value={autoExpiredGraceDays}
								onchange={(event) => event.currentTarget.form?.requestSubmit()}
							>
								<option value="3">
									{t('settings.autoExpiredGrace.daysOption', { days: 3 })}
								</option>
								<option value="7">
									{t('settings.autoExpiredGrace.daysOption', { days: 7 })}
								</option>
								<option value="14">
									{t('settings.autoExpiredGrace.daysOption', { days: 14 })}
								</option>
							</select>
						</label>
						{#if autoExpiredGraceSubmitting}
							<span class="expiry-saving">{t('common.saving')}</span>
						{/if}
					</form>
				</SettingsRow>
			{/if}

			<SettingsRow
				title={t('settings.pushNotifications.title')}
				note={t('settings.pushNotifications.note')}
				last={false}
			>
				<div class="push-notifications-control">
					<Toggle
						checked={pushNotificationsEnabled}
						disabled={!pushSupported || pushNotificationsSubmitting}
						label={t('settings.pushNotifications.enable')}
						onchange={(enabled) => {
							void togglePushNotifications(enabled);
						}}
					/>
					{#if !pushSupported}
						<p class="push-hint">{t('settings.pushNotifications.unsupported')}</p>
					{/if}
					{#if pushNotificationsSubmitting}
						<span class="expiry-saving">{t('common.saving')}</span>
					{/if}
					{#if pushNotificationsError}
						<p class="push-error" role="alert">{pushNotificationsError}</p>
					{/if}
				</div>
			</SettingsRow>

			<SettingsRow
				title={t('settings.shoppingPush.title')}
				note={t('settings.shoppingPush.note')}
				last
			>
				<form
					method="POST"
					action="?/updateShoppingPush"
					bind:this={shoppingPushForm}
					use:enhance={bindSubmitting(
						(v) => (shoppingPushSubmitting = v),
						(formData) =>
							formData.set('enabled', shoppingPushEnabled ? 'true' : 'false')
					)}
				>
					<input type="hidden" name="enabled" value={shoppingPushEnabled ? 'true' : 'false'} />
					<Toggle
						checked={shoppingPushEnabled}
						disabled={
							shoppingPushSubmitting ||
							!pushSupported ||
							(!pushNotificationsEnabled && !shoppingPushEnabled)
						}
						label={t('settings.shoppingPush.enable')}
						onchange={(enabled) => {
							if (enabled && !pushNotificationsEnabled) {
								return;
							}
							shoppingPushEnabled = enabled;
							shoppingPushForm?.requestSubmit();
						}}
					/>
					{#if pushSupported && !pushNotificationsEnabled}
						<p class="push-hint">{t('settings.shoppingPush.requiresPush')}</p>
					{/if}
					{#if shoppingPushSubmitting}
						<span class="expiry-saving">{t('common.saving')}</span>
					{/if}
				</form>
			</SettingsRow>
		</SettingsSection>

		<SettingsSection
			id="settings-app"
			title={t('settings.app.title')}
			description={t('settings.app.description')}
		>
			<SettingsRow
				title={t('settings.language.title')}
				note={t('settings.language.description')}
				last={false}
			>
				<LanguageSwitcher />
			</SettingsRow>

			<details class="settings-disclosure">
				<summary class="settings-disclosure-summary">{t('settings.more.summary')}</summary>
				<div class="settings-disclosure-body">
			<SettingsRow
				title={t('settings.pets.title')}
				note={t('settings.pets.note')}
				last={false}
			>
				<form
					method="POST"
					action="?/togglePets"
					use:enhance={bindSubmitting((v) => (petsToggleSubmitting = v))}
				>
					<input type="hidden" name="enabled" value={data.petsEnabled ? 'false' : 'true'} />
					<Button
						type="submit"
						variant={data.petsEnabled ? 'ghost' : 'primary'}
						loading={petsToggleSubmitting}
						loadingLabel={t('common.saving')}
					>
						{data.petsEnabled ? t('settings.pets.disable') : t('settings.pets.enable')}
					</Button>
				</form>
				{#if data.petsEnabled}
					<button type="button" class="text-action" onclick={() => (petModalOpen = true)}>
						{t('settings.pets.add')}
					</button>
				{/if}
			</SettingsRow>

			{#if data.petsEnabled}
				<div class="pet-panel">
					<h3 class="pet-heading">{t('settings.pets.heading')}</h3>
					{#if data.pets.length === 0}
						<p class="pet-empty">{t('settings.pets.empty')}</p>
					{:else}
						<ul class="pet-list">
							{#each data.pets as pet, index (pet.id)}
								<li class:last={index === data.pets.length - 1}>
									<div>
										<strong>{pet.name}</strong>
										{#if pet.species}
											<span class="species">{pet.species}</span>
										{/if}
									</div>
									<DeleteConfirmButton
										tier={3}
										context="pet"
										copyOptions={{ itemName: pet.name }}
										action="?/deletePet"
										label={t('settings.pets.remove')}
										ariaLabel={t('settings.pets.removeNamed', { name: pet.name })}
									>
										<input type="hidden" name="id" value={pet.id} />
									</DeleteConfirmButton>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
			<SettingsRow
				href="/install-app"
				title={t('settings.installApp.title')}
				note={t('settings.installApp.note')}
				last={false}
			/>
			<SettingsRow title={t('settings.onboarding.title')} note={t('settings.onboarding.note')} last>
				<button type="button" class="text-action" onclick={replayOnboardingGuide}>
					{t('settings.onboarding.start')}
				</button>
			</SettingsRow>
				</div>
			</details>
		</SettingsSection>

		<SettingsSection
			id="settings-plan"
			title={t('settings.plan.title')}
			description={data.isPro ? t('settings.plan.descriptionPro') : t('settings.plan.description')}
		>
			{#if data.planLimits && !data.isPro}
				<PlanLimitBanner snapshot={data.planLimits} stripeCheckoutEnabled={data.stripeCheckoutEnabled} />
			{/if}
			{#if data.isPro}
				<ProActivePanel
					isOwner={data.isOwner}
					billing={data.billing}
					stripeCheckoutEnabled={data.stripeCheckoutEnabled}
					checkoutStatus={data.checkoutStatus}
				/>
			{:else}
				<SettingsRow
					title={t('settings.plan.currentTier')}
					note={t('settings.plan.currentFree')}
					last={false}
				/>
			{/if}
			{#if data.planLimits && !data.isPro}
				<div class="plan-panel plan-usage-panel">
					<h3 class="plan-heading">{t('settings.plan.usageTitle')}</h3>
					<ul class="plan-usage-list">
						{#each data.planLimits.limits as row (row.key)}
							<li class:at-limit={row.atLimit}>
								<span class="plan-usage-label">{t(planLimitUsageLabelKey(row.key))}</span>
								<span class="plan-usage-value">
									{#if row.limit === null}
										{t('settings.plan.usageUnlimited')}
									{:else}
										{t('settings.plan.usageCount', { used: row.used, limit: row.limit })}
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			<details class="settings-disclosure plan-compare">
				<summary class="settings-disclosure-summary">{t('settings.plan.compareSummary')}</summary>
				<div class="plan-panel" id="plan-upgrade">
					<h3 class="plan-heading">{t('settings.plan.freeLimitsTitle')}</h3>
					<p class="plan-copy">
						{t('settings.plan.freeLimitsItems', {
							items: FREE_LIMITS.maxInventoryItems,
							members: FREE_LIMITS.maxHouseholdMembers,
							aiScans: FREE_LIMITS.aiScansPerMonth,
							receipts: FREE_LIMITS.receiptPdfParsesPerMonth,
							smartFill: FREE_LIMITS.smartFillPerWeek
						})}
					</p>
					<h3 class="plan-heading">{t('settings.plan.proTitle')}</h3>
					<ul class="plan-pro-list">
						<li>{t('settings.plan.proUnlimitedAi')}</li>
						<li>{t('settings.plan.proUnlimitedReceipt')}</li>
						<li>{t('settings.plan.proUnlimitedSmartFill')}</li>
						<li>{t('settings.plan.proInsights')}</li>
						<li>
							{t('settings.plan.proMembers', { max: PRO_LIMITS.maxHouseholdMembers ?? 6 })}
						</li>
					</ul>
					<p class="plan-copy plan-muted">
						{t('settings.plan.priceHint', {
							monthly: PRICE_HYPOTHESIS_SEK.monthly,
							yearly: PRICE_HYPOTHESIS_SEK.yearly
						})}
					</p>
					{#if !data.isPro && data.stripeCheckoutEnabled}
						<ProUpgradePanel
							isOwner={data.isOwner}
							checkoutStatus={data.checkoutStatus === 'portal' ? null : data.checkoutStatus}
						/>
					{:else if !data.isPro}
						<p class="plan-copy plan-muted">{t('settings.plan.comingSoon')}</p>
						<ProWaitlistForm
							action="?/joinProWaitlist"
							source="settings"
							title={t('settings.plan.waitlistTitle')}
							description={t('settings.plan.waitlistDescription')}
							emailLabel={t('settings.plan.waitlistEmailLabel')}
							submitLabel={t('settings.plan.waitlistSubmitLabel')}
							successMessage={t('settings.plan.waitlistSuccess')}
							existsMessage={t('settings.plan.waitlistExists')}
							email={data.user?.email ?? ''}
							emailReadonly
							{form}
						/>
					{/if}
				</div>
			</details>
			<SettingsRow
				href="/priser"
				title={t('settings.plan.learnMore')}
				note={t('settings.plan.learnMoreNote')}
				last
			/>
		</SettingsSection>

		<SettingsSection
			id="settings-feedback"
			title={t('settings.feedback.title')}
			description={t('settings.feedback.description')}
		>
			{#if feedbackSuccess}
				<div class="feedback-panel">
					<FeedbackBanner tone="success" message={t('settings.feedback.thanks')} />
				</div>
			{/if}
			<form
				method="POST"
				action="?/submitProductFeedback"
				class="feedback-form"
				use:enhance={bindSubmitting((v) => (feedbackSubmitting = v))}
			>
				<input type="hidden" name="source" value="settings" />
				<label class="feedback-field">
					<span>{t('settings.feedback.topicQuestion')}</span>
					<select name="churnReason">
						<option value="">{t('settings.feedback.topicOptional')}</option>
						{#each CHURN_REASONS as reason}
							<option value={reason}>{t(`settings.feedback.topicReasons.${reason}`)}</option>
						{/each}
					</select>
				</label>
				<label class="feedback-field">
					<span>{t('settings.feedback.messageLabel')}</span>
					<textarea
						name="message"
						required
						minlength="3"
						maxlength="2000"
						rows="4"
						placeholder={t('settings.feedback.messagePlaceholder')}
					></textarea>
					{#if feedbackErrors.message?.[0]}
						<p class="feedback-error" role="alert">{t('settings.feedback.messageTooShort')}</p>
					{/if}
				</label>
				<Button type="submit" loading={feedbackSubmitting} loadingLabel={t('common.saving')}>
					{t('feedback.submit')}
				</Button>
			</form>
		</SettingsSection>
	</div>
	</PageContainer>

	<Modal
		open={petModalOpen}
		onClose={() => (petModalOpen = false)}
		variant="center"
		title={t('settings.pets.modalTitle')}
		panelClass="pet-settings-panel"
	>
		<form
			method="POST"
			action="?/addPet"
			class="pet-form"
			use:enhance={bindSubmitting((v) => (addPetSubmitting = v))}
		>
			<label>
				{t('common.name')}
				<input name="name" required maxlength="80" placeholder={t('settings.pets.namePlaceholder')} />
			</label>
			<label>
				{t('settings.pets.speciesOptional')}
				<input name="species" maxlength="80" placeholder={t('settings.pets.speciesPlaceholder')} />
			</label>
			<div class="modal-actions">
				<Button type="button" variant="secondary" onclick={() => (petModalOpen = false)}>
					{t('common.cancel')}
				</Button>
				<Button type="submit" loading={addPetSubmitting} loadingLabel={t('common.saving')}>
					{t('common.save')}
				</Button>
			</div>
		</form>
	</Modal>

{#if pushToastMessage}
	<Toast message={pushToastMessage} visible={true} onDismiss={dismissPushToast} />
{/if}
{#if expirySettingsToast}
	<Toast
		message={expirySettingsToast}
		visible={true}
		variant="success"
		size="action"
		onDismiss={dismissExpirySettingsToast}
	/>
{/if}

<ProActivationCelebration
	show={data.checkoutStatus === 'success'}
	isPro={data.isPro}
/>
</AppLayout>

<style>
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.settings-disclosure {
		border-top: 1px solid var(--color-border);
	}

	.settings-disclosure-summary {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: var(--space-md) var(--space-lg);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
		list-style: none;
	}

	.settings-disclosure-summary::-webkit-details-marker {
		display: none;
	}

	.settings-disclosure-summary::after {
		content: '▾';
		margin-left: auto;
		color: var(--color-text-muted);
		transition: transform 0.15s;
	}

	.settings-disclosure[open] .settings-disclosure-summary::after {
		transform: rotate(180deg);
	}

	.settings-disclosure-body :global(.settings-row:last-child) {
		border-bottom: none;
	}

	.plan-compare .plan-panel {
		border-top: none;
	}

	.expiry-reminders-form {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-sm);
		min-width: min(100%, 240px);
	}

	.expiry-days {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		width: 100%;
	}

	.expiry-days select {
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.expiry-days select:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.expiry-saving {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.push-notifications-control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.push-hint,
	.push-error {
		margin: 0;
		font-size: 0.85rem;
	}

	.push-hint {
		color: var(--color-text-muted);
	}

	.push-error {
		color: var(--color-danger, #b42318);
	}

	.pet-panel {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.pet-heading {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.pet-empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.86rem;
	}

	.pet-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.pet-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
		border-bottom: 1px solid var(--color-border);
	}

	.pet-list li.last {
		border-bottom: none;
	}

	.species {
		margin-left: var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	:global(.pet-settings-panel) {
		width: min(460px, calc(100vw - 2 * var(--space-md)));
	}

	.pet-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.pet-form label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.pet-form input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.plan-panel {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.plan-heading {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.plan-heading:not(:first-child) {
		margin-top: var(--space-md);
	}

	.plan-copy {
		margin: 0;
		font-size: 0.86rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.plan-muted {
		margin-top: var(--space-sm);
	}

	.plan-pro-list {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.86rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.plan-pro-list li + li {
		margin-top: 0.25rem;
	}

	.plan-usage-list {
		list-style: none;
		margin: 0 0 var(--space-md);
		padding: 0;
	}

	.plan-usage-list li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-xs) 0;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--color-border);
	}

	.plan-usage-list li.at-limit .plan-usage-value {
		color: var(--color-danger);
		font-weight: 600;
	}

	.plan-usage-label {
		color: var(--color-text-muted);
	}

	.feedback-panel {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.feedback-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
	}

	.feedback-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.feedback-field select,
	.feedback-field textarea {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
	}

	.feedback-error {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-danger, #b42318);
	}

	@media (max-width: 640px) {
		.pet-list li {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
