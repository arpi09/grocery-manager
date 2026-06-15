import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/** Deploy-fast critical E2E — @deploy-critical tagged tests only. */
export default defineConfig({
	...baseConfig,
	workers: 1,
	grep: /@deploy-critical/
});
