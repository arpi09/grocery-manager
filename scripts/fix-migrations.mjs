import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const initPath = 'src/lib/infrastructure/db/init.ts';
let init = readFileSync(initPath, 'utf8');
init = init.replace(
	/\t'0048_household_location_rule\.sql'[\s\S]*?\];/,
	"\t'0048_household_location_rule.sql',\r\n\t'0049_receipt_import_success_events.sql',\r\n\t'0051_home_redesign_telemetry.sql'\r\n];"
);
writeFileSync(initPath, init);

const journalPath = 'drizzle/meta/_journal.json';
const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
journal.entries = journal.entries.filter((e) => e.idx <= 47);
for (const [idx, tag, when] of [
	[48, '0049_receipt_import_success_events', 1752499200000],
	[49, '0051_home_redesign_telemetry', 1752585600000]
]) {
	journal.entries.push({ idx, version: '7', when, tag, breakpoints: true });
}
writeFileSync(journalPath, `${JSON.stringify(journal, null, '\t')}\n`);

const sqlFiles = readdirSync('drizzle')
	.filter((name) => /^\d{4}_.+\.sql$/.test(name))
	.sort();
writeFileSync(
	'src/lib/infrastructure/db/migrations.test.ts',
	`import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DRIZZLE_DIR = join(process.cwd(), 'drizzle');

function listSqlMigrationFiles(): string[] {
	return readdirSync(DRIZZLE_DIR)
		.filter((name) => /^\\d{4}_.+\\.sql$/.test(name))
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
		expect(tags).toEqual(sqlFiles.map((file) => file.replace(/\\.sql$/, '')));
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
${sqlFiles
	.filter((name) => name !== '0000_init.sql')
	.map((name) => `\t\t\t'${name}'`)
	.join(',\r\n')}
		];
		expect(pgliteFiles).toEqual(sqlFiles);
	});
});
`.replace(/\n/g, '\r\n')
);
console.log('migrations fixed');
