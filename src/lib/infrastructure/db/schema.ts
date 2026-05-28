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
		role: text('role', { enum: ['owner', 'member'] }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.householdId, table.userId] }),
		index('household_member_user_idx').on(table.userId)
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
