interface TurnstileRenderOptions {
	sitekey: string;
	theme?: 'light' | 'dark' | 'auto';
	size?: 'normal' | 'compact' | 'flexible';
	callback?: (token: string) => void;
	'expired-callback'?: () => void;
	'error-callback'?: (errorCode?: string) => void;
}

interface TurnstileInstance {
	render(container: HTMLElement, options: TurnstileRenderOptions): string;
	remove(widgetId: string): void;
	reset(widgetId: string): void;
}

interface Window {
	turnstile?: TurnstileInstance;
}
