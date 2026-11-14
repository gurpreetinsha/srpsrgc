# SRGC Result Management System — Permanent Engineering Rules

## Mission
Build a real, production-oriented Student Result Management System for Shri Ram Group of Colleges (SRGC). Not a prototype, MVP, or demo. Every feature must work against the real database and real backend code.

## Truthfulness (highest priority)
- Never claim a command passed unless you ran it in this session and saw the output.
- Never claim an external service (Neon, Vercel, GitHub, email) is connected unless you verified it.
- If something fails, say so, fix it, and re-run. Never skip or weaken a test to get green.
- Record every unverified item in docs/PROGRESS.md under "Not yet verified".
- Never mark anything PRODUCTION VERIFIED. Allowed classifications: IMPLEMENTATION COMPLETE, READY FOR STAGING.

## Data rules
- Production DB starts empty. No seed script. No `prisma db seed` configured. No demo users, faculty, students, exams, or results. No default or hardcoded credentials.
- Test fixtures are allowed ONLY as factory functions that run inside automated tests against an ephemeral local/CI Postgres, and are never imported by app code.
- No localStorage or static JSON as application data. No simulated API responses.
- Never invent SRGC's grading polici, accreditation, affiliations, rankings, seals, or signatures. Unknown policy becomes a configurable setting and an entry in docs/OPEN_POLICY_QUESTIONS.md. Branding (name, logo, address, contacts, session) is configurable by the admin.

## Technical decisions (already made, do not re-litigate)
- Next.js App Router + React + TypeScript (strict) + Tailwind + shadcn/ui + lucide-react + Recharts. Pin exact versions in the lockfile. Use pnpm.
- PostgreSQL + Prisma with committed migrations (`prisma migrate dev` locally, `prisma migrate deploy` in production). Never `db push` or `migrate reset` outside local/test DBs.
- Neon: runtime uses the pooled DATABASE_URL; migrations use DIRECT_URL (unpooled). Document both.
- Auth: custom server-side sessions. Random opaque token in an httpOnly, Secure, SameSite=Lax cookie; only the token HASH is stored in the Session table. Argon2id (@node-rs/argon2; fall back to bcryptjs only if it breaks the Vercel build, and document why). CSRF: Origin/Host check plus SameSite on all mutating requests.
- Rate limiting: Postgres-backed with atomic upserts (shared across serverless instances). No in-memory limiter as a security control.
- RBAC: one centralized authorization module. Every query is scoped by the session user. IDs from the client are never trusted for ownership.
- Validation: Zod at every boundary. Structured error handling that never leaks stack traces.
- PDF: pure-JS (@react-pdf/renderer or pdf-lib). No headless Chrome.
- XLSX: exceljs (avoid the npm `xlsx` package due to known vulnerabilities). CSV via a maintained parser.
- Imports: max 2 MB and 5,000 rows (Vercel request-size limit), parse server-side, preview, then explicit confirm. Exports sanitize cells beginning with = + - @ to block formula injection.
- Tests: Vitest (unit + integration against a real local Postgres via docker compose) and Playwright (E2E). Never run tests against Neon production.
- Layering: route handlers/actions -> services -> repositories. Business rules live in services. The calculation engine is a pure module with no DB or framework imports.

## Workflow rules
- Work in phases. Each phase ends with: gate commands passing, docs/PROGRESS.md updated, a git commit. Do not start the next phase until the gate passes.
- Gate commands (as applicable): pnpm prisma validate, pnpm prisma generate, pnpm exec tsc --noEmit, pnpm lint, pnpm test, pnpm build.
- Keep docs/SPEC.md (requirements), docs/ARCHITECTURE.md, docs/DECISIONS.md, docs/PROGRESS.md, docs/OPEN_POLICY_QUESTIONS.md current.
- Do not ask for permission between phases. Stop and ask only for: missing credentials, destructive actions, production deployment, or unresolved institutional policy that blocks correctness (otherwise build it configurable and log it).
- Never run destructive DB commands against anything but the local/test DB. Never deploy to production.
- No dummy buttons, no TODO-as-feature, no placeholder routes for required features.

## Security baseline
Secrets never reach client code. Never log passwords, tokens, or hashes. Secure headers (CSP, HSTS, X-Frame-Options, etc.). Audit log for logins, role/permission changes, publication, unpublication, corrections, imports, and assignment changes. Audit writes happen in the same transaction as the change they describe. Password-reset flow never reveals whether an account exists.

## Design
Navy primary, restrained gold accent, white/light neutral backgrounds, accessible contrast, responsive (mobile/tablet/desktop), keyboard accessible, semantic HTML. Every page has loading, empty, error, and validation states. Never use the "Apex Institute" name.