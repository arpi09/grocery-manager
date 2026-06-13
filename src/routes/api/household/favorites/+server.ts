import { json } from '@sveltejs/kit';
import {
	InvalidHouseholdFavoriteError
} from '$lib/application/household-favorites.service';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { isHouseholdFavoritesEnabled } from '$lib/server/household-favorites-flag';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import type { RequestHandler } from './$types';

function favoritesDisabledResponse() {
	return json({ ok: false, error: 'Not found' }, { status: 404 });
}

function parseSaveBody(body: unknown): {
	barcode: string;
	displayName: string;
	quantity: string;
	unit: string | null;
	notes: string | null;
} | null {
	if (!body || typeof body !== 'object') {
		return null;
	}
	const record = body as Record<string, unknown>;
	const barcode = record.barcode;
	const displayName = record.displayName ?? record.name;
	if (typeof barcode !== 'string' || typeof displayName !== 'string') {
		return null;
	}
	const quantityRaw = record.quantity;
	const quantity = typeof quantityRaw === 'string' ? quantityRaw : '1';
	const unitRaw = record.unit;
	const unit =
		typeof unitRaw === 'string' && unitRaw.trim() ? unitRaw.trim() : unitRaw === null ? null : null;
	const notesRaw = record.notes;
	const notes =
		typeof notesRaw === 'string' && notesRaw.trim()
			? notesRaw.trim()
			: notesRaw === null
				? null
				: null;

	return { barcode, displayName, quantity, unit, notes };
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!isHouseholdFavoritesEnabled()) {
		return favoritesDisabledResponse();
	}

	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const favorites = await locals.householdFavoritesService.list(auth.householdId);
	return json({ ok: true, favorites });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isHouseholdFavoritesEnabled()) {
		return favoritesDisabledResponse();
	}

	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		requireInventoryWriteAccess(locals.householdRole);
	} catch {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	const parsed = parseSaveBody(await request.json().catch(() => null));
	if (!parsed) {
		return json({ ok: false, error: translate(locals.locale, 'favorites.invalidPayload') }, { status: 400 });
	}

	try {
		const favorite = await locals.householdFavoritesService.save(auth.householdId, parsed);
		return json({ ok: true, favorite });
	} catch (error) {
		if (error instanceof InvalidHouseholdFavoriteError) {
			return json({ ok: false, error: translate(locals.locale, 'favorites.invalidPayload') }, { status: 400 });
		}
		throw error;
	}
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
	if (!isHouseholdFavoritesEnabled()) {
		return favoritesDisabledResponse();
	}

	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		requireInventoryWriteAccess(locals.householdRole);
	} catch {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	const barcode = url.searchParams.get('barcode')?.trim() ?? '';
	if (!barcode) {
		return json({ ok: false, error: translate(locals.locale, 'favorites.invalidPayload') }, { status: 400 });
	}

	const deleted = await locals.householdFavoritesService.deleteByBarcode(auth.householdId, barcode);
	return json({ ok: true, deleted });
};
