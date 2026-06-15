import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const script = join(dirname(fileURLToPath(import.meta.url)), 'ci-path-tier.mjs');

function runTier(files) {
	const result = spawnSync(process.execPath, [script, ...files], {
		encoding: 'utf8',
		env: { ...process.env, GITHUB_OUTPUT: undefined }
	});
	if (result.status !== 0) throw new Error(result.stderr || result.stdout);
	return result.stdout.trim().split('\n').pop();
}

describe('ci-path-tier', () => {
	it('classifies docs-only', () => {
		expect(runTier(['docs/CI_CD.md', 'README.md'])).toBe('docs-only');
	});
	it('classifies low-risk css', () => {
		expect(runTier(['src/app.css'])).toBe('low-risk');
	});
	it('classifies core-loop', () => {
		expect(runTier(['src/hooks.server.ts'])).toBe('core-loop');
		expect(runTier(['e2e/auth.spec.ts'])).toBe('core-loop');
	});
	it('mixed core + css is core-loop', () => {
		expect(runTier(['src/app.css', 'src/hooks.server.ts'])).toBe('core-loop');
	});
});
