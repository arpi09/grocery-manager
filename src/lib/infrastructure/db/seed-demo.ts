import { and, eq, inArray } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { hashPassword } from '$lib/infrastructure/auth/password';
import { getDb } from '$lib/infrastructure/db/init';
import {
	consumptionEventTable,
	householdMemberTable,
	householdTable,
	inventoryItemTable,
	mealPlanTable,
	shoppingListItemTable,
	userTable
} from '$lib/infrastructure/db/schema';

export const DEMO_USER_ID = 'user-demo-skaffu';
export const DEMO_HOUSEHOLD_ID = 'household-demo-skaffu';
const DEFAULT_DEMO_EMAIL = 'demo@skaffu.com';
const DEFAULT_DEMO_HOUSEHOLD_NAME = 'Demo — Villa Söder';
const DEFAULT_DEMO_DISPLAY_NAME = 'Demo Familjen';

type InventorySeed = {
	id: string;
	name: string;
	location: 'fridge' | 'freezer' | 'cupboard';
	quantity: string;
	unit?: string;
	expiresOn?: string;
	notes?: string;
};

type ShoppingSeed = {
	id: string;
	name: string;
	quantity?: string;
	unit?: string;
	checked?: boolean;
	sortOrder: number;
};

type MealSeed = {
	id: string;
	title: string;
	plannedDate: string;
	notes?: string;
};

function demoEmail(): string {
	const raw = env.DEMO_ACCOUNT_EMAIL?.trim() || DEFAULT_DEMO_EMAIL;
	return raw.toLowerCase();
}

function demoPassword(): string | null {
	const password = env.DEMO_ACCOUNT_PASSWORD?.trim();
	return password || null;
}

