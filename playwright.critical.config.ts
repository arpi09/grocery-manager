import { defineConfig, type Project } from '@playwright/test';
import baseConfig from './playwright.config';

const baseProjects = (baseConfig.projects ?? []) as Project[];

/** Deploy-fast critical E2E — @deploy-critical tagged tests only. Setup always runs for session reuse. */
export default defineConfig({
	...baseConfig,
	workers: 1,
	grep: undefined,
	projects: baseProjects.map((project) =>
		project.name === 'setup' ? project : { ...project, grep: /@deploy-critical/ }
	)
});
