<script lang="ts">
	import { getLocale } from '$lib/i18n';

	interface Props {
		body: string;
		createdAt: string | Date;
		mine?: boolean;
	}

	let { body, createdAt, mine = false }: Props = $props();

	const locale = getLocale();

	function formatTime(value: string | Date): string {
		const date = value instanceof Date ? value : new Date(value);
		return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
</script>

<div class="bubble-row" class:mine data-testid={mine ? 'market-chat-bubble-mine' : 'market-chat-bubble-theirs'}>
	<div class="bubble" class:mine>
		<p class="body">{body}</p>
		<time datetime={String(createdAt)}>{formatTime(createdAt)}</time>
	</div>
</div>

<style>
	.bubble-row {
		display: flex;
		justify-content: flex-start;
	}

	.bubble-row.mine {
		justify-content: flex-end;
	}

	.bubble {
		max-width: min(85%, 22rem);
		padding: var(--space-sm) var(--space-md);
		border-radius: 1.125rem 1.125rem 1.125rem var(--space-2xs);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		display: grid;
		gap: var(--space-2xs);
	}

	.bubble.mine {
		border-radius: 1.125rem 1.125rem var(--space-2xs) 1.125rem;
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-on-primary, #fff);
	}

	.body {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		font-size: 0.9375rem;
		line-height: 1.4;
	}

	time {
		font-size: 0.6875rem;
		opacity: 0.75;
		justify-self: end;
	}

	.bubble:not(.mine) time {
		color: var(--color-text-muted);
		opacity: 1;
	}
</style>
