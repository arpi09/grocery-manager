import { describe, expect, it } from 'vitest';
import { isMissingLastConfirmedColumn } from './inventory-repository.shared';

describe('isMissingLastConfirmedColumn', () => {
	it('matches Postgres missing-column errors', () => {
		const error = new Error(
			'column "last_confirmed_at" of relation "inventory_items" does not exist'
		);
		expect(isMissingLastConfirmedColumn(error)).toBe(true);
	});

	it('does not match stale query failures that mention last_confirmed_at in SQL', () => {
		const error = new Error(
			'Failed query: select count(*)::int from "inventory_items" where last_confirmed_at < $3'
		);
		error.cause = new TypeError(
			'The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date'
		);
		expect(isMissingLastConfirmedColumn(error)).toBe(false);
	});
});
