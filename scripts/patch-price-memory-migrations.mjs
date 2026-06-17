import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const tail = [
	'0048_household_location_rule.sql',
	'0049_receipt_import_success_events.sql',
	'0050_price_memory_phase1.sql',
	'0051_home_redesign_telemetry.sql'
];

for (const path of ['src/lib/infrastructure/db/init.ts', 'src/lib/test/integration-db.ts']) {
	let text = readFileSync(path, 'utf8');
	text = text.replace(
		/\t'0048_household_location_rule\.sql'[\s\S]*?\];/,
		`${tail.map((file) => `\t'${file}'`).join(',\n')}\n];`
	);
	writeFileSync(path, text);
}

const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8').replace(/^\uFEFF/, ''));
journal.entries = journal.entries.filter((entry) => entry.idx <= 47);
for (const [idx, tag, when] of [
	[48, '0049_receipt_import_success_events', 1752499200000],
	[49, '0050_price_memory_phase1', 1752585600000],
	[50, '0051_home_redesign_telemetry', 1752672000000]
]) {
	if (!journal.entries.some((entry) => entry.tag === tag)) {
		journal.entries.push({ idx, version: '7', when, tag, breakpoints: true });
	}
}
journal.entries = journal.entries
	.filter((entry, index, all) => all.findIndex((candidate) => candidate.tag === entry.tag) === index)
	.map((entry, idx) => ({ ...entry, idx }));
writeFileSync('drizzle/meta/_journal.json', `${JSON.stringify(journal, null, '\t')}\n`);

const sqlFiles = readdirSync('drizzle')
	.filter((name) => /^\d{4}_.+\.sql$/.test(name))
	.sort();
let migrationsTest = readFileSync('src/lib/infrastructure/db/migrations.test.ts', 'utf8');
migrationsTest = migrationsTest.replace(
	/\t\t\t'0000_init\.sql',[\s\S]*?\t\t\];/,
	`\t\t\t'0000_init.sql',\n${sqlFiles
		.filter((name) => name !== '0000_init.sql')
		.map((name) => `\t\t\t'${name}'`)
		.join(',\n')}\n\t\t];`
);
writeFileSync('src/lib/infrastructure/db/migrations.test.ts', migrationsTest);