function isoDateFromToday(offsetDays: number): string {
	const d = new Date();
	d.setHours(12, 0, 0, 0);
	d.setDate(d.getDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

function buildInventoryItems(): InventorySeed[] {
	return [
		{
			id: 'demo-inv-kyckling',
			name: 'Grillad kyckling',
			location: 'fridge',
			quantity: '1',
			unit: 'förp',
			expiresOn: isoDateFromToday(1),
			notes: 'Öppnad igår — ät först'
		},
		{
			id: 'demo-inv-creme',
			name: 'Crème fraîche 15%',
			location: 'fridge',
			quantity: '2',
			unit: 'dl',
			expiresOn: isoDateFromToday(2)
		},
		{
			id: 'demo-inv-mjolk',
			name: 'Mjölk 3%',
			location: 'fridge',
			quantity: '1',
			unit: 'l',
			expiresOn: isoDateFromToday(4)
		},
		{
			id: 'demo-inv-pesto',
			name: 'Basilika pesto (öppnad)',
			location: 'fridge',
			quantity: '1',
			unit: 'burk',
			expiresOn: isoDateFromToday(5)
		},
		{
			id: 'demo-inv-agg',
			name: 'Ägg 12-pack',
			location: 'fridge',
			quantity: '8',
			unit: 'st',
			expiresOn: isoDateFromToday(12)
		},
		{
			id: 'demo-inv-smor',
			name: 'Smör normalsaltat',
			location: 'fridge',
			quantity: '1',
			unit: 'förp',
			expiresOn: isoDateFromToday(18)
		},
		{
			id: 'demo-inv-pasta',
			name: 'Pasta penne',
			location: 'cupboard',
			quantity: '2',
			unit: 'förp'
		},
		{
			id: 'demo-inv-ris',
			name: 'Basmatiris',
			location: 'cupboard',
			quantity: '1.5',
			unit: 'kg'
		},
		{
			id: 'demo-inv-tomater',
			name: 'Krossade tomater',
			location: 'cupboard',
			quantity: '4',
			unit: 'burk',
			expiresOn: isoDateFromToday(240)
		},
		{
			id: 'demo-inv-havre',
			name: 'Havregryn',
			location: 'cupboard',
			quantity: '1',
			unit: 'paket',
			expiresOn: isoDateFromToday(45)
		},
		{
			id: 'demo-inv-olja',
			name: 'Olivolja extra virgin',
			location: 'cupboard',
			quantity: '0.5',
			unit: 'l',
			expiresOn: isoDateFromToday(300)
		},
		{
			id: 'demo-inv-bär',
			name: 'Frysta blåbär',
			location: 'freezer',
			quantity: '1',
			unit: 'påse',
			expiresOn: isoDateFromToday(90)
		},
		{
			id: 'demo-inv-lasagne',
			name: 'Lasagne (hemlagad, fryst)',
			location: 'freezer',
			quantity: '2',
			unit: 'portioner',
			expiresOn: isoDateFromToday(25)
		},
		{
			id: 'demo-inv-falukorv',
			name: 'Falukorv',
			location: 'freezer',
			quantity: '1',
			unit: 'st',
			expiresOn: isoDateFromToday(6)
		},
		{
			id: 'demo-inv-brod',
			name: 'Surdegsbröd (fryst)',
			location: 'freezer',
			quantity: '1',
			unit: 'limpa',
			expiresOn: isoDateFromToday(3)
		}
	];
}

function buildShoppingItems(): ShoppingSeed[] {
	return [
		{ id: 'demo-shop-banan', name: 'Bananer', quantity: '6', unit: 'st', sortOrder: 0 },
		{ id: 'demo-shop-toa', name: 'Toalettpapper', quantity: '1', unit: 'förp', sortOrder: 1 },
		{
			id: 'demo-shop-kaffe',
			name: 'Kaffe mellanrost',
			quantity: '1',
			unit: 'påse',
			sortOrder: 2
		},
		{ id: 'demo-shop-morot', name: 'Morötter', quantity: '1', unit: 'kg', sortOrder: 3 },
		{
			id: 'demo-shop-dill',
			name: 'Dillfrön',
			quantity: '1',
			unit: 'påse',
			checked: true,
			sortOrder: 4
		}
	];
}

function buildMealPlans(): MealSeed[] {
	return [
		{
			id: 'demo-meal-gröt',
			title: 'Havregrynsgröt med blåbär',
			plannedDate: isoDateFromToday(0),
			notes: 'Använd frysta bär från frysen'
		},
		{
			id: 'demo-meal-pasta',
			title: 'Pasta med pesto & kyckling',
			plannedDate: isoDateFromToday(1),
			notes: 'Passa utgång på kyckling och pesto'
		},
		{
			id: 'demo-meal-wok',
			title: 'Wok med ris och morötter',
			plannedDate: isoDateFromToday(2),
			notes: 'Köp morötter — finns på inköpslistan'
		},
		{
			id: 'demo-meal-lasagne',
			title: 'Lasagne från frysen',
			plannedDate: isoDateFromToday(4)
		}
	];
}

async function ensureDemoUser(): Promise<string> {
	const email = demoEmail();
	const password = demoPassword();
	const db = getDb();

	const [existing] = await db
		.select({ id: userTable.id })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);

	if (existing) {
		const updates: Partial<typeof userTable.$inferInsert> = {
			isDemo: true,
			displayName: DEFAULT_DEMO_DISPLAY_NAME
		};
		if (password) {
			updates.passwordHash = await hashPassword(password);
		}
		await db.update(userTable).set(updates).where(eq(userTable.id, existing.id));
		return existing.id;
	}

	if (!password) {
		throw new Error(
			'[seed-demo] DEMO_ACCOUNT_PASSWORD is required to create the demo account. Set it in .env or hosting secrets.'
		);
	}

	await db.insert(userTable).values({
		id: DEMO_USER_ID,
		email,
		passwordHash: await hashPassword(password),
		displayName: DEFAULT_DEMO_DISPLAY_NAME,
		role: 'user',
		petsEnabled: false,
		isDemo: true
	});
	return DEMO_USER_ID;
}

async function ensureDemoHousehold(userId: string): Promise<void> {
	const db = getDb();

	const [existing] = await db
		.select({ id: householdTable.id })
		.from(householdTable)
		.where(eq(householdTable.id, DEMO_HOUSEHOLD_ID))
		.limit(1);

	if (!existing) {
		await db.insert(householdTable).values({
			id: DEMO_HOUSEHOLD_ID,
			name: DEFAULT_DEMO_HOUSEHOLD_NAME
		});
	} else {
		await db
			.update(householdTable)
			.set({ name: DEFAULT_DEMO_HOUSEHOLD_NAME })
			.where(eq(householdTable.id, DEMO_HOUSEHOLD_ID));
	}

	await db
		.insert(householdMemberTable)
		.values({
			householdId: DEMO_HOUSEHOLD_ID,
			userId,
			role: 'owner'
		})
		.onConflictDoNothing();

	await db
		.update(userTable)
		.set({ activeHouseholdId: DEMO_HOUSEHOLD_ID })
		.where(eq(userTable.id, userId));
}

async function clearDemoContent(userId: string): Promise<void> {
	const db = getDb();
	const inventoryIds = buildInventoryItems().map((i) => i.id);
	const shoppingIds = buildShoppingItems().map((i) => i.id);
	const mealIds = buildMealPlans().map((m) => m.id);

	if (inventoryIds.length > 0) {
		await db
			.delete(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, DEMO_HOUSEHOLD_ID),
					inArray(inventoryItemTable.id, inventoryIds)
				)
			);
	}

	if (shoppingIds.length > 0) {
		await db
			.delete(shoppingListItemTable)
			.where(
				and(
					eq(shoppingListItemTable.householdId, DEMO_HOUSEHOLD_ID),
					inArray(shoppingListItemTable.id, shoppingIds)
				)
			);
	}

	await db.delete(mealPlanTable).where(and(eq(mealPlanTable.userId, userId), inArray(mealPlanTable.id, mealIds)));

	await db
		.delete(consumptionEventTable)
		.where(eq(consumptionEventTable.householdId, DEMO_HOUSEHOLD_ID));
}

