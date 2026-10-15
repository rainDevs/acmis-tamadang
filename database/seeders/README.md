# Seeders

Synthetic data only. Never commit real patient information, real contact numbers, or production dumps.

- Files here are manual `.sql` inserts applied after migrations, or documentation of approved seed sets.
- Name seeds `YYYYMMDDHHMMSS_description.sql` to match the migration that requires them.
- Small, reviewable, clearly fake values (e.g. `Test Resident 1`, `09170000001`).
- Production-like volumes for performance checks must still be synthetic.

---
## Related notes
- Role: data rules — synthetic-only seeds, applied after migrations.
- Parent spec: [[docs/DATABASE|DATABASE]] · Workflow: [[database/README|database workflow]]
- Governed by: [[RULES]] · [[docs/DECISIONS|DECISIONS]]
- Verified by: [[docs/TESTING|TESTING]]
