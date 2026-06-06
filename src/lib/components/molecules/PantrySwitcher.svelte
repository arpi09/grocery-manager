<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { UserHouseholdSummary } from '$lib/domain/household';
	import { getLocale, t } from '$lib/i18n';
	import { householdRoleLabel } from '$lib/domain/household';
	import { PANTRY_CREATE_ACTION, PANTRY_SWITCH_ACTION } from '$lib/navigation/app-home';
	import { NAV_NARROW_MEDIA_QUERY, subscribeNarrowViewport } from '$lib/utils/use-narrow-viewport';

	interface Props {
		households: UserHouseholdSummary[];
		activeHousehold: { id: string; name: string } | null;
	}

	let { households, activeHousehold }: Props = $props();

	let open = $state(false);
	let createOpen = $state(false);
	let newPantryName = $state('');
	let isNarrowViewport = $state(
		typeof window !== 'undefined' ? window.matchMedia(NAV_NARROW_MEDIA_QUERY).matches : false
	);

	$effect(() => subscribeNarrowViewport((matches) => {
		isNarrowViewport = matches;
	}));

	const pathname = $derived(page.url.pathname);
	const displayName = $derived(activeHousehold?.name ?? 'Pantry');

	function close() {
		open = false;
		createOpen = false;
	}

	function openSheet() {
		open = true;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}

	function switchEnhance() {
		return () => {
			close();
			invalidateAll();
		};
	}

	function createEnhance() {
		return () => {
			close();
			newPantryName = '';
			invalidateAll();
		};
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if activeHousehold}
	<div class="pantry-switcher">
		<!-- Desktop dropdown -->
		<div class="desktop-switcher">
			<button
				type="button"
				class="pantry-trigger"
				data-testid="pantry-switcher-trigger-desktop"
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label={t('pantry.switchAria', { name: displayName })}
				onclick={() => (open ? close() : (open = true))}
			>
				<span class="pantry-icon" aria-hidden="true">
					<FeatureIcon id="home" size={18} />
				</span>
				<span class="pantry-name">{displayName}</span>
				<span class="chevron" aria-hidden="true">▾</span>
			</button>

			{#if open && !isNarrowViewport}
				<button type="button" class="desktop-backdrop nav-dropdown-scrim" aria-label={t('pantry.closeMenu')} onclick={close}></button>
				<div class="desktop-panel" role="listbox" data-testid="pantry-switcher-menu" aria-label={t('pantry.listAria')}>
					<p class="panel-label label-caps">{t('pantry.switchTitle')}</p>
					<ul class="pantry-list">
						{#each households as pantry (pantry.id)}
							<li>
								{#if pantry.isActive}
									<span class="pantry-option active" aria-current="true">
										<span class="option-name">{pantry.name}</span>
										<span class="option-meta">{householdRoleLabel(pantry.role, getLocale())} · {t('pantry.activeSuffix')}</span>
									</span>
								{:else}
									<form
										method="POST"
										action={PANTRY_SWITCH_ACTION}
										use:enhance={switchEnhance}
										class="switch-form"
									>
										<input type="hidden" name="householdId" value={pantry.id} />
										<input type="hidden" name="redirectTo" value={pathname} />
										<button type="submit" class="pantry-option" role="option" aria-selected="false">
											<span class="option-name">{pantry.name}</span>
											<span class="option-meta">{householdRoleLabel(pantry.role, getLocale())}</span>
										</button>
									</form>
								{/if}
							</li>
						{/each}
					</ul>
					{#if createOpen}
						<form
							method="POST"
							action={PANTRY_CREATE_ACTION}
							use:enhance={createEnhance}
							class="create-form"
						>
							<input type="hidden" name="redirectTo" value={pathname} />
							<label class="create-label">
								{t('common.name')}
								<input
									name="name"
									type="text"
									required
									maxlength="80"
									placeholder={t('pantry.namePlaceholder')}
									bind:value={newPantryName}
								/>
							</label>
							<div class="create-actions">
								<button type="button" class="text-btn" onclick={() => (createOpen = false)}>
									{t('common.cancel')}
								</button>
								<button type="submit" class="primary-btn">{t('common.create')}</button>
							</div>
						</form>
					{:else}
						<button type="button" class="create-trigger" onclick={() => (createOpen = true)}>
							+ {t('pantry.createNew')}
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Mobile: tap name → bottom sheet -->
		<button
			type="button"
			class="mobile-trigger"
			data-testid="pantry-switcher-trigger-mobile"
			aria-expanded={open && isNarrowViewport}
			aria-haspopup="dialog"
			aria-label={t('pantry.switchAria', { name: displayName })}
			onclick={openSheet}
		>
			<span class="pantry-icon" aria-hidden="true">
				<FeatureIcon id="home" size={18} />
			</span>
			<span class="pantry-name">{displayName}</span>
			<span class="chevron" aria-hidden="true">▾</span>
		</button>

		<Modal
			open={open && isNarrowViewport}
			onClose={close}
			variant="sheet"
			title={t('pantry.switchTitle')}
			panelClass="pantry-sheet-panel"
			bodyClass="pantry-sheet-body"
		>
			<div data-testid="pantry-switcher-menu">
			<ul class="sheet-list">
				{#each households as pantry (pantry.id)}
					<li>
						{#if pantry.isActive}
							<span class="sheet-option active" aria-current="true">
								<span class="option-name">{pantry.name}</span>
								<span class="option-meta">{householdRoleLabel(pantry.role, getLocale())} · {t('pantry.activeSuffix')}</span>
							</span>
						{:else}
							<form
								method="POST"
								action={PANTRY_SWITCH_ACTION}
								use:enhance={switchEnhance}
								class="switch-form"
							>
								<input type="hidden" name="householdId" value={pantry.id} />
								<input type="hidden" name="redirectTo" value={pathname} />
								<button type="submit" class="sheet-option">
									<span class="option-name">{pantry.name}</span>
									<span class="option-meta">{householdRoleLabel(pantry.role)}</span>
								</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
			</div>

			{#if createOpen}
				<form
					method="POST"
					action={PANTRY_CREATE_ACTION}
					use:enhance={createEnhance}
					class="create-form sheet-create"
				>
					<input type="hidden" name="redirectTo" value={pathname} />
					<label class="create-label">
						{t('pantry.newName')}
						<input
							name="name"
							type="text"
							required
							maxlength="80"
							placeholder="t.ex. Sommarstuga"
							bind:value={newPantryName}
						/>
					</label>
					<div class="create-actions">
						<button type="button" class="text-btn" onclick={() => (createOpen = false)}>
							Avbryt
						</button>
						<button type="submit" class="primary-btn">Skapa pantry</button>
					</div>
				</form>
			{:else}
				<button type="button" class="create-trigger sheet-create-trigger" onclick={() => (createOpen = true)}>
					+ Skapa ny pantry
				</button>
			{/if}
		</Modal>
	</div>
{/if}

<style>
	.pantry-switcher {
		position: relative;
		z-index: 1;
		min-width: 0;
	}

	.desktop-switcher {
		display: none;
		position: relative;
	}

	.pantry-trigger,
	.mobile-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 2.75rem;
		padding: 0.35rem 0.65rem;
		border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-surface-muted) 70%, transparent);
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		max-width: 100%;
		min-width: 0;
	}

	.pantry-trigger:hover,
	.mobile-trigger:hover {
		background: var(--color-surface-muted);
	}

	.pantry-trigger:focus-visible,
	.mobile-trigger:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.pantry-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.pantry-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 9rem;
	}

	.chevron {
		color: var(--color-text-muted);
		font-size: 0.7rem;
		flex-shrink: 0;
	}

	.desktop-backdrop {
		position: fixed;
		inset: 0;
		z-index: 0;
		border: 0;
		cursor: default;
	}

	.desktop-panel {
		position: absolute;
		top: calc(100% + 0.35rem);
		left: 0;
		z-index: 70;
		min-width: 16rem;
		max-width: 20rem;
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-surface) 94%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: var(--shadow-md);
	}

	.panel-label {
		margin: 0 0 var(--space-xs);
		padding: 0 0.35rem;
	}

	.pantry-list,
	.sheet-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.switch-form {
		display: block;
		margin: 0;
	}

	.pantry-option,
	.sheet-option {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.1rem;
		width: 100%;
		min-height: 2.75rem;
		padding: 0.55rem 0.65rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.pantry-option:hover,
	.sheet-option:hover {
		background: var(--color-surface-muted);
	}

	.pantry-option.active,
	.sheet-option.active {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
		color: var(--color-primary);
		cursor: default;
	}

	.option-name {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.option-meta {
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.pantry-option.active .option-meta,
	.sheet-option.active .option-meta {
		color: color-mix(in srgb, var(--color-primary) 70%, var(--color-text-muted));
	}

	.create-trigger,
	.sheet-create-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 2.75rem;
		margin-top: var(--space-xs);
		padding: 0.55rem 0.75rem;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.create-trigger:hover,
	.sheet-create-trigger:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}

	.create-form {
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.create-label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.create-label input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 400;
	}

	.create-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	.text-btn {
		min-height: 2.75rem;
		padding: 0.45rem 0.75rem;
		border: 0;
		background: transparent;
		color: var(--color-text-muted);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn {
		min-height: 2.75rem;
		padding: 0.45rem 1rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: #fff;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn:hover {
		background: var(--color-primary-hover);
	}

	:global(.pantry-sheet-panel) {
		max-height: min(85dvh, 640px);
		padding-bottom: calc(var(--content-bottom-safe) + var(--space-sm));
	}

	:global(.pantry-sheet-body) {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sheet-option {
		min-height: 3rem;
		padding: 0.75rem 0.85rem;
		font-size: 1rem;
	}

	.sheet-create {
		margin-top: var(--space-md);
	}

	@media (min-width: 900px) {
		.desktop-switcher {
			display: block;
		}

		.mobile-trigger {
			display: none;
		}
	}

	@media (max-width: 899px) {
		.desktop-switcher .pantry-trigger,
		.desktop-panel,
		.desktop-backdrop {
			display: none;
		}
	}

</style>
