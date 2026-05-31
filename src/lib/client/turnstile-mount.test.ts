import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createTurnstileMount,
	hasTurnstileWidgetContent,
	loadTurnstileScript,
	resetTurnstileScriptCacheForTests,
	TURNSTILE_SCRIPT_ID
} from './turnstile-mount';

function mockTurnstile() {
	const render = vi.fn().mockReturnValue('widget-1');
	const remove = vi.fn();
	const reset = vi.fn();
	const ready = vi.fn((callback: () => void) => callback());

	window.turnstile = { render, remove, reset, ready };

	return { render, remove, reset, ready };
}

async function flushTurnstileMount(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe('hasTurnstileWidgetContent', () => {
	it('detects iframe or hidden response input', () => {
		const node = document.createElement('div');
		expect(hasTurnstileWidgetContent(node)).toBe(false);

		const iframe = document.createElement('iframe');
		node.appendChild(iframe);
		expect(hasTurnstileWidgetContent(node)).toBe(true);
	});
});

describe('loadTurnstileScript', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		resetTurnstileScriptCacheForTests();
		delete window.turnstile;
	});

	afterEach(() => {
		resetTurnstileScriptCacheForTests();
		delete window.turnstile;
		vi.useRealTimers();
	});

	it('resolves when an existing script already loaded turnstile', async () => {
		const script = document.createElement('script');
		script.id = TURNSTILE_SCRIPT_ID;
		document.head.appendChild(script);
		mockTurnstile();

		await expect(loadTurnstileScript()).resolves.toBeUndefined();
	});

	it('polls until turnstile appears after a late script load', async () => {
		vi.useFakeTimers();
		const script = document.createElement('script');
		script.id = TURNSTILE_SCRIPT_ID;
		document.head.appendChild(script);

		const promise = loadTurnstileScript();
		await vi.advanceTimersByTimeAsync(50);
		mockTurnstile();
		await vi.advanceTimersByTimeAsync(100);

		await expect(promise).resolves.toBeUndefined();
	});
});

describe('createTurnstileMount', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		resetTurnstileScriptCacheForTests();
		delete window.turnstile;
		mockTurnstile();
	});

	afterEach(() => {
		resetTurnstileScriptCacheForTests();
		delete window.turnstile;
		vi.useRealTimers();
	});

	it('reports missing key without calling render', async () => {
		const node = document.createElement('div');
		const onError = vi.fn();
		const { render } = mockTurnstile();

		createTurnstileMount(node, { siteKey: '  ', onError });
		await flushTurnstileMount();

		expect(onError).toHaveBeenCalledWith('missing-key');
		expect(render).not.toHaveBeenCalled();
	});

	it('renders after turnstile.ready', async () => {
		const node = document.createElement('div');
		const { ready, render } = mockTurnstile();

		createTurnstileMount(node, { siteKey: 'site-key' });
		await flushTurnstileMount();

		expect(ready).toHaveBeenCalled();
		expect(render).toHaveBeenCalledWith(
			node,
			expect.objectContaining({ sitekey: 'site-key', size: 'flexible' })
		);
	});

	it('retries render once before timeout error', async () => {
		vi.useFakeTimers();
		const node = document.createElement('div');
		const onError = vi.fn();
		const { render } = mockTurnstile();

		createTurnstileMount(node, { siteKey: 'site-key', onError });
		await flushTurnstileMount();
		expect(render).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(15_000);
		expect(render).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(15_000);
		expect(onError).toHaveBeenCalledWith('timeout');
		expect(render).toHaveBeenCalledTimes(2);
	});

	it('clears timeout when widget content appears', async () => {
		vi.useFakeTimers();
		const node = document.createElement('div');
		const onError = vi.fn();

		createTurnstileMount(node, { siteKey: 'site-key', onError });
		await flushTurnstileMount();
		const iframe = document.createElement('iframe');
		node.appendChild(iframe);

		await vi.advanceTimersByTimeAsync(15_000);
		expect(onError).not.toHaveBeenCalled();
	});

	it('forwards widget error codes from error-callback', async () => {
		const node = document.createElement('div');
		const onError = vi.fn();
		const { render } = mockTurnstile();

		createTurnstileMount(node, { siteKey: 'site-key', onError });
		await flushTurnstileMount();
		const options = render.mock.calls[0]?.[1] as { 'error-callback'?: (code?: string) => void };
		options['error-callback']?.('110200');

		expect(onError).toHaveBeenCalledWith('110200');
	});
});
