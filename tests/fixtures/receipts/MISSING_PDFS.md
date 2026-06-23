# Missing receipt golden PDF fixtures

The golden receipt suite references these PDFs that are not checked into the repo (licensing / size):

- `kivra-05.pdf`, `kivra-06.pdf`, `kivra-07.pdf`
- `willys-01.pdf` through `willys-06.pdf`

Expected JSON snapshots under `tests/fixtures/receipts/expected/` can be added when PDFs are available locally. Until then, CI runs against the 11 synthetic + available real fixtures only.

To refresh snapshots after adding a PDF:

```bash
npm run test:receipt-golden
```

(Set `UPDATE_RECEIPT_GOLDEN=0` to verify without rewriting expected JSON.)
