import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
	APP_SETTING_ERROR_ALERT_CURSOR,
	type ErrorAlertCursor
} from '$lib/domain/error-alert';
import type { AppErrorSummary } from '$lib/domain/error-log';
import { ErrorAlertService } from './error-alert.service';

function sampleError(): AppErrorSummary {
	return {
		id: 'e1',
		message: 'boom',
		path: 'GET /hem',
		userId: null,
		statusCode: 500,
		createdAt: new Date('2026-06-07T12:00:00.000Z'),
		hasStack: false
	};
}

describe('ErrorAlertService', () => {
	const listSummariesSince = vi.fn();
	const getJson = vi.fn();
	const setJson = vi.fn();
	const getErrorAlertTo = vi.fn();
	const sendOwnerErrorAlert = vi.fn();
	const getOrigin = vi.fn().mockReturnValue('https://skaffu.com');

	const service = new ErrorAlertService(
		{ listSummariesSince },
		{ getJson, setJson },
		{ getErrorAlertTo, sendOwnerErrorAlert },
		{ getOrigin }
	);

	beforeEach(() => {
		vi.clearAllMocks();
		getErrorAlertTo.mockReturnValue('owner@example.com');
	});

	it('skips when alert recipient is not configured', async () => {
		getErrorAlertTo.mockReturnValue(null);

		const result = await service.runAlertDigest();

		expect(result).toEqual({ sent: false, skipped: 'alert recipient not configured' });
		expect(listSummariesSince).not.toHaveBeenCalled();
	});

	it('skips email when no new errors', async () => {
		getJson.mockResolvedValue(null);
		listSummariesSince.mockResolvedValue([]);

		const result = await service.runAlertDigest();

		expect(result).toEqual({ sent: false, skipped: 'no new errors' });
		expect(sendOwnerErrorAlert).not.toHaveBeenCalled();
	});

	it('sends alert and updates cursor', async () => {
		const cursor: ErrorAlertCursor = { sentAt: '2026-06-07T11:00:00.000Z' };
		getJson.mockResolvedValue(cursor);
		listSummariesSince.mockResolvedValue([sampleError()]);
		sendOwnerErrorAlert.mockResolvedValue({ ok: true, id: 'email-1' });

		const result = await service.runAlertDigest();

		expect(result).toEqual({ sent: true, count: 1, emailId: 'email-1' });
		expect(sendOwnerErrorAlert).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'owner@example.com',
				subject: expect.stringContaining('1 nytt fel')
			})
		);
		expect(setJson).toHaveBeenCalledWith(APP_SETTING_ERROR_ALERT_CURSOR, {
			sentAt: '2026-06-07T12:00:00.000Z'
		});
	});
});
