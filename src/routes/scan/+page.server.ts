import { resolveReceiptLineLocation } from '$lib/domain/guess-storage-location';
import { canEditInventory } from '$lib/domain/household';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { isStorageLocation, type StorageLocation } from '$lib/domain/location';
import { guessShelfLife } from '$lib/domain/shelf-life';
import { coerceExpiresOn } from '$lib/server/photo-round-parse';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import { receiptLineToInventoryAmount } from '$lib/server/receipt-parse';
import { receiptLineToPurchaseRecord } from '$lib/server/receipt-import-purchase';
import { itemSchema } from '$lib/validation/inventory.schemas';
import { buildScanReturnUrl, type ScanToastKind } from '$lib/utils/scan-toast';
import { parseScanMode, parseScanReturnTo } from '$lib/utils/scan-nav';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { recordProductEvent } from '$lib/server/product-events';
import { trackInventoryWrite } from '$lib/server/sync-analytics';
import { generateId } from '$lib/infrastructure/auth/id';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;

	const locationParam = url.searchParams.get('location');
	const fromParam = url.searchParams.get('from');
	const modeParam = url.searchParams.get('mode');
	const needsSmartDefault = !modeParam;
	const scanMode = parseScanMode(modeParam);
	const defaultLocation =
		locationParam && isStorageLocation(locationParam) ? locationParam : null;
	const returnTo = parseScanReturnTo(fromParam);
	const isTopLevelEntry = !defaultLocation && returnTo === APP_HOME_PATH;

	return { defaultLocation, returnTo, canWrite, scanMode, needsSmartDefault, isTopLevelEntry };
};

function parseItemForm(formData: FormData) {
	const raw = Object.fromEntries(formData);
	return itemSchema.safeParse({
		...raw,
		unit: raw.unit || undefined,
		expiresOn: raw.expiresOn || undefined,
		notes: raw.notes || undefined
	});
}

async function bulkCreateFromForm(
	event: import('@sveltejs/kit').RequestEvent,
	formData: FormData,
	eventType: 'receipt_parsed' | 'photo_round_parsed',
	recordPurchases: boolean
) {
	requireInventoryWriteAccess(event.locals.householdRole);
	const returnToRaw = formData.get('returnTo');
	const returnTo = parseScanReturnTo(typeof returnToRaw === 'string' ? returnToRaw : null);

	const selected = formData
		.getAll('selected')
		.map((v) => Number(v))
		.filter((n) => !Number.isNaN(n));

	if (selected.length === 0) {
		error(400, 'Inga varor valda');
	}

	let created = 0;
	const importBatchId = recordPurchases ? generateId() : null;
	const purchaseLines: ReturnType<typeof receiptLineToPurchaseRecord>[] = [];
	const storeLabelRaw = formData.get('storeLabel');
	const purchasedAtRaw = formData.get('purchasedAt');
	const storeLabel =
		typeof storeLabelRaw === 'string' && storeLabelRaw.trim() ? storeLabelRaw.trim() : null;
	const purchasedAt = typeof purchasedAtRaw === 'string' ? purchasedAtRaw : null;

	for (const index of selected) {
		const name = formData.get(`name_${index}`);
		if (typeof name !== 'string' || !name.trim()) {
			continue;
		}
		const quantityRaw = formData.get(`quantity_${index}`);
		const unitRaw = formData.get(`unit_${index}`);
		const locationRaw = formData.get(`location_${index}`);
		const location: StorageLocation =
			typeof locationRaw === 'string' && isStorageLocation(locationRaw)
				? locationRaw
				: resolveReceiptLineLocation(name.trim(), locationRaw);

		const { quantity, unit } = receiptLineToInventoryAmount({
			name: name.trim(),
			quantity:
				typeof quantityRaw === 'string' && quantityRaw.trim() ? quantityRaw.trim() : undefined,
			unit: typeof unitRaw === 'string' && unitRaw.trim() ? unitRaw.trim() : undefined,
			location
		});

		const mergeIntoIdRaw = formData.get(`merge_${index}`);
		const mergeIntoId =
			typeof mergeIntoIdRaw === 'string' && mergeIntoIdRaw.trim() ? mergeIntoIdRaw.trim() : null;

		const expiresOnRaw = formData.get(`expiresOn_${index}`);
		let expiresOn =
			typeof expiresOnRaw === 'string' && expiresOnRaw.trim()
				? coerceExpiresOn(expiresOnRaw.trim())
				: null;
		let expiresOnSource: ExpiresOnSource | null = expiresOn ? 'user_set' : null;

		if (!expiresOn) {
			const inferred = guessShelfLife(name.trim(), location);
			if (inferred) {
				expiresOn = inferred.expiresOn;
				expiresOnSource = 'ai_inferred';
			}
		}

		const notesRaw = formData.get(`notes_${index}`);
		const notes =
			typeof notesRaw === 'string' && notesRaw.trim() ? notesRaw.trim() : null;

		await event.locals.inventoryService.createItem(
			event.locals.householdId!,
			event.locals.user!.id,
			{
				name: name.trim(),
				location,
				quantity,
				unit,
				expiresOn,
				expiresOnSource,
				notes,
				inferExpiry: false,
				mergeIntoId
			},
			event.locals.householdRole!
		);

		if (recordPurchases && importBatchId) {
			const unitPriceRaw = formData.get(`unitPrice_${index}`);
			const lineTotalRaw = formData.get(`lineTotal_${index}`);
			const currencyRaw = formData.get(`currency_${index}`);
			const line: ReceiptLine = {
				name: name.trim(),
				location,
				quantity:
					typeof quantityRaw === 'string' && quantityRaw.trim() ? quantityRaw.trim() : undefined,
				unit: typeof unitRaw === 'string' && unitRaw.trim() ? unitRaw.trim() : undefined,
				unitPrice:
					typeof unitPriceRaw === 'string' && unitPriceRaw.trim() ? unitPriceRaw.trim() : undefined,
				lineTotal:
					typeof lineTotalRaw === 'string' && lineTotalRaw.trim() ? lineTotalRaw.trim() : undefined,
				currency:
					typeof currencyRaw === 'string' && currencyRaw.trim() ? currencyRaw.trim() : undefined
			};
			purchaseLines.push(
				receiptLineToPurchaseRecord({
					householdId: event.locals.householdId!,
					userId: event.locals.user!.id,
					importBatchId,
					line,
					location,
					quantity,
					unit: unit ?? null,
					storeLabel,
					purchasedAt
				})
			);
		}
		created++;
	}

	if (created === 0) {
		error(400, 'Inga giltiga varor att spara');
	}

	if (recordPurchases && purchaseLines.length > 0) {
		await event.locals.purchasePatternService.recordReceiptImport(purchaseLines);
	}

	const label = `${created} varor`;
	trackInventoryWrite(event.locals.pmfService, {
		userId: event.locals.user!.id,
		householdId: event.locals.householdId,
		action: 'create'
	});
	recordProductEvent(event.locals.pmfService, {
		userId: event.locals.user!.id,
		householdId: event.locals.householdId,
		eventType,
		metadata: { itemsAdded: created, ...(eventType === 'photo_round_parsed' ? { stage: 'save' } : {}) }
	});

	redirect(
		302,
		recordPurchases ? buildReceiptImportReturnUrl() : buildScanReturnUrl(returnTo, 'added', label)
	);
}

