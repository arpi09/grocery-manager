import {
	pgTable,
	text,
	timestamp,
	numeric,
	date,
	index,
	boolean,
	integer,
	primaryKey,
	uniqueIndex,
	jsonb
} from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	mustResetPassword: boolean('must_reset_password').notNull().default(false),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
	petsEnabled: boolean('pets_enabled').notNull().default(false),
	expiryRemindersEnabled: boolean('expiry_reminders_enabled').notNull().default(false),
	expiryReminderDays: integer('expiry_reminder_days').notNull().default(7),
	expiryReminderLastSentAt: timestamp('expiry_reminder_last_sent_at', {
		withTimezone: true,
		mode: 'date'
	}),
	pushNotificationsEnabled: boolean('push_notifications_enabled').notNull().default(false),
	nearbySharingEnabled: boolean('nearby_sharing_enabled').notNull().default(false),
	nearbySharingLat: numeric('nearby_sharing_lat', { precision: 9, scale: 6 }),
	nearbySharingLng: numeric('nearby_sharing_lng', { precision: 9, scale: 6 }),
	nearbySharingUpdatedAt: timestamp('nearby_sharing_updated_at', {
		withTimezone: true,
		mode: 'date'
	}),
	shoppingPushEnabled: boolean('shopping_push_enabled').notNull().default(false),
	shoppingPushLastSentAt: timestamp('shopping_push_last_sent_at', {
		withTimezone: true,
		mode: 'date'
	}),
	nearbyPushEnabled: boolean('nearby_push_enabled').notNull().default(false),
	nearbyPushLastSentAt: timestamp('nearby_push_last_sent_at', {
		withTimezone: true,
		mode: 'date'
	}),
	themePreference: text('theme_preference', { enum: ['light', 'dark', 'system'] }).notNull().default('system'),
	shoppingToPantryMode: text('shopping_to_pantry_mode', {
		enum: ['always', 'ask', 'never']
	})
		.notNull()
		.default('ask'),
	activeHouseholdId: text('active_household_id').references(() => householdTable.id, {
		onDelete: 'set null'
	}),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }),
	signupUtmSource: text('signup_utm_source'),
	signupUtmMedium: text('signup_utm_medium'),
	signupUtmCampaign: text('signup_utm_campaign'),
	signupUtmContent: text('signup_utm_content'),
	isDemo: boolean('is_demo').notNull().default(false),
	emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true, mode: 'date' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const oauthAccountTable = pgTable(
	'oauth_account',
	{
		providerId: text('provider_id').notNull(),
		providerUserId: text('provider_user_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' })
	},
	(table) => [
		primaryKey({ columns: [table.providerId, table.providerUserId] }),
		index('oauth_account_user_idx').on(table.userId)
	]
);

export const emailVerificationTokenTable = pgTable(
	'email_verification_token',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('email_verification_token_user_idx').on(table.userId),
		index('email_verification_token_hash_idx').on(table.tokenHash)
	]
);

export const passwordResetTokenTable = pgTable(
	'password_reset_token',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('password_reset_token_user_idx').on(table.userId),
		index('password_reset_token_hash_idx').on(table.tokenHash)
	]
);

