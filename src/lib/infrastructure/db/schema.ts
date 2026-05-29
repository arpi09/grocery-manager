import {
	pgTable,
	text,
	timestamp,
	numeric,
	date,
	index,
	boolean,
	integer,
	primaryKey
} from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
	petsEnabled: boolean('pets_enabled').notNull().default(false),
	themePreference: text('theme_preference', { enum: ['light', 'dark', 'system'] }).notNull().default('system'),
	activeHouseholdId: text('active_household_id').references(() => householdTable.id, {
		onDelete: 'set null'
	}),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const householdTable = pgTable('household', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const householdMemberTable = pgTable(
	'household_member',
	{
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		role: text('role', { enum: ['owner', 'editor', 'viewer'] }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.householdId, table.userId] }),
		index('household_member_user_idx').on(table.userId)
	]
);

export const householdInviteTable = pgTable(
	'household_invite',
	{
		id: text('id').primaryKey(),
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		role: text('role', { enum: ['editor', 'viewer'] }).notNull(),
		token: text('token').notNull().unique(),
		invitedByUserId: text('invited_by_user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		status: text('status', { enum: ['pending', 'accepted', 'revoked'] })
			.notNull()
			.default('pending'),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow()
	},
	(table) => [
		index('household_invite_household_idx').on(table.householdId),
		index('household_invite_token_idx').on(table.token)
	]
);

export const inventoryItemTable = pgTable(
	'inventory_items',
	{
		id: text('id').primaryKey(),
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		location: text('location', { enum: ['fridge', 'freezer', 'cupboard'] }).notNull(),
		quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
		unit: text('unit'),
		expiresOn: date('expires_on', { mode: 'string' }),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('inventory_household_location_idx').on(table.householdId, table.location),
		index('inventory_household_expires_idx').on(table.householdId, table.expiresOn)
	]
);

export const recipeIdeaTable = pgTable(
	'recipe_ideas',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		whyItFits: text('why_it_fits').notNull(),
		ingredientsToUse: text('ingredients_to_use').notNull(),
		missingIngredients: text('missing_ingredients').notNull(),
		steps: text('steps').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('recipe_ideas_user_created_idx').on(table.userId, table.createdAt)]
);

export const mealPlanTable = pgTable(
	'meal_plans',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		plannedDate: date('planned_date', { mode: 'string' }).notNull(),
		notes: text('notes'),
		ideaId: text('idea_id').references(() => recipeIdeaTable.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('meal_plans_user_date_idx').on(table.userId, table.plannedDate),
		index('meal_plans_user_updated_idx').on(table.userId, table.updatedAt)
	]
);

export const petTable = pgTable(
	'pets',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		species: text('species'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('pets_user_created_idx').on(table.userId, table.createdAt)]
);

export const appErrorTable = pgTable(
	'app_error',
	{
		id: text('id').primaryKey(),
		message: text('message').notNull(),
		stack: text('stack'),
		path: text('path').notNull(),
		userId: text('user_id'),
		statusCode: integer('status_code'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('app_error_created_at_idx').on(table.createdAt)]
);

export const petFoodTable = pgTable(
	'pet_food_items',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		petId: text('pet_id').references(() => petTable.id, { onDelete: 'set null' }),
		name: text('name').notNull(),
		quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
		unit: text('unit'),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('pet_food_user_updated_idx').on(table.userId, table.updatedAt),
		index('pet_food_user_pet_idx').on(table.userId, table.petId)
	]
);

export const shoppingListItemTable = pgTable('shopping_list_item', { id: text('id').primaryKey(), householdId: text('household_id').notNull().references(() => householdTable.id, { onDelete: 'cascade' }), name: text('name').notNull(), quantity: numeric('quantity', { precision: 10, scale: 2 }), unit: text('unit'), checked: boolean('checked').notNull().default(false), sortOrder: integer('sort_order').notNull().default(0), createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow() }, (table) => [index('shopping_list_household_sort_idx').on(table.householdId, table.sortOrder)]);

export const consumptionEventTable = pgTable(
	'consumption_event',
	{
		id: text('id').primaryKey(),
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		inventoryItemId: text('inventory_item_id').references(() => inventoryItemTable.id, {
			onDelete: 'set null'
		}),
		productName: text('product_name').notNull(),
		eventType: text('event_type', { enum: ['consumed', 'discarded', 'expired'] }).notNull(),
		quantity: numeric('quantity', { precision: 10, scale: 2 }),
		unit: text('unit'),
		location: text('location'),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('consumption_event_household_created_idx').on(table.householdId, table.createdAt)]
);
