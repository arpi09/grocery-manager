import { describe, expect, it } from 'vitest';
import { buildErrorAlertEmailContent } from './error-alert';
import type { AppErrorSummary } from './error-log';

function sampleError(overrides: Partial<AppErrorSummary> = {}): AppErrorSummary {
	return {
		id: 'err-1',
		message: 'process is not defined',
		path: 'CLIENT /guider/minska-matsvinn-hemma-app',
		userId: null,
		statusCode: 500,
		createdAt: new Date('2026-06-07T10:15:00.000Z'),
		hasStack: true,
		...overrides
	};
}

describe('buildErrorAlertEmailContent', () => {
	it('builds subject and body for multiple errors', () => {
		const content = buildErrorAlertEmailContent({
			errors: [sampleError(), sampleError({ id: 'err-2', message: 'Internal Error' })],
			adminUrl: 'https://skaffu.com/admin'
		});

		expect(content.subject).toContain('2 nya fel');
		expect(content.text).toContain('process is not defined');
		expect(content.text).toContain('https://skaffu.com/admin');
		expect(content.html).toContain('CLIENT /guider/minska-matsvinn-hemma-app');
		expect(content.html).toContain('Skaffu');
		expect(content.html).toContain('#2c4a3e');
	});

	it('uses singular subject for one error', () => {
		const content = buildErrorAlertEmailContent({
			errors: [sampleError()],
			adminUrl: 'https://skaffu.com/admin'
		});

		expect(content.subject).toContain('1 nytt fel');
	});
});
