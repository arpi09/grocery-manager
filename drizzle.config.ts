import { defineConfig } from 'drizzle-kit';

/**
 * App Hosting / Cloud Build run `npm run build` without a real database.
 * drizzle-kit only needs a parseable URL in the config file; migrations use RUNTIME secrets.
 */
const databaseUrl =
	process.env.DATABASE_URL ?? 'postgresql://build:build@127.0.0.1:5432/build';

export default defineConfig({
	schema: './src/lib/infrastructure/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl
	}
});