function buildReceiptImportReturnUrl(): string {
	const params = new URLSearchParams({ from: 'receipt' });
	return `${APP_HOME_PATH}?${params}`;
}

export const actions: Actions = {
	create: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		const formData = await event.request.formData();
		const parsed = parseItemForm(formData);

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		const created = await event.locals.inventoryService.createItem(
			event.locals.householdId!,
			event.locals.user!.id,
			{
				name: parsed.data.name,
				location: parsed.data.location,
				quantity: parsed.data.quantity,
				unit: parsed.data.unit || null,
				expiresOn: parsed.data.expiresOn || null,
				notes: parsed.data.notes || null
			},
			event.locals.householdRole!
		);

		trackInventoryWrite(event.locals.pmfService, {
			userId: event.locals.user!.id,
			householdId: event.locals.householdId,
			action: 'create',
			itemId: created.id
		});

		const returnToRaw = formData.get('returnTo');
		const safeReturn = parseScanReturnTo(
			typeof returnToRaw === 'string' ? returnToRaw : null
		);
		const productFound = formData.get('productFound') === '1';

		const userId = event.locals.user!.id;
		const priorScanCount = await event.locals.pmfService.countUserScanEvents(userId);
		const isFirstScan = priorScanCount === 0;
		const createdAt = isFirstScan ? await event.locals.pmfService.getUserCreatedAt(userId) : null;
		const secondsSinceSignup =
			createdAt !== null
				? Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 1000))
				: undefined;

		recordProductEvent(event.locals.pmfService, {
			userId,
			householdId: event.locals.householdId,
			eventType: 'scan_completed',
			metadata: {
				source: 'barcode',
				productFound,
				...(isFirstScan && secondsSinceSignup !== undefined
					? { firstScan: true, secondsSinceSignup }
					: {})
			}
		});

		if (isFirstScan && secondsSinceSignup !== undefined) {
			recordProductEvent(event.locals.pmfService, {
				userId,
				householdId: event.locals.householdId,
				eventType: 'first_scan',
				metadata: { source: 'barcode', secondsSinceSignup, productFound }
			});
		}

		const toastKind: ScanToastKind = productFound ? 'added' : 'unknown';
		redirect(302, buildScanReturnUrl(safeReturn, toastKind, parsed.data.name));
	},
	bulkCreate: async (event) => {
		const formData = await event.request.formData();
		const bulkFlow = formData.get('bulkFlow');
		if (bulkFlow === 'photo') {
			await bulkCreateFromForm(event, formData, 'photo_round_parsed', false);
			return;
		}
		await bulkCreateFromForm(event, formData, 'receipt_parsed', true);
	}
};
