import { initDatabase } from '$lib/infrastructure/db/init';
import { seedDemoAccount } from '$lib/infrastructure/db/seed-demo';

await initDatabase();
const { email } = await seedDemoAccount();
console.info(`[seed-demo] Log in at /login with ${email} and DEMO_ACCOUNT_PASSWORD.`);
