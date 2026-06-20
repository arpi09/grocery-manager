import { requireUser } from '$lib/server/api-guards';
import {
	storeReceiptSharePending,
	validateReceiptShareFile
} from '$lib/server/receipt-share-pending';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function firstShareFile(formData: FormData): File | null {
	for (const value of formData.values()) {
		if (value instanceof File && value.size > 0) {
			return value;
		}
	}
	return null;
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.user) {
		const loginRedirect = `/scan?mode=receipt&source=share_target`;
		redirect(303, `/login?redirect=${encodeURIComponent(loginRedirect)}`);
	}

	const auth = requireUser(locals);
	if (!auth.authorized) {
		redirect(303, `/login?redirect=${encodeURIComponent('/scan?mode=receipt&source=share_target')}`);
	}

	const formData = await request.formData();
	const file = firstShareFile(formData);
	if (!file) {
		redirect(303, '/scan?mode=receipt&source=share_target&shareError=no_file');
	}

	const bytes = new Uint8Array(await file.arrayBuffer());
	const validation = validateReceiptShareFile(file, bytes);
	if (!validation.ok) {
		const errorCode = validation.status === 413 ? 'too_large' : 'unsupported';
		redirect(303, `/scan?mode=receipt&source=share_target&shareError=${errorCode}`);
	}

	const shareKey = storeReceiptSharePending({
		userId: auth.user.id,
		fileName: file.name || 'receipt',
		mimeType: validation.mimeType,
		bytes
	});

	const target = new URL('/scan', url.origin);
	target.searchParams.set('mode', 'receipt');
	target.searchParams.set('source', 'share_target');
	target.searchParams.set('shareKey', shareKey);
	redirect(303, `${target.pathname}${target.search}`);
};
