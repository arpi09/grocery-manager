import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '$lib/infrastructure/db/schema';
import { DEFAULT_HOUSEHOLD_ID } from '$lib/infrastructure/db/seed-household';

export interface IntegrationDbContext {
	client: PGlite;
	db: ReturnType<typeof drizzle<typeof schema>>;
	reset(): Promise<void>;
	seedUser(user: { id: string; email?: string }): Promise<void>;
	seedHousehold(household: {
		id?: string;
		name?: string;
		members: Array<{ userId: string; role: 'owner' | 'editor' | 'viewer' | 'member' }>;
	}): Promise<string>;
	close(): Promise<void>;
}

const SQL_MIGRATION_FILES = [
	'0000_init.sql',
	'0001_user_role.sql',
	'0002_user_last_seen.sql',
	'0003_household.sql',
	'0004_user_profile.sql',
	'0005_app_error.sql',
	'0006_user_theme_preference.sql',
	'0007_household_invites_roles.sql',
	'0008_shopping_list.sql',
'0010_active_household.sql',
	'0011_consumption_event.sql',
	'0012_product_event.sql',
	'0013_expiry_reminders.sql',
	'0014_product_feedback.sql',
	'0015_ai_usage.sql',
	'0016_waitlist_email.sql',
	'0017_push_subscriptions.sql',
	'0018_user_signup_utm.sql',
	'0019_app_settings.sql',
	'0020_product_event_anonymous.sql',
	'0021_shopping_push.sql',
	'0022_user_is_demo.sql',
	'0023_auth_password_reset_oauth.sql',
	'0024_auto_expired_grace.sql',
	'0025_receipt_purchase_pattern.sql',
	'0026_household_stripe.sql',
	'0027_email_verification.sql',
	'0028_backfill_email_verified_at.sql',
	'0029_pmf_survey_response.sql',
	'0030_expiring_share_link.sql',
	'0031_household_receipt_forward_token.sql',
	'0032_analytics_behavior.sql',
	'0033_shopping_to_pantry_mode.sql',
	'0034_inventory_last_confirmed_at.sql',
	'0035_staleness_reminders.sql',
	'0036_social_post.sql',
	'0037_guide_article.sql',
	'0038_nearby_expiring_share.sql',
	'0039_expiring_share_report_block.sql',
	'0040_nearby_push.sql',
	'0041_receipt_import_funnel_events.sql',
	'0042_acquisition_wedge_events.sql',
	'0043_shopping_list_share_link.sql',
	'0044_receipt_price_memory.sql',
	'0045_inventory_intelligence_events.sql',
	'0046_household_os_events.sql',
	'0047_learning_engine_v1.sql',
	'0048_household_location_rule.sql',
	'0049_receipt_import_success_events.sql',
	'0050_brain_feedback_v1.sql',
	'0051_price_memory_phase1.sql',
	'0052_home_redesign_telemetry.sql',
	'0053_memory_rule_events.sql',
	'0054_shopping_ux_v2_telemetry.sql',
	'0055_pantry_ux_v2_telemetry.sql',
	'0056_home_ux_v2_telemetry.sql',
	'0057_product_catalog.sql',
	'0058_moment_cta_telemetry.sql',
	'0059_store_recommendation_telemetry.sql',
	'0060_acquisition_loops_telemetry.sql',
	'0061_price_intelligence_phase1.sql',
	'0063_ata_page_telemetry.sql',
	'0064_market_v01.sql',
	'0065_market_live.sql',
	'0066_market_chat_report.sql',
	'0067_market_v02_exchange.sql',
	'0068_market_v03_trust.sql',
	'0069_market_v04_pricing.sql',
	'0070_brain_v2.sql',
	'0071_brain_proactive_push.sql'
];
const SQL_TRUNCATE_ALL = `
TRUNCATE TABLE
	"session",
	"push_subscription",
	"waitlist_email",
	"ai_usage",
	"pmf_survey_response",
	"product_feedback",
	"product_event",
	"market_exchange_rating",
	"market_chat_message",
	"market_chat_report",
	"market_chat_thread",
	"expiring_share_block",
	"expiring_share_report",
	"expiring_share_link",
	"shopping_list_share_link",
	"household_receipt_forward_token",
	"analytics_interaction",
	"analytics_page_view",
	"analytics_route_daily",
	"analytics_element_daily",
	"analytics_session",
	"consumption_event",
	"receipt_pattern_dismissal",
	"receipt_purchase_line",
	"household_shelf_life_rule",
	"household_location_rule",
	"learning_feedback",
	"shopping_list_item",
	"product_catalog",
	"inventory_items",
	"meal_plans",
	"recipe_ideas",
	"pet_food_items",
	"pets",
	"household_invite",
	"household_member",
	"household",
	"app_error",
	"social_post",
	"guide_article",
	"app_settings",
	"admin_action_log",
	"password_reset_token",
	"email_verification_token",
	"oauth_account",
	"user"
RESTART IDENTITY CASCADE;
`;

export async function createIntegrationDb(): Promise<IntegrationDbContext> {
	const client = new PGlite();
	for (const file of SQL_MIGRATION_FILES) {
		const migrationSql = readFileSync(join(process.cwd(), 'drizzle', file), 'utf8');
		await client.exec(migrationSql);
	}

	const db = drizzle({ client, schema });

	return {
		client,
		db,
		async reset() {
			await client.exec(SQL_TRUNCATE_ALL);
		},
		async seedUser(user) {
			const now = new Date();
			await db.insert(schema.userTable).values({
				id: user.id,
				email: user.email ?? `${user.id}@example.com`,
				passwordHash: 'integration-test-password-hash',
				role: 'user',
				createdAt: now
			});
		},
		async seedHousehold(household) {
			const id = household.id ?? DEFAULT_HOUSEHOLD_ID;
			const now = new Date();
			await db.insert(schema.householdTable).values({
				id,
				name: household.name ?? 'Test household',
				createdAt: now
			});
			if (household.members.length > 0) {
				await db.insert(schema.householdMemberTable).values(
					household.members.map((m) => ({
						householdId: id,
						userId: m.userId,
						role: m.role === 'member' ? 'editor' : m.role
					}))
				);
			}
			return id;
		},
		async close() {
			await client.close();
		}
	};
}
