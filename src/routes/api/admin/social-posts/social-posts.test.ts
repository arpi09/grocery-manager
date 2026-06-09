import { describe, expect, it } from 'vitest';
import { requireAdmin } from '$lib/server/api-guards';

describe('POST /api/admin/social-posts auth', () => {
	it('returns 401 when user is missing', async () => {
		const result = requireAdmin({ user: null, locale: 'en' } as App.Locals);
		expect(result.authorized).toBe(false);
		if (result.authorized) {
			throw new Error('expected unauthorized');
		}
		expect(result.response.status).toBe(401);
	});

	it('returns 403 when user is not admin', async () => {
		const result = requireAdmin({
			user: { id: 'u1', role: 'user' },
			locale: 'en'
		} as App.Locals);
		expect(result.authorized).toBe(false);
		if (result.authorized) {
			throw new Error('expected forbidden');
		}
		expect(result.response.status).toBe(403);
	});

	it('allows admin users', () => {
		const user = { id: 'admin-1', role: 'admin' } as App.Locals['user'];
		const result = requireAdmin({ user, locale: 'en' } as App.Locals);
		expect(result.authorized).toBe(true);
		if (!result.authorized) {
			throw new Error('expected authorized');
		}
		expect(result.user).toBe(user);
	});
});
