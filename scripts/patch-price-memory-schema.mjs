import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/lib/infrastructure/db/schema.ts';
let schema = readFileSync(path, 'utf8');

if (!schema.includes('lineIndex: integer')) {
	schema = schema.replace(
		`\t\tstoreLabel: text('store_label'),
\t\tpurchasedAt: timestamp('purchased_at', { withTimezone: true, mode: 'date' }),
\t\tcreatedAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
\t},
\t(table) => [
\t\tindex('receipt_purchase_line_household_key_idx').on(table.householdId, table.normalizedKey),
\t\tindex('receipt_purchase_line_household_created_idx').on(table.householdId, table.createdAt),
\t\tindex('receipt_purchase_line_household_key_purchased_idx').on(
\t\t\ttable.householdId,
\t\t\ttable.normalizedKey,
\t\t\ttable.purchasedAt
\t\t)
\t]
);`,
		`\t\tstoreLabel: text('store_label'),
\t\tpurchasedAt: timestamp('purchased_at', { withTimezone: true, mode: 'date' }),
\t\tinventoryItemId: text('inventory_item_id').references(() => inventoryItemTable.id, {
\t\t\tonDelete: 'set null'
\t\t}),
\t\tconceptKey: text('concept_key'),
\t\tmatchSource: text('match_source'),
\t\timportSource: text('import_source'),
\t\tlineIndex: integer('line_index').notNull().default(0),
\t\tcreatedAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
\t},
\t(table) => [
\t\tindex('receipt_purchase_line_household_key_idx').on(table.householdId, table.normalizedKey),
\t\tindex('receipt_purchase_line_household_created_idx').on(table.householdId, table.createdAt),
\t\tindex('receipt_purchase_line_household_key_purchased_idx').on(
\t\t\ttable.householdId,
\t\t\ttable.normalizedKey,
\t\t\ttable.purchasedAt
\t\t),
\t\tindex('receipt_purchase_line_household_concept_purchased_idx').on(
\t\t\ttable.householdId,
\t\t\ttable.conceptKey,
\t\t\ttable.purchasedAt
\t\t),
\t\tindex('receipt_purchase_line_household_inventory_purchased_idx').on(
\t\t\ttable.householdId,
\t\t\ttable.inventoryItemId,
\t\t\ttable.purchasedAt
\t\t),
\t\tuniqueIndex('receipt_purchase_line_batch_line_idx').on(table.importBatchId, table.lineIndex)
\t]
);

export const householdPurchaseConceptTable = pgTable(
\t'household_purchase_concept',
\t{
\t\thouseholdId: text('household_id')
\t\t\t.notNull()
\t\t\t.references(() => householdTable.id, { onDelete: 'cascade' }),
\t\tconceptKey: text('concept_key').notNull(),
\t\tdisplayName: text('display_name').notNull(),
\t\tcreatedAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
\t},
\t(table) => [primaryKey({ columns: [table.householdId, table.conceptKey] })]
);`
	);
	writeFileSync(path, schema);
	console.log('patched schema.ts');
} else {
	console.log('schema.ts already patched');
}

let integrationDb = readFileSync('src/lib/test/integration-db.ts', 'utf8');
if (!integrationDb.includes('household_purchase_concept')) {
	integrationDb = integrationDb.replace(
		'\t"receipt_purchase_line",\n',
		'\t"receipt_purchase_line",\n\t"household_purchase_concept",\n'
	);
	writeFileSync('src/lib/test/integration-db.ts', integrationDb);
	console.log('patched integration-db truncate list');
}
