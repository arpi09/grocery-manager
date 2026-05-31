import { execSync } from 'node:child_process';

export default function globalSetup() {
	execSync('npx svelte-kit sync', { stdio: 'inherit', cwd: process.cwd() });
}
