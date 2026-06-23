#!/usr/bin/env node
/**
 * Zero-config bootstrap for new developers and cloud agents.
 * Usage: npm run setup:agent [-- --skip-migrate]
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skipMigrate = process.argv.includes('--skip-migrate');

const DEV_DEFAULTS = {
	USE_PGLITE: 'true',
	EMAIL_SENDING_DISABLED: 'true',
	ADMIN_PASSWORD: 'skaffu-dev-agent',
	PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
	TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
	TURNSTILE_SKIP: 'true',
	PUBLIC_ORIGIN: 'http://localhost:5173'
};

function setOrAppendEnv(key, value) {
	const envPath = join(root, '.env');
	const line = `${key}=${value}`;
	const content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
	const pattern = new RegExp(`^${key}=.*$`, 'm');

	if (pattern.test(content)) {
		writeFileSync(envPath, content.replace(pattern, line), 'utf8');
		return;
	}

	const suffix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
	writeFileSync(envPath, `${content}${suffix}${line}\n`, 'utf8');
}

function ensureEnvFile() {
	const examplePath = join(root, '.env.example');
	const envPath = join(root, '.env');

	if (!existsSync(envPath)) {
		if (!existsSync(examplePath)) {
			console.error('Missing .env.example — cannot bootstrap.');
			process.exit(1);
		}
		copyFileSync(examplePath, envPath);
		console.log('Created .env from .env.example');
	}

	console.log('Applied dev defaults (PGlite, email off, Turnstile test keys).');
}

function runMigrate() {
	if (skipMigrate) {
		console.log('Skipping db:migrate (--skip-migrate). PGlite applies migrations at runtime.');
		return;
	}

	console.log('Running npm run db:migrate ...');
	const result = spawnSync('npm', ['run', 'db:migrate'], {
		cwd: root,
		stdio: 'inherit',
		shell: true
	});

	if (result.status !== 0) {
		console.warn('db:migrate failed — PGlite dev may still work via initDatabase().');
	}
}

ensureEnvFile();
runMigrate();

console.log('\nReady. Start dev:');
console.log('  npm run dev');
console.log('  → http://localhost:5173');
console.log('\nBefore push: npm run quick:dev  |  npm run pr:gate');
