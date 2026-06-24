<script lang="ts">
	import { browser } from '$app/environment';
	import { createTurnstileMount, type TurnstileMountHandle } from '$lib/client/turnstile-mount';
	import { getTurnstileLoadErrorMessageKey } from '$lib/domain/turnstile-errors';
	import { t } from '$lib/i18n';

	interface Props {
		siteKey: string;
		labelledBy?: string;
		loadFailed?: boolean;
	}

	let { siteKey, labelledBy, loadFailed = $bindable(false) }: Props = $props();

	let errorCode = $state<string | undefined>(undefined);

	const loadErrorMessage = $derived(t(getTurnstileLoadErrorMessageKey(errorCode)));

	function markLoadFailed(code?: string) {
		errorCode = code;
		loadFailed = true;
	}

	function turnstileMountAction(node: HTMLDivElement, key: string) {
		if (!browser) {
			return;
		}

		let handle: TurnstileMountHandle | undefined;
		let activeKey = key;

		const callbacks = {
			onSuccess: () => {
				errorCode = undefined;
				loadFailed = false;
			},
			onError: markLoadFailed
		};

		const mount = (nextKey: string) => {
			if (!nextKey.trim()) {
				handle?.destroy();
				handle = undefined;
				markLoadFailed('missing-key');
				return;
			}

			handle?.destroy();
			handle = createTurnstileMount(node, { siteKey: nextKey, ...callbacks });
		};

		mount(activeKey);

		return {
			update(newKey: string) {
				if (newKey === activeKey) {
					return;
				}
				activeKey = newKey;
				mount(newKey);
			},
			destroy() {
				handle?.destroy();
				handle = undefined;
			}
		};
	}
</script>

<div
	use:turnstileMountAction={siteKey}
	class="turnstile"
	aria-label={labelledBy ? undefined : t('auth.register.captchaLabel')}
	aria-labelledby={labelledBy}
></div>
{#if loadFailed}
	<p class="load-error" role="alert" data-turnstile-error-code={errorCode ?? 'unknown'}>
		{loadErrorMessage}
		{#if import.meta.env.DEV && errorCode}
			<span class="debug-code"> ({errorCode})</span>
		{/if}
	</p>
{/if}

<style>
	.turnstile {
		margin-bottom: var(--space-md);
		min-height: 65px;
		width: 100%;
	}

	.load-error {
		margin: calc(-1 * var(--space-sm)) 0 var(--space-md);
		font-size: 0.875rem;
		color: var(--color-danger);
	}

	.debug-code {
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
	}
</style>