async function insertDemoContent(userId: string): Promise<void> {
	const db = getDb();
	const now = new Date();

	await db.insert(inventoryItemTable).values(
		buildInventoryItems().map((item) => ({
			id: item.id,
			householdId: DEMO_HOUSEHOLD_ID,
			userId,
			name: item.name,
			location: item.location,
			quantity: item.quantity,
			unit: item.unit ?? null,
			expiresOn: item.expiresOn ?? null,
			notes: item.notes ?? null,
			createdAt: now,
			updatedAt: now
		}))
	);

	await db.insert(shoppingListItemTable).values(
		buildShoppingItems().map((item) => ({
			id: item.id,
			householdId: DEMO_HOUSEHOLD_ID,
			name: item.name,
			quantity: item.quantity ?? null,
			unit: item.unit ?? null,
			checked: item.checked ?? false,
			sortOrder: item.sortOrder,
			createdAt: now,
			updatedAt: now
		}))
	);

	await db.insert(mealPlanTable).values(
		buildMealPlans().map((meal) => ({
			id: meal.id,
			userId,
			title: meal.title,
			plannedDate: meal.plannedDate,
			notes: meal.notes ?? null,
			createdAt: now,
			updatedAt: now
		}))
	);
}

/**
 * Idempotent demo account + realistic Swedish household data for sales demos.
 * Re-running resets demo inventory, shopping list, and meal plans to the canonical set.
 */
export async function seedDemoAccount(): Promise<{ userId: string; email: string }> {
	const userId = await ensureDemoUser();
	await ensureDemoHousehold(userId);
	await clearDemoContent(userId);
	await insertDemoContent(userId);

	const email = demoEmail();
	console.info(`[seed-demo] Demo account ready: ${email} (household ${DEMO_HOUSEHOLD_ID})`);
	return { userId, email };
}
