import { Buffer } from 'node:buffer';
import { requireUser } from '$lib/server/api-guards';
import { takeReceiptSharePending } from '$lib/server/receipt-share-pending';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const key = url.searchParams.get('key')?.trim();
	if (!key) {
		return json({ error: 'missing_key' }, { status: 400 });
	}

	const entry = takeReceiptSharePending(key, auth.user.id);
	if (!entry) {
		return json({ error: 'not_found' }, { status: 404 });
	}

	return new Response(Buffer.from(entry.bytes) as unknown as BodyInit, {
		status: 200,
		headers: {
			'Content-Type': entry.mimeType,
			'Content-Disposition': `inline; filename="${entry.fileName.replace(/"/g, '')}"`,
			'Cache-Control': 'no-store'
		}
	});
};
