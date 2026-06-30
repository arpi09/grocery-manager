import { trackProductEvent } from '$lib/client/product-events';
import { capacitorTelemetrySource } from '$lib/utils/capacitor';

const SESSION_KEY = 'skaffu_capacitor_app_opened';

/** Once per browser session when running in Capacitor native shell. */
export function trackCapacitorAppOpened(): void {
	const source = capacitorTelemetrySource();
	if (!source) {
		return;
	}
	if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
		return;
	}
	if (typeof sessionStorage !== 'undefined') {
		sessionStorage.setItem(SESSION_KEY, '1');
	}
	void trackProductEvent('capacitor_app_opened', { source });
}
