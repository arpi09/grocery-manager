/**
 * Generates minimal text-based PDF receipt fixtures for CI.
 * Run: node scripts/generate-synthetic-receipt-pdfs.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'tests/fixtures/receipts');

/** Build a minimal PDF 1.4 with a single Helvetica text line (pdf-parse compatible). */
function buildMinimalPdf(lines) {
	const text = lines.join(' ');
	const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
	const stream = `BT /F1 10 Tf 50 750 Td (${escaped}) Tj ET`;
	const streamLen = Buffer.byteLength(stream, 'utf8');

	const chunks = [
		'%PDF-1.4\n',
		'1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
		'2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
		'3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
		`4 0 obj << /Length ${streamLen} >> stream\n${stream}\nendstream endobj\n`,
		'5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n'
	];

	const body = chunks.join('');
	const offsets = [0];
	let pos = 0;
	for (const chunk of chunks) {
		pos += Buffer.byteLength(chunk, 'utf8');
		offsets.push(pos);
	}

	const xrefStart = pos;
	const pad = (n) => String(n).padStart(10, '0');
	let xref = 'xref\n0 6\n';
	xref += '0000000000 65535 f \n';
	for (let i = 1; i <= 5; i++) {
		xref += `${pad(offsets[i])} 00000 n \n`;
	}

	const trailer = `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
	return Buffer.from(body + xref + trailer, 'utf8');
}

const fixtures = [
	{
		file: 'synthetic-ica-01.pdf',
		lines: [
			'ICA Supermarket',
			'Org.nr 556012-5790',
			'MJOLK 1L 15.90',
			'BROD FIL 25.00',
			'YOGHURT NATUR 12.50',
			'OST GUDBRANDSDAL 45.00',
			'APPLEN 1KG 29.90',
			'TOTALT 128.30 SEK'
		]
	},
	{
		file: 'synthetic-willys-01.pdf',
		lines: [
			'Willys Hemma',
			'KVITTO 2026-05-01',
			'PASTA SPAGHETTI 14.90',
			'KROSSADE TOMATER 8.50',
			'KYCKLINGFILE 89.00',
			'BANANER 1KG 19.90',
			'SMÖR 500G 42.00',
			'SUMMA 174.30'
		]
	},
	{
		file: 'synthetic-kivra-01.pdf',
		lines: [
			'Kivra digitalt kvitto',
			'Coop Konsum',
			'LAX FILE 129.00',
			'RIS BASMATI 1KG 39.90',
			'GRONSAKSBULJON 12.00',
			'PAPRIKA ROD 24.50',
			'KVARTSMJOLK 18.90',
			'ATT BETALA 224.30'
		]
	},
	{
		file: 'synthetic-ica-02.pdf',
		lines: [
			'Maxi ICA Toftanas',
			'Org.nr 556012-5790',
			'KVITTO 2026-04-22 14:32',
			'KYCKLINGFILE 500G 69.90',
			'PASTA PENNE 500G 12.90',
			'KROSSADE TOMATER 14.50',
			'LOK GUL 1ST 4.90',
			'VITLOK 1ST 6.50',
			'GRADDFIL 15% 500ML 22.90',
			'SMOR NORDBRENT 500G 54.90',
			'OST PRAG 26% 200G 32.90',
			'YOGHURT GREK 500G 28.90',
			'BANANER 1KG 19.90',
			'APPLEN ROYAL GALA 1KG 24.90',
			'Kaffe Gevalia 500G 89.90',
			'TE EARL GREY 20ST 29.90',
			'DISKMEDEL 750ML 24.90',
			'TOALETTPAPPER 8R 49.90',
			'RABATT STAMMIS -15.00',
			'MOMS 12% 42.18',
			'TOTALT 549.08 SEK',
			'BETALAT KORT 549.08'
		]
	},
	{
		file: 'synthetic-kivra-02.pdf',
		lines: [
			'Kivra',
			'Digitalt kvitto fran ICA Supermarket Varnhem',
			'Butik: ICA Supermarket Varnhem',
			'Datum: 2026-04-15',
			'ARTIKEL BELOPP',
			'FILMJOlk 3% 1L 18.90',
			'FIL 12% 1L 19.90',
			'AGGL 12FR FRIGARD 42.90',
			'SMOR 82% 500G 56.90',
			'FALUKORV 800G 39.90',
			'POTATIS FAST 2KG 24.90',
			'LOK ROT 1KG 14.90',
			'MOROTTER 1KG 12.90',
			'CITRON 4ST 15.90',
			'BRÖD LEVAIN 500G 32.90',
			'Att betala 280.00 SEK'
		]
	}
];

mkdirSync(outDir, { recursive: true });

for (const { file, lines } of fixtures) {
	const pdf = buildMinimalPdf(lines);
	writeFileSync(join(outDir, file), pdf);
	console.log(`Wrote ${file} (${pdf.length} bytes)`);
}
