export const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
export const TURNSTILE_SCRIPT_SRC =
	'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const RENDER_CHECK_MS = 15_000;
const SCRIPT_WAIT_MS = 30_000;
const SCRIPT_POLL_MS = 100;
const MAX_RENDER_ATTEMPTS = 2;
const MAX_SCRIPT_LOAD_ATTEMPTS = 2;
const SCRIPT_LOAD_RETRY_MS = 500;

let scriptLoadPromise: Promise<void> | null = null;

/** @internal Resets cached script load state between unit tests. */
export function resetTurnstileScriptCacheForTests(): void {
	scriptLoadPromise = null;
}

export function hasTurnstileWidgetContent(node: HTMLElement): boolean {
	return Boolean(
		node.querySelector('iframe') || node.querySelector('input[name="cf-turnstile-response"]')
	);
}

function whenTurnstileReady(): Promise<void> {
	return new Promise((resolve) => {
		if (window.turnstile?.ready) {
			window.turnstile.ready(resolve);
			return;
		}
		resolve();
	});
}

function waitForTurnstileGlobal(script: HTMLScriptElement): Promise<void> {
	return new Promise((resolve, reject) => {
		let settled = false;

		const finish = () => {
			if (settled || !window.turnstile) {
				return;
			}
			settled = true;
			cleanup();
			whenTurnstileReady().then(resolve, reject);
		};

		const onTimeout = () => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			reject(new Error('turnstile script load failed'));
		};

		const cleanup = () => {
			clearTimeout(timeoutId);
			clearInterval(pollId);
			script.removeEventListener('load', finish);
		};

		script.addEventListener('load', finish, { once: true });
		const pollId = setInterval(finish, SCRIPT_POLL_MS);
		const timeoutId = setTimeout(onTimeout, SCRIPT_WAIT_MS);

		finish();
	});
}

/** Load Cloudflare Turnstile once; safe to call from multiple widgets. */
export function loadTurnstileScript(): Promise<void> {
	if (typeof window === 'undefined') {
		return Promise.resolve();
	}

	if (window.turnstile) {
		return whenTurnstileReady();
	}

	if (scriptLoadPromise) {
		return scriptLoadPromise;
	}

	const promise = new Promise<void>((resolve, reject) => {
		const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

		if (existing) {
			waitForTurnstileGlobal(existing).then(resolve, reject);
			return;
		}

		const script = document.createElement('script');
		script.id = TURNSTILE_SCRIPT_ID;
		script.src = TURNSTILE_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);
		waitForTurnstileGlobal(script).then(resolve, reject);
	});

	scriptLoadPromise = promise;
	promise.catch(() => {
		if (scriptLoadPromise === promise) {
			scriptLoadPromise = null;
		}
	});

	return promise;
}

export type TurnstileMountCallbacks = {
	siteKey: string;
	onSuccess?: () => void;
	onError?: (code?: string) => void;
};

export type TurnstileMountHandle = {
	destroy: () => void;
	rerender: (params: TurnstileMountCallbacks) => void;
};

export function createTurnstileMount(
	node: HTMLElement,
	params: TurnstileMountCallbacks
): TurnstileMountHandle {
	let widgetId: string | undefined;
	let cancelled = false;
	let renderCheckTimer: ReturnType<typeof setTimeout> | undefined;
	let renderAttempt = 0;
	let currentParams = params;

	function clearRenderCheck() {
		if (renderCheckTimer) {
			clearTimeout(renderCheckTimer);
			renderCheckTimer = undefined;
		}
	}

	function removeWidget() {
		clearRenderCheck();
		if (widgetId && window.turnstile) {
			window.turnstile.remove(widgetId);
			widgetId = undefined;
		}
	}

	function scheduleRenderCheck() {
		clearRenderCheck();
		renderCheckTimer = setTimeout(() => {
			if (cancelled) {
				return;
			}
			if (hasTurnstileWidgetContent(node)) {
				return;
			}
			if (renderAttempt + 1 < MAX_RENDER_ATTEMPTS) {
				console.warn('[turnstile] Widget not visible; retrying render');
				renderAttempt += 1;
				renderWidget();
				return;
			}
			console.warn('[turnstile] Widget did not mount within timeout');
			currentParams.onError?.('timeout');
		}, RENDER_CHECK_MS);
	}

	function renderWidget() {
		if (cancelled || !window.turnstile) {
			return;
		}

		const key = currentParams.siteKey.trim();
		if (!key) {
			currentParams.onError?.('missing-key');
			return;
		}

		removeWidget();

		const runRender = () => {
			if (cancelled || !window.turnstile) {
				return;
			}

			try {
				widgetId = window.turnstile.render(node, {
					sitekey: key,
					theme: 'auto',
					size: 'flexible',
					callback: () => {
						clearRenderCheck();
						renderAttempt = 0;
						currentParams.onSuccess?.();
					},
					'expired-callback': () => {
						if (widgetId && window.turnstile) {
							window.turnstile.reset(widgetId);
						}
					},
					'error-callback': (code) => {
						clearRenderCheck();
						console.warn(`[turnstile] Widget error: ${code ?? 'unknown'}`);
						currentParams.onError?.(code);
					}
				});
				scheduleRenderCheck();
			} catch (error) {
				clearRenderCheck();
				const detail = error instanceof Error ? error.message : 'render failed';
				console.error(`[turnstile] render() threw: ${detail}`);
				if (renderAttempt + 1 < MAX_RENDER_ATTEMPTS) {
					console.warn('[turnstile] render() failed; retrying once');
					renderAttempt += 1;
					renderWidget();
					return;
				}
				currentParams.onError?.('render-failed');
			}
		};

		const renderAfterLayout = () => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (cancelled || !window.turnstile) {
						return;
					}
					if (window.turnstile.ready) {
						window.turnstile.ready(runRender);
						return;
					}
					runRender();
				});
			});
		};

		renderAfterLayout();
	}

	function startLoadAndRender(loadAttempt = 0) {
		void loadTurnstileScript()
			.then(() => {
				if (!cancelled) {
					renderWidget();
				}
			})
			.catch(() => {
				if (cancelled) {
					return;
				}
				if (window.turnstile) {
					renderWidget();
					return;
				}
				if (loadAttempt + 1 < MAX_SCRIPT_LOAD_ATTEMPTS) {
					setTimeout(() => startLoadAndRender(loadAttempt + 1), SCRIPT_LOAD_RETRY_MS);
					return;
				}
				currentParams.onError?.('script-load-failed');
			});
	}

	startLoadAndRender();

	return {
		destroy() {
			cancelled = true;
			removeWidget();
		},
		rerender(nextParams: TurnstileMountCallbacks) {
			currentParams = nextParams;
			renderAttempt = 0;
			renderWidget();
		}
	};
}
