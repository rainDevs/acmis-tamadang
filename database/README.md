# Database workflow

Status: workflow established 2026-10-15; **zero real migrations exist**. Detailed schema is deferred to TASK-008 after TASK-001 business rules are confirmed. Do not invent tables here.

## Layout (root tier, see `docs/DECISIONS.md`)
- `database/migrations/` — version-controlled `*.sql` files, applied in filename order.
- `database/seeders/` — synthetic seeds only (see `seeders/README.md`). Never real patient data.

## Naming
`YYYYMMDDHHMMSS_short_description.sql`, e.g. `20261015000000_template.sql`.
The timestamp prefix defines apply order. One logical change per file.

## Authoring rules
- Start from `migrations/00000000000000_template.sql` (comment-only, safe to apply).
- Use InnoDB, explicit primary keys, foreign keys with named constraints.
- Every migration must be re-runnable-safe to review and must state rollback (`-- Rollback:` header) or `/* irreversible: <reason> */` with owner approval.
- Multi-step writes that must be atomic belong in transactions in the migration or in backend code (see `RULES.md §7`).
- Never concatenate untrusted input into SQL — migrations are static SQL; runtime queries use PDO prepared statements.

## Apply (fresh database from empty)
```sh
mysql -h <host> -u <user> -p -e "CREATE DATABASE IF NOT EXISTS <db> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
for f in database/migrations/*.sql; do mysql -h <host> -u <user> -p <db> < "$f"; done
```

## Verify (disposable database first — mandatory before production)
1. Create an empty disposable database.
2. Apply all migrations in order (command above).
3. Confirm tables/constraints/indexes match `docs/DATABASE.md`.
4. Test valid + invalid + duplicate inserts; confirm transactions roll back on failure.
5. Record the exact commands + outcomes in the task report (never claim a pass without a run).

Outstanding (no MySQL in this environment as of 2026-10-15): live apply + verification run. Must be done when MySQL is available, before any production migration.

## Destructive changes
Require explicit owner approval + verified backup first (`RULES.md §7`). No migration may silently discard data.

---
## Related notes
- Role: workflow detail — naming / apply / verify for `database/migrations/`.
- Parent spec: [[docs/DATABASE|DATABASE]] · Seeds: [[database/seeders/README|seeders guide]]
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]] · [[docs/DECISIONS|DECISIONS]] (root `database/`)
- Verified by: [[docs/TESTING|TESTING]] · Operated via: [[docs/DEPLOYMENT|DEPLOYMENT]]
