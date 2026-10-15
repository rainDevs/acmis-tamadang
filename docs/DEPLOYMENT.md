# ACMIS Deployment

Status: **No production deployment exists as of 2026-10-15.** No prod hosting selected, no release performed, no production credentials issued. Everything below except local-dev facts is Planned.

## Constraints (from `DEVELOPMENT_PLAN.md §2` / `RULES.md §3`)
- Production must support PHP + MySQL and use HTTPS.
- Public online booking requires an internet-accessible host; localhost-only is not sufficient for the public portal.
- Keep development, test, and production configuration separate.
- Never commit passwords, keys, session secrets, or real patient data.

## Local development (Implemented facts 2026-10-15)
- Frontend: `cd frontend && npm run dev` (Vite); verified toolchain via `npm run build` / `npm run lint` (see `docs/TESTING.md`).
- Backend runtime available: PHP 8.2.12 CLI; local stack may use XAMPP/Apache + MySQL per plan (XAMPP itself not verified here).
- No root `.gitignore` exists (verified 2026-10-15 — Outstanding: add one covering secrets, local overrides, logs, real data dumps before backend config lands). `frontend/.gitignore` exists (node_modules, dist, logs, editor files).
- No example environment file exists (`backend/.env.example`, `frontend/.env.example` both absent — Outstanding: add placeholder-only examples when config work starts; never commit real secrets).

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
