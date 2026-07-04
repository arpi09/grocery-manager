<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import type { HomePulseActivity, HomePulseMember } from '$lib/domain/household-pulse';
	import { memberColorVar, memberInitial } from '$lib/domain/household-pulse';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';

	const MAX_ROWS = 3;
	const MAX_AVATARS = 4;

	interface Props {
		expiringSoon: DashboardSummary['expiringSoon'];
		shoppingListCount: number;
		shoppingHref: string;
		moreHref: string;
		householdName?: string | null;
		members?: HomePulseMember[];
		lastActivity?: HomePulseActivity | null;
		canWrite?: boolean;
		onAddToList: (items: InventoryItem[]) => Promise<boolean>;
	}

	let {
		expiringSoon,
		shoppingListCount,
		shoppingHref,
		moreHref,
		householdName = null,
		members = [],
		lastActivity = null,
		canWrite = false,
		onAddToList
	}: Props = $props();

	const locale = $derived(getLocale());
	const visible = $derived(expiringSoon.slice(0, MAX_ROWS));
	const avatars = $derived(members.slice(0, MAX_AVATARS));

	const todayLabel = $derived(
		new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
			new Date()
		)
	);
	const subtitle = $derived(householdName ? `${householdName} · ${todayLabel}` : todayLabel);

	let deselected = $state<Record<string, boolean>>({});
	let adding = $state(false);
	let added = $state(false);

	const selectedItems = $derived(visible.filter((item) => !deselected[item.id]));
	const selectedCount = $derived(selectedItems.length);

	function expiryTone(item: InventoryItem): 'danger' | 'warning' | 'later' {
		const days = item.expiresOn ? daysUntilExpiry(item.expiresOn) : Number.MAX_SAFE_INTEGER;
		if (days <= 1) return 'danger';
		if (days <= 2) return 'warning';
		return 'later';
	}

	function toggle(item: InventoryItem) {
		if (added || adding || !canWrite) return;
		deselected = { ...deselected, [item.id]: !deselected[item.id] };
	}

	async function addSelected() {
		if (added || adding || !canWrite || selectedCount === 0) return;
		adding = true;
		try {
			added = await onAddToList(selectedItems);
		} finally {
			adding = false;
		}
	}

	function activityVerbKey(activity: HomePulseActivity): string {
		if (activity.eventType === 'inventory_write' && activity.action) {
			return `home.v6.pulseCard.activity.${activity.action}`;
		}
		if (activity.eventType === 'batch_review_completed')
			return 'home.v6.pulseCard.activity.batchReview';
		if (activity.eventType === 'staleness_confirmed')
			return 'home.v6.pulseCard.activity.stalenessConfirmed';
		if (activity.eventType === 'receipt_finish_accepted')
			return 'home.v6.pulseCard.activity.receiptFinishAccepted';
		return 'home.v6.pulseCard.activity.generic';
	}

	function relativeTime(date: Date): string {
		const diffMs = Date.now() - new Date(date).getTime();
		const minutes = Math.max(0, Math.round(diffMs / 60_000));
		if (minutes < 1) return t('home.v6.pulseCard.time.justNow');
		if (minutes < 60) return t('home.v6.pulseCard.time.minutes', { count: minutes });
		const hours = Math.round(minutes / 60);
		if (hours < 24) return t('home.v6.pulseCard.time.hours', { count: hours });
		return t('home.v6.pulseCard.time.days', { count: Math.round(hours / 24) });
	}

	const activityActor = $derived(
		lastActivity ? (lastActivity.actorName ?? t('home.v6.pulseCard.activity.someone')) : null
	);
</script>