export const adminActionLogTable = pgTable(
	'admin_action_log',
	{
		id: text('id').primaryKey(),
		actorUserId: text('actor_user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		action: text('action').notNull(),
		targetUserId: text('target_user_id').references(() => userTable.id, { onDelete: 'set null' }),
		metadata: text('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('admin_action_log_created_idx').on(table.createdAt)]
);

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
	autoExpiredGraceDays: integer('auto_expired_grace_days').notNull().default(7),
	planTier: text('plan_tier', { enum: ['free', 'pro'] }).notNull().default('free'),
	stripeCustomerId: text('stripe_customer_id'),
	stripeSubscriptionId: text('stripe_subscription_id'),
	stripeSubscriptionStatus: text('stripe_subscription_status'),
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
		expiresOnSource: text('expires_on_source', {
			enum: ['user_set', 'ai_inferred', 'default_heuristic']
		}),
		notes: text('notes'),
		lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('inventory_household_location_idx').on(table.householdId, table.location),
		index('inventory_household_expires_idx').on(table.householdId, table.expiresOn),
		index('inventory_household_last_confirmed_idx').on(table.householdId, table.lastConfirmedAt)
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

export const productEventTable = pgTable(
	'product_event',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
		householdId: text('household_id').references(() => householdTable.id, {
			onDelete: 'set null'
		}),
		eventType: text('event_type', {
			enum: [
				'scan_completed',
				'receipt_import_started',
				'receipt_uploaded',
				'receipt_parsed',
				'receipt_review_completed',
				'photo_round_parsed',
				'fill_suggestions_added',
				'landing_view',
				'guide_view',
				'register_click',
				'signup_complete',
				'signup_from_shopping_share',
				'signup_from_expiring_share',
				'onboarding_skipped',
				'onboarding_quickstart',
				'onboarding_completed',
				'first_scan',
				'pwa_banner_dismiss',
				'pwa_banner_install_click',
				'receipt_autopilot_accepted',
				'weekly_ritual_approved',
				'eat_first_week_viewed',
				'eat_first_plan_applied',
				'milestone_achieved',
				'celebration_shown',
				'streak_milestone_reached',
				'public_report_viewed',
				'expiring_share_created',
				'expiring_share_viewed',
				'expiring_share_cta_clicked',
				'shopping_list_share_created',
				'shopping_list_share_viewed',
				'shopping_list_share_cta_clicked',
				'public_city_feed_viewed',
				'public_city_feed_item_clicked',
				'public_city_feed_signup_clicked',
				'household_invite_prompt_shown',
				'household_invite_prompt_clicked',
				'household_invite_prompt_dismissed',
				'household_invite_created',
				'household_invite_accepted',
				'shopping_list_share_clicked',
				'replenishment_fold_opened',
				'nearby_map_opened',
				'nearby_share_tapped',
				'expiring_share_reported',
				'wrapped_viewed',
				'wrapped_shared',
				'kivra_forward_received',
				'shopping_list_export',
				'barcode_override_used',
				'inventory_write',
				'batch_review_completed',
				'one_tap_consume',
				'staleness_confirmed',
				'shopping_checkoff_to_pantry',
				'receipt_finish_accepted',
				'price_memory_viewed',
				'replenishment_suggestion_shown',
				'replenishment_suggestion_clicked',
				'replenishment_suggestion_added',
				'replenishment_suggestion_accepted',
				'replenishment_suggestion_dismissed',
				'pantry_health_insight_shown',
				'pantry_health_insight_clicked',
				'waste_alert_shown',
				'waste_alert_clicked',
				'waste_alert_resolved',
				'home_briefing_viewed',
				'replenishment_actioned',
				'waste_alert_actioned',
				'duplicate_warning_shown',
				'duplicate_warning_dismissed',
				'receipt_loop_cta_shown',
				'receipt_loop_cta_clicked'
			]
		}).notNull(),
		metadata: text('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('product_event_user_created_idx').on(table.userId, table.createdAt),
		index('product_event_type_created_idx').on(table.eventType, table.createdAt),
		index('product_event_household_created_idx').on(table.householdId, table.createdAt)
	]
);

export const pmfSurveyResponseTable = pgTable(
	'pmf_survey_response',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		householdId: text('household_id').references(() => householdTable.id, {
			onDelete: 'set null'
		}),
		trigger: text('trigger', { enum: ['post_onboarding', 'periodic'] }).notNull(),
		npsScore: integer('nps_score').notNull(),
		wouldMiss: text('would_miss', { enum: ['yes', 'somewhat', 'no'] }).notNull(),
		comment: text('comment'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('pmf_survey_response_created_idx').on(table.createdAt),
		index('pmf_survey_response_user_created_idx').on(table.userId, table.createdAt)
	]
);

export const productFeedbackTable = pgTable(
	'product_feedback',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		householdId: text('household_id').references(() => householdTable.id, {
			onDelete: 'set null'
		}),
		source: text('source', { enum: ['settings', 'post_onboarding'] }).notNull(),
		churnReason: text('churn_reason', {
			enum: [
				'forgot_habit',
				'too_much_work',
				'missing_feature',
				'privacy_trust',
				'other_app',
				'notifications',
				'other'
			]
		}),
		message: text('message').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('product_feedback_created_idx').on(table.createdAt),
		index('product_feedback_user_created_idx').on(table.userId, table.createdAt)
	]
);

export const aiUsageTable = pgTable(
	'ai_usage',
	{
		id: text('id').primaryKey(),
		scopeId: text('scope_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		kind: text('kind', { enum: ['ai_scan', 'receipt_pdf', 'smart_fill', 'admin_insights'] }).notNull(),
		periodKey: text('period_key').notNull(),
		count: integer('count').notNull().default(1),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow()
	},
	(table) => [
		uniqueIndex('ai_usage_scope_kind_period_idx').on(table.scopeId, table.kind, table.periodKey),
		index('ai_usage_user_updated_idx').on(table.userId, table.updatedAt)
	]
);

export const waitlistEmailTable = pgTable(
	'waitlist_email',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull(),
		userId: text('user_id').references(() => userTable.id, { onDelete: 'set null' }),
		source: text('source', { enum: ['priser', 'settings'] }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('waitlist_email_email_idx').on(table.email),
		index('waitlist_email_created_idx').on(table.createdAt)
	]
);

export const pushSubscriptionTable = pgTable(
	'push_subscription',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		endpoint: text('endpoint').notNull(),
		p256dh: text('p256dh').notNull(),
		auth: text('auth').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('push_subscription_endpoint_idx').on(table.endpoint),
		index('push_subscription_user_idx').on(table.userId)
	]
);

export const appSettingsTable = pgTable('app_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const receiptPurchaseLineTable = pgTable(
	'receipt_purchase_line',
	{
		id: text('id').primaryKey(),
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		importBatchId: text('import_batch_id').notNull(),
		productName: text('product_name').notNull(),
		normalizedKey: text('normalized_key').notNull(),
		barcode: text('barcode'),
		location: text('location', { enum: ['fridge', 'freezer', 'cupboard'] }).notNull(),
		quantity: numeric('quantity', { precision: 10, scale: 2 }),
		unit: text('unit'),
		unitPrice: numeric('unit_price', { precision: 10, scale: 2 }),
		currency: text('currency').default('SEK'),
		lineTotal: numeric('line_total', { precision: 10, scale: 2 }),
		storeLabel: text('store_label'),
		purchasedAt: timestamp('purchased_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('receipt_purchase_line_household_key_idx').on(table.householdId, table.normalizedKey),
		index('receipt_purchase_line_household_created_idx').on(table.householdId, table.createdAt),
		index('receipt_purchase_line_household_key_purchased_idx').on(
			table.householdId,
			table.normalizedKey,
			table.purchasedAt
		)
	]
);

export const receiptPatternDismissalTable = pgTable(
	'receipt_pattern_dismissal',
	{
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		normalizedKey: text('normalized_key').notNull(),
		dismissedAt: timestamp('dismissed_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow()
	},
	(table) => [primaryKey({ columns: [table.householdId, table.normalizedKey] })]
);

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

export const householdReceiptForwardTokenTable = pgTable(
	'household_receipt_forward_token',
	{
		id: text('id').primaryKey(),
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		rotatedAt: timestamp('rotated_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [
		index('household_receipt_forward_token_household_idx').on(table.householdId),
		index('household_receipt_forward_token_hash_idx').on(table.tokenHash)
	]
);

export const shoppingListShareLinkTable = pgTable(
	'shopping_list_share_link',
	{
		id: text('id').primaryKey(),
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		createdByUserId: text('created_by_user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		snapshotJson: text('snapshot_json').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [
		index('shopping_list_share_link_token_hash_idx').on(table.tokenHash),
		index('shopping_list_share_link_household_idx').on(table.householdId)
	]
);

export const expiringShareLinkTable = pgTable(
	'expiring_share_link',
	{
		id: text('id').primaryKey(),
		householdId: text('household_id')
			.notNull()
			.references(() => householdTable.id, { onDelete: 'cascade' }),
		createdByUserId: text('created_by_user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		snapshotJson: text('snapshot_json').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		latitude: numeric('latitude', { precision: 9, scale: 6 }),
		longitude: numeric('longitude', { precision: 9, scale: 6 }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('expiring_share_link_token_hash_idx').on(table.tokenHash),
		index('expiring_share_link_household_idx').on(table.householdId),
		index('expiring_share_link_geo_idx').on(table.latitude, table.longitude)
	]
);

export const expiringShareReportTable = pgTable(
	'expiring_share_report',
	{
		id: text('id').primaryKey(),
		shareId: text('share_id')
			.notNull()
			.references(() => expiringShareLinkTable.id, { onDelete: 'cascade' }),
		reporterUserId: text('reporter_user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		reason: text('reason'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('expiring_share_report_share_idx').on(table.shareId),
		index('expiring_share_report_reporter_idx').on(table.reporterUserId)
	]
);

export const expiringShareBlockTable = pgTable(
	'expiring_share_block',
	{
		id: text('id').primaryKey(),
		reporterUserId: text('reporter_user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		shareId: text('share_id').references(() => expiringShareLinkTable.id, { onDelete: 'cascade' }),
		householdId: text('household_id').references(() => householdTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('expiring_share_block_reporter_idx').on(table.reporterUserId)
	]
);

export const analyticsSessionTable = pgTable(
	'analytics_session',
	{
		id: text('id').primaryKey(),
		visitorId: text('visitor_id').notNull(),
		userId: text('user_id').references(() => userTable.id, { onDelete: 'set null' }),
		householdId: text('household_id').references(() => householdTable.id, {
			onDelete: 'set null'
		}),
		startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		userAgentHash: text('user_agent_hash')
	},
	(table) => [
		index('analytics_session_visitor_last_seen_idx').on(table.visitorId, table.lastSeenAt),
		index('analytics_session_started_idx').on(table.startedAt)
	]
);

export const analyticsPageViewTable = pgTable(
	'analytics_page_view',
	{
		id: text('id').primaryKey(),
		sessionId: text('session_id')
			.notNull()
			.references(() => analyticsSessionTable.id, { onDelete: 'cascade' }),
		route: text('route').notNull(),
		enteredAt: timestamp('entered_at', { withTimezone: true, mode: 'date' }).notNull(),
		exitedAt: timestamp('exited_at', { withTimezone: true, mode: 'date' }),
		durationMs: integer('duration_ms'),
		referrerRoute: text('referrer_route')
	},
	(table) => [
		index('analytics_page_view_route_entered_idx').on(table.route, table.enteredAt),
		index('analytics_page_view_session_idx').on(table.sessionId, table.enteredAt)
	]
);

export const analyticsInteractionTable = pgTable(
	'analytics_interaction',
	{
		id: text('id').primaryKey(),
		sessionId: text('session_id')
			.notNull()
			.references(() => analyticsSessionTable.id, { onDelete: 'cascade' }),
		route: text('route').notNull(),
		elementKey: text('element_key').notNull(),
		kind: text('kind', { enum: ['click', 'scroll_depth'] }).notNull(),
		value: integer('value'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('analytics_interaction_route_element_idx').on(
			table.route,
			table.elementKey,
			table.createdAt
		),
		index('analytics_interaction_created_idx').on(table.createdAt)
	]
);

export const analyticsRouteDailyTable = pgTable(
	'analytics_route_daily',
	{
		day: date('day').notNull(),
		route: text('route').notNull(),
		viewCount: integer('view_count').notNull().default(0),
		uniqueSessions: integer('unique_sessions').notNull().default(0),
		avgDurationMs: integer('avg_duration_ms').notNull().default(0)
	},
	(table) => [primaryKey({ columns: [table.day, table.route] })]
);

export const analyticsElementDailyTable = pgTable(
	'analytics_element_daily',
	{
		day: date('day').notNull(),
		route: text('route').notNull(),
		elementKey: text('element_key').notNull(),
		clickCount: integer('click_count').notNull().default(0)
	},
	(table) => [primaryKey({ columns: [table.day, table.route, table.elementKey] })]
);

export const socialPostTable = pgTable(
	'social_post',
	{
		id: text('id').primaryKey(),
		channel: text('channel', { enum: ['linkedin'] }).notNull().default('linkedin'),
		status: text('status', { enum: ['draft', 'approved', 'published', 'failed'] })
			.notNull()
			.default('draft'),
		title: text('title'),
		body: text('body').notNull(),
		linkUrl: text('link_url'),
		utmSource: text('utm_source'),
		utmMedium: text('utm_medium'),
		utmCampaign: text('utm_campaign'),
		utmContent: text('utm_content'),
		imagePath: text('image_path'),
		source: text('source', { enum: ['agent', 'manual', 'automation'] })
			.notNull()
			.default('manual'),
		approvedBy: text('approved_by').references(() => userTable.id, { onDelete: 'set null' }),
		approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }),
		publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
		externalId: text('external_id'),
		publishError: text('publish_error'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('social_post_status_created_idx').on(table.status, table.createdAt)]
);

export const guideArticleTable = pgTable(
	'guide_article',
	{
		id: text('id').primaryKey(),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		description: text('description').notNull(),
		body: text('body').notNull(),
		keywords: jsonb('keywords').$type<string[]>().notNull().default([]),
		articleDate: text('article_date').notNull(),
		status: text('status', { enum: ['draft', 'approved', 'published'] })
			.notNull()
			.default('draft'),
		source: text('source', { enum: ['agent', 'manual'] }).notNull().default('manual'),
		socialPostId: text('social_post_id').references(() => socialPostTable.id, {
			onDelete: 'set null'
		}),
		qualityWarnings: jsonb('quality_warnings').$type<string[]>(),
		approvedBy: text('approved_by').references(() => userTable.id, { onDelete: 'set null' }),
		approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }),
		publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('guide_article_status_created_idx').on(table.status, table.createdAt),
		index('guide_article_slug_idx').on(table.slug)
	]
);
