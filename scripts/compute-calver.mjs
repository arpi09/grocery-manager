#!/usr/bin/env node
/**
 * Print next CalVer tag (YYYY.M.D or YYYY.M.D.N) for UTC today.
 * Uses gh release list when GH_TOKEN / gh CLI available.
 */
import { execSync } from 'node:child_process';

/** @param {string} args */
function gh(args) {
	return execSync(`gh ${args}`, { encoding: 'utf8' }).trim();
}

const now = new Date();
const base = `${now.getUTCFullYear()}.${now.getUTCMonth() + 1}.${now.getUTCDate()}`;

/** @type {string[]} */
let existing = [];
try {
	const raw = gh('release list --limit 50 --json tagName --jq ".[].tagName"');
	existing = raw ? raw.split('\n').filter(Boolean) : [];
} catch {
	existing = [];
}

const sameDay = existing.filter((tag) => tag === base || tag.startsWith(`${base}.`));
if (sameDay.length === 0) {
	console.log(base);
	process.exit(0);
}

const suffixes = sameDay
	.map((tag) => (tag === base ? 1 : Number.parseInt(tag.slice(base.length + 1), 10)))
	.filter((n) => Number.isFinite(n));
const next = Math.max(1, ...suffixes) + 1;
console.log(`${base}.${next}`);
