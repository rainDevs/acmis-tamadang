# ACMIS Deployment

Status: **No production deployment exists as of 2026-10-15.** No prod hosting selected, no release performed, no production credentials issued. Everything below except local-dev facts is Planned.

## Constraints (from `DEVELOPMENT_PLAN.md §2` / `RULES.md §3`)
- Production must support PHP + MySQL and use HTTPS.
- Public online booking requires an internet-accessible host; localhost-only is not sufficient for the public portal.
- Keep development, test, and production configuration separate.
- Never commit passwords, keys, session secrets, or real patient data.

## Local development (verified 2026-10-15 unless noted)
- Dev database: `acmistamadangdb` on local MySQL 8.0.43 (provisioned 2026-10-16 at owner request; all migrations + both seeders applied; verified 4 tables / 6 services / 5 schedule rows; `appointments` empty for UI-driven booking). Credentials stay outside version control — pass via env per run, never commit.
- Local env files (gitignored, owner-requested 2026-10-16): `backend/.env` (dev DB settings; loaded by `Config::loadEnvFile()` in the front controller — real env vars win, values never logged) and `frontend/.env` (`VITE_API_BASE_URL`; Vite reads it on `npm run dev` start, restart dev after editing). Verified: `php -S` with a clean environment connects via `backend/.env` alone (`/api/health/db` 200).
- CORS: whitelisted dev origins (`localhost:5173`, `127.0.0.1:5173`) reflected by the front controller; override with `CORS_ALLOWED_ORIGINS` env for other hosts. Fixed 2026-10-16 after the browser blocked Vite→API calls despite HTTP 200s (verified: reflected ACAO, 204 preflight, no header for unlisted origins).
- Frontend: `cd frontend && npm run dev` (Vite); verified toolchain via `npm run build` / `npm run lint` (see `docs/TESTING.md`).
- Backend: `php -S localhost:8000 -t backend/public` from repo root, then `GET /api/health` (verified live 200 + JSON 404 for unknown routes).
- Backend runtime: PHP 8.2.12 CLI; Composer 2.9.2 available (`composer validate` clean); local stack may use XAMPP/Apache + MySQL per plan (MySQL CLI not present here).
- Root `.gitignore` exists (covers `backend/vendor/`, `backend/.env`, `frontend/dist/`, logs, data dumps; explicitly does NOT ignore `database/migrations/*.sql`).
- `backend/.env.example` + `frontend/.env.example` exist (placeholders only). No real `.env` files tracked (verified: `backend/.env` and `frontend/.env` absent).

## Production (Planned — nothing performed)
- Hosting: TBD (open question per `DEVELOPMENT_PLAN.md §16`: where hosted, who maintains, how backups protected).
- Procedure when hosting is chosen: configure HTTPS, apply reviewed migrations, create least-privilege DB credentials, set up monitoring + operational contacts, document rollback, train staff, run post-deployment smoke tests (see `DEVELOPMENT_PLAN.md §11` Phase 9 exit criteria).
- No agent may deploy, alter live infrastructure, or change production env vars without explicit approval (`RULES.md §12`, `§18`).

## Backup, recovery, rollback (Planned — not rehearsed)
- Required before launch: tested backup + restoration rehearsal, documented RTO/RPO, rollback instructions, incident contacts. None performed yet; rehearsal must be demonstrated and recorded before release sign-off.

## Secrets and safety
- Secrets live in environment/config outside version control with placeholder-only examples.
- Never print secrets in terminal output, screenshots, reports, or agent summaries.
- Before any destructive operation: verified backup + explicit approval.

---
## Related notes
- Role: ops — local dev + Planned prod, backup/recovery (no prod yet).
- Governed by: [[RULES]] · [[DEVELOPMENT_PLAN]] · [[docs/DECISIONS|DECISIONS]]
- Uses: [[docs/TESTING|TESTING]] (build/health checks) · [[docs/DATABASE|DATABASE]] + [[database/README|database workflow]] (migrations) · [[docs/API|API]] (`GET /api/health`)
- Work queue: [[TASKS]] · State: [[PROGRESS]]