<article class="pulse-card" data-testid="home-v2-pulse-card">
	<header class="card-header">
		<div class="header-left">
			<span class="status-dot" aria-hidden="true"></span>
			<div class="header-text">
				<h2 class="card-title">{t('home.v6.pulseCard.title')}</h2>
				<p class="card-subtitle">{subtitle}</p>
			</div>
		</div>
		{#if avatars.length > 1}
			<div class="avatar-cluster" aria-hidden="true">
				{#each avatars as member, index (member.userId)}
					<span class="avatar" style={`background: var(${memberColorVar(index)});`}>
						{memberInitial(member.name)}
					</span>
				{/each}
			</div>
		{/if}
	</header>

	<div class="card-section">
		<div class="section-head">
			<p class="sec-label">{t('home.v6.pulseCard.expiringLabel')}</p>
			{#if expiringSoon.length > 0}
				<span class="count-badge" aria-hidden="true">{expiringSoon.length}</span>
			{/if}
		</div>
		{#if visible.length === 0}
			<p class="empty-line">{t('home.v6.pulseCard.expiringEmpty')}</p>
		{:else}
			<div class="expiry-rows" role="group" aria-label={t('home.expiring.ariaLabel')}>
				{#each visible as item (item.id)}
					{@const on = !deselected[item.id]}
					<button
						type="button"
						class="expiry-row"
						class:deselected={!added && !on}
						data-testid="home-v2-expiring-row"
						aria-pressed={on}
						disabled={added || adding || !canWrite}
						onclick={() => toggle(item)}
					>
						<span class="item-icon zone-{item.location}" aria-hidden="true">
							<FeatureIcon id={item.location} size={18} />
						</span>
						<span class="item-name">{item.name}</span>
						{#if item.expiresOn}
							<span class="expiry-pill tone-{expiryTone(item)}">
								{formatDaysLeft(daysUntilExpiry(item.expiresOn), locale)}
							</span>
						{/if}
						{#if canWrite}
							<span class="check-circle" class:on aria-hidden="true">{on ? '✓' : ''}</span>
						{/if}
					</button>
				{/each}
			</div>
			{#if added}
				<p class="added-confirm" role="status">{t('home.v6.expiringCard.addedCta')}</p>
			{:else if canWrite}
				<Button
					type="button"
					fullWidth
					loading={adding}
					disabled={selectedCount === 0}
					data-testid="home-v2-pulse-add"
					data-analytics-id="home.expiring_quick_add"
					onclick={addSelected}
				>
					{selectedCount === 0
						? t('home.v6.expiringCard.addCtaEmpty')
						: t('home.v6.expiringCard.addCta', { count: selectedCount })}
				</Button>
			{/if}
			{#if expiringSoon.length > MAX_ROWS}
				<a class="more-link" href={moreHref}>{t('home.expiring.moreLink')}</a>
			{/if}
		{/if}
	</div>

	<div class="card-section shopping-row">
		<span class="cart-tile" aria-hidden="true">🛒</span>
		<div class="shopping-text">
			<p class="shopping-title">{t('home.v6.pulseCard.shoppingTitle')}</p>
			<p class="shopping-sub">
				{shoppingListCount === 0
					? t('home.v6.pulseCard.shoppingEmpty')
					: t('home.v6.pulseCard.shoppingCount', { count: shoppingListCount })}
			</p>
		</div>
		<a class="open-btn" href={shoppingHref} data-testid="home-v2-pulse-open">
			{t('home.v6.pulseCard.openCta')}
		</a>
	</div>

	<div class="card-section last-section">
		<p class="sec-label activity-label">{t('home.v6.pulseCard.activityLabel')}</p>
		{#if lastActivity && activityActor}
			<div class="activity-row">
				<span class="activity-avatar" aria-hidden="true">{memberInitial(activityActor)}</span>
				<p class="activity-text">
					<b>{activityActor}</b>
					{t(activityVerbKey(lastActivity) as never)}
					{#if lastActivity.itemName}<b>{lastActivity.itemName}</b>{/if}
				</p>
				<span class="activity-time">{relativeTime(lastActivity.createdAt)}</span>
			</div>
		{:else}
			<p class="empty-line">{t('home.v6.pulseCard.activityEmpty')}</p>
		{/if}
	</div>
</article>

<style>
	.pulse-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-lg) var(--space-lg) var(--space-md);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.status-dot {
		flex: none;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--color-success);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-success) 18%, transparent);
	}

	.header-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.card-title {
		margin: 0;
		font-size: 1.15rem;
		font-weight: var(--font-weight-display, 700);
		letter-spacing: -0.01em;
		color: var(--color-text);
	}

	.card-subtitle {
		margin: 0;
		font-size: var(--font-size-label, 0.75rem);
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.avatar-cluster {
		display: flex;
		flex: none;
	}

	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 12px;
		font-weight: 700;
		color: var(--color-on-primary);
		border: 2px solid var(--color-surface);
	}

	.avatar + .avatar {
		margin-left: -8px;
	}

	.card-section {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.last-section {
		padding-bottom: var(--space-lg);
	}

	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.sec-label {
		margin: 0;
		font-size: var(--font-size-label, 0.75rem);
		font-weight: var(--font-weight-label, 600);
		letter-spacing: var(--letter-spacing-label, 0.04em);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.count-badge {
		display: grid;
		place-items: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-danger) 13%, transparent);
		color: color-mix(in srgb, var(--color-danger) 55%, var(--color-text));
		font-size: 11px;
		font-weight: 700;
	}

	.expiry-rows {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.expiry-row {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: var(--touch-target-min, 2.75rem);
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.expiry-row:disabled {
		cursor: default;
	}

	.expiry-row:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.expiry-row.deselected .item-name {
		color: var(--color-text-muted);
		text-decoration: line-through;
	}

	.item-icon {
		flex: none;
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
	}

	.item-icon.zone-fridge {
		color: var(--color-fridge);
	}

	.item-icon.zone-freezer {
		color: var(--color-freezer);
	}

	.item-icon.zone-cupboard {
		color: var(--color-cupboard);
	}

	.item-name {
		flex: 1;
		min-width: 0;
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.expiry-pill {
		flex: none;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 700;
		white-space: nowrap;
	}

	/* Accent blandas mot text för WCAG AA-kontrast på tonplattorna (11px text) */
	.expiry-pill.tone-danger {
		color: color-mix(in srgb, var(--color-danger) 55%, var(--color-text));
		background: color-mix(in srgb, var(--color-danger) 12%, transparent);
	}

	.expiry-pill.tone-warning {
		color: color-mix(in srgb, var(--color-warning) 40%, var(--color-text));
		background: color-mix(in srgb, var(--color-warning) 13%, transparent);
	}

	.expiry-pill.tone-later {
		color: color-mix(in srgb, var(--color-secondary) 40%, var(--color-text));
		background: color-mix(in srgb, var(--color-secondary) 15%, transparent);
	}

	.check-circle {
		flex: none;
		width: 20px;
		height: 20px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		border: 1px solid var(--color-border);
		color: transparent;
		background: transparent;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1;
		transition: all 0.15s;
	}

	.check-circle.on {
		color: var(--color-on-primary);
		background: var(--color-primary);
		border-color: var(--color-primary);
		animation: pop-in 0.25s ease;
	}

	@keyframes pop-in {
		0% {
			transform: scale(0.6);
			opacity: 0;
		}
		60% {
			transform: scale(1.12);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.check-circle.on {
			animation: none;
		}
	}

	.expiry-rows + :global(button),
	.added-confirm {
		margin-top: var(--space-sm);
	}

	.added-confirm {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min, 2.75rem);
		border-radius: var(--radius-sm);
		background: var(--color-success);
		color: var(--color-on-primary);
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
	}

	.more-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min, 2.75rem);
		margin-top: 2px;
		font-size: var(--font-size-body-sm, 0.875rem);
	}

	.empty-line {
		margin: 0;
		font-size: var(--font-size-body-sm, 0.875rem);
		color: var(--color-text-muted);
	}

	.shopping-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.cart-tile {
		flex: none;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		display: grid;
		place-items: center;
		font-size: 19px;
		background: color-mix(in srgb, var(--color-primary) 11%, transparent);
	}

	.shopping-text {
		flex: 1;
		min-width: 0;
	}

	.shopping-title {
		margin: 0;
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
		color: var(--color-text);
	}

	.shopping-sub {
		margin: 1px 0 0;
		font-size: var(--font-size-label, 0.75rem);
		color: var(--color-text-muted);
	}

	.open-btn {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 36px;
		padding: 0 14px;
		margin: -4px 0;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: var(--font-size-body-sm, 0.875rem);
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s ease;
		position: relative;
	}

	/* 44px effektiv tapyta trots 36px visuell höjd */
	.open-btn::after {
		content: '';
		position: absolute;
		inset: -4px 0;
	}

	.open-btn:hover {
		background: var(--color-primary-hover);
	}

	.open-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.activity-label {
		margin-bottom: 10px;
	}

	.activity-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.activity-avatar {
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 13px;
		font-weight: 700;
		color: var(--color-on-primary);
		background: var(--color-fridge);
	}

	.activity-text {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-size: var(--font-size-body-sm, 0.875rem);
		color: var(--color-text);
		line-height: 1.35;
	}

	.activity-text b {
		font-weight: 600;
	}

	.activity-time {
		flex: none;
		font-size: var(--font-size-label, 0.75rem);
		color: var(--color-text-muted);
	}
</style>
