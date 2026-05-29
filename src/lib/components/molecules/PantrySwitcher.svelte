<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import type { UserHouseholdSummary } from '$lib/domain/household';
	import { householdRoleLabel } from '$lib/domain/household';

	interface Props {
		households: UserHouseholdSummary[];
		activeHousehold: { id: string; name: string } | null;
	}

	let { households, activeHousehold }: Props = $props();

	let open = $state(false);
	let createOpen = $state(false);
	let newPantryName = $state('');

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
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label="Byt pantry, nuvarande: {displayName}"
				onclick={() => (open ? close() : (open = true))}
			>
				<span class="pantry-icon" aria-hidden="true">🏠</span>
				<span class="pantry-name">{displayName}</span>
				<span class="chevron" aria-hidden="true">▾</span>
			</button>

			{#if open}
				<button type="button" class="desktop-backdrop" aria-label="Stäng pantry-meny" onclick={close}></button>
				<div class="desktop-panel" role="listbox" aria-label="Dina pantries">
					<p class="panel-label">Byt pantry</p>
					<ul class="pantry-list">
						{#each households as pantry (pantry.id)}
							<li>
								{#if pantry.isActive}
									<span class="pantry-option active" aria-current="true">
										<span class="option-name">{pantry.name}</span>
										<span class="option-meta">{householdRoleLabel(pantry.role)} · aktiv</span>
									</span>
								{:else}
									<form
										method="POST"
										action="/?/switchHousehold"
										use:enhance={switchEnhance}
										class="switch-form"
									>
										<input type="hidden" name="householdId" value={pantry.id} />
										<input type="hidden" name="redirectTo" value={pathname} />
										<button type="submit" class="pantry-option" role="option">
											<span class="option-name">{pantry.name}</span>
											<span class="option-meta">{householdRoleLabel(pantry.role)}</span>
										</button>
									</form>
								{/if}
							</li>
						{/each}
					</ul>
					{#if createOpen}
						<form
							method="POST"
							action="/?/createHousehold"
							use:enhance={createEnhance}
							class="create-form"
						>
							<input type="hidden" name="redirectTo" value={pathname} />
							<label class="create-label">
								Namn
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
								<button type="submit" class="primary-btn">Skapa</button>
							</div>
						</form>
					{:else}
						<button type="button" class="create-trigger" onclick={() => (createOpen = true)}>
							+ Skapa ny pantry
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Mobile: tap name → bottom sheet -->
		<button
			type="button"
			class="mobile-trigger"
			aria-expanded={open}
			aria-haspopup="dialog"
			aria-controls="pantry-sheet"
			aria-label="Byt pantry, nuvarande: {displayName}"
			onclick={openSheet}
		>
			<span class="pantry-icon" aria-hidden="true">🏠</span>
			<span class="pantry-name">{displayName}</span>
			<span class="chevron" aria-hidden="true">▾</span>
		</button>

		{#if open}
			<button type="button" class="sheet-scrim" aria-label="Stäng pantry-meny" onclick={close}></button>
			<div id="pantry-sheet" class="pantry-sheet" role="dialog" aria-modal="true" aria-label="Byt pantry">
				<div class="sheet-handle" aria-hidden="true"></div>
				<h2 class="sheet-title">Byt pantry</h2>
				<ul class="sheet-list">
					{#each households as pantry (pantry.id)}
						<li>
							{#if pantry.isActive}
								<span class="sheet-option active" aria-current="true">
									<span class="option-name">{pantry.name}</span>
									<span class="option-meta">{householdRoleLabel(pantry.role)} · aktiv</span>
								</span>
							{:else}
								<form
									method="POST"
									action="/?/switchHousehold"
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

				{#if createOpen}
					<form
						method="POST"
						action="/?/createHousehold"
						use:enhance={createEnhance}
						class="create-form sheet-create"
					>
						<input type="hidden" name="redirectTo" value={pathname} />
						<label class="create-label">
							Namn på ny pantry
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
			</div>
		{/if}
	</div>
{/if}

<style>
	.pantry-switcher {
		position: relative;
		min-width: 0;
	}

	.desktop-switcher {
		display: none;
		position: relative;
	}

	.mobile-trigger {
		display: inline-flex;
	}

	.pantry-trigger,
	.mobile-trigger {
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
		font-size: 0.95rem;
		line-height: 1;
		flex-shrink: 0;
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
		z-index: 65;
		border: 0;
		background: transparent;
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
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
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

	.sheet-scrim {
		position: fixed;
		inset: 0;
		z-index: 75;
		border: 0;
		background: rgba(0, 0, 0, 0.35);
		cursor: pointer;
	}

	.pantry-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 80;
		padding: var(--space-md) var(--space-lg) calc(var(--space-xl) + 4.5rem + env(safe-area-inset-bottom, 0));
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		background: color-mix(in srgb, var(--color-surface) 94%, transparent);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		box-shadow: var(--shadow-md);
		animation: sheet-up 0.28s ease;
	}

	.sheet-handle {
		width: 2.5rem;
		height: 0.25rem;
		margin: 0 auto var(--space-md);
		border-radius: 999px;
		background: var(--color-border);
	}

	.sheet-title {
		margin: 0 0 var(--space-md);
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.sheet-option {
		min-height: 3rem;
		padding: 0.75rem 0.85rem;
		font-size: 1rem;
	}

	.sheet-create {
		margin-top: var(--space-md);
	}

	@keyframes sheet-up {
		from {
			transform: translateY(100%);
			opacity: 0.6;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (min-width: 900px) {
		.desktop-switcher {
			display: block;
		}

		.mobile-trigger,
		.sheet-scrim,
		.pantry-sheet {
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

	@media (prefers-reduced-motion: reduce) {
		.pantry-sheet {
			animation: none;
		}
	}
</style>
