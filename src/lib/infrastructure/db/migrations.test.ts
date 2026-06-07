import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DRIZZLE_DIR = join(process.cwd(), 'drizzle');

function listSqlMigrationFiles(): string[] {
	return readdirSync(DRIZZLE_DIR)
		.filter((name) => /^\d{4}_.+\.sql$/.test(name))
		.sort();
}

function journalTags(): string[] {
	const journal = JSON.parse(readFileSync(join(DRIZZLE_DIR, 'meta', '_journal.json'), 'utf8')) as {
		entries: Array<{ idx: number; tag: string }>;
	};
	return [...journal.entries].sort((a, b) => a.idx - b.idx).map((entry) => entry.tag);
}

describe('drizzle migrations', () => {
	it('lists every SQL file in the journal in order', () => {
		const sqlFiles = listSqlMigrationFiles();
		const tags = journalTags();

		expect(tags).toEqual(sqlFiles.map((file) => file.replace(/\.sql$/, '')));
	});

	it('has contiguous journal indices', () => {
		const journal = JSON.parse(readFileSync(join(DRIZZLE_DIR, 'meta', '_journal.json'), 'utf8')) as {
			entries: Array<{ idx: number }>;
		};
		const indices = journal.entries.map((entry) => entry.idx).sort((a, b) => a - b);

		expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i));
	});

	it('matches PGlite migration list used by init.ts', () => {
		const sqlFiles = listSqlMigrationFiles();
		const pgliteFiles = [
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
			'0032_analytics_behavior.sql'
		];

		expect(pgliteFiles).toEqual(sqlFiles);
	});
});
