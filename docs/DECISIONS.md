# SRGC Student Result Management System — Architectural Decision Records (ADR)

This document records the foundational architectural decisions, context, and rationale for the SRGC Student Result Management System.

---

## ADR-001: Pinned Tech Stack & Framework Selection
- **Status**: Decided
- **Context**: The system requires high performance, strict type safety, institutional-grade visual presentation, and seamless integration with serverless deployment platforms (e.g., Vercel) and relational persistence (PostgreSQL).
- **Decision**:
  - Application Framework: Next.js (App Router) with React and TypeScript (strict mode enabled).
  - Styling & Components: Tailwind CSS, shadcn/ui primitives, Lucide React icons, and Recharts for analytical visualizations.
  - Package Manager: `pnpm` with frozen lockfile enforcement in CI.
- **Rationale**: Next.js App Router provides native server components, secure server-only execution boundaries, and high-performance streaming. Tailwind and shadcn/ui provide accessible, customizable UI controls meeting institutional branding guidelines.

---

## ADR-002: Persistence Engine & Database Migrations
- **Status**: Decided
- **Context**: Academic result management requires ACID compliance, relational integrity, foreign key constraints, composite unique indexes, and versioned historical tracking.
- **Decision**:
  - Database: PostgreSQL (supported on Neon serverless and local/CI Postgres).
  - ORM: Prisma ORM.
  - Migration Strategy: Committed migration scripts generated via `prisma migrate dev` in local development and applied via `prisma migrate deploy` in production.
  - Connection Strategy: Dual connection strings — pooled `DATABASE_URL` (PgBouncer) for application runtime, unpooled `DIRECT_URL` for migration scripts.
  - Prohibition: `prisma db push` and `prisma migrate reset` are strictly forbidden outside local ephemeral test environments.
- **Rationale**: Relational integrity prevents orphan marks or invalid grade assignments. Migration versioning ensures reproducible environments across CI, staging, and production.

---

## ADR-003: Custom Server-Side Sessions vs. Stateless JWT / Third-Party Auth
- **Status**: Decided
- **Context**: An institutional system requires immediate session invalidation (e.g. upon role change, account deactivation, or suspicious activity), full login auditing, and zero risk of stale claims.
- **Decision**:
  - Custom server-side session management.
  - A cryptographically secure 256-bit random opaque token is generated server-side.
  - The client receives the raw token in an `httpOnly`, `Secure` (production), `SameSite=Lax` cookie.
  - The database stores only the SHA-256 hash of the token (`Session` table).
  - Password hashing uses Argon2id via `@node-rs/argon2` (with fallback to `bcryptjs` if native compilation issues arise in specific environments).
- **Rationale**: Stateless JWTs cannot be revoked without maintaining blacklists (which defeats statelesness) and can expose stale claims. Storing only token hashes in the database protects active sessions even in the unlikely event of database read compromises.

---

## ADR-004: PostgreSQL-Backed Atomic Rate Limiting
- **Status**: Decided
- **Context**: Rate limiting is required to prevent brute-force attacks against authentication endpoints. In serverless environments, in-memory rate limiters leak and diverge across instances. Introducing Redis introduces extra operational dependencies and costs.
- **Decision**: Implement rate limiting using PostgreSQL atomic upsert transactions (`RateLimitRecord` table) with sliding window expiration.
- **Rationale**: PostgreSQL is already part of the infrastructure. Atomic `INSERT ... ON CONFLICT DO UPDATE` statements provide synchronized, serverless-safe rate limiting without external infrastructure overhead.

---

## ADR-005: Pure Calculation Engine Boundary
- **Status**: Decided
- **Context**: Result calculations (SGPA, CGPA, grade allocation, pass/fail status, ranking) represent the core institutional intellectual property and must be 100% deterministic, audit-proof, and testable without database overhead.
- **Decision**: Encapsulate all calculation logic in a pure TypeScript module (`src/lib/calculator/`) with zero database, framework, or runtime I/O imports.
- **Rationale**: Isolating the calculation engine enables hundreds of unit tests running in milliseconds, testing complex edge cases (zero marks, ties, grace marks, incomplete subjects, credit variations) with zero flakiness.

---

## ADR-006: Pure-JavaScript PDF Generation
- **Status**: Decided
- **Context**: Generating student result cards and transcripts must run reliably inside serverless functions with limited execution timeouts and memory constraints.
- **Decision**: Use `@react-pdf/renderer` (or `pdf-lib`) for pure JavaScript PDF generation. Headless Chrome / Puppeteer is strictly prohibited.
- **Rationale**: Headless browsers add 300+ MB dependencies, require high CPU/memory, have slow startup latency, and introduce security attack vectors. Pure-JS PDF generators run in milliseconds directly in Node.js serverless functions.

---

## ADR-007: Spreadsheet Processing & Formula Injection Protection
- **Status**: Decided
- **Context**: Bulk marks entry involves importing and exporting CSV and XLSX files. The npm `xlsx` package has known unpatched vulnerabilities (e.g., prototype pollution and ReDoS). In addition, unescaped CSV/Excel exports can lead to formula injection (CSV Injection).
- **Decision**:
  - Use `exceljs` for XLSX processing and a maintained streaming parser for CSV.
  - Implement a mandatory sanitization function on all export generation pipelines that prepends a single quote (`'`) to any cell string starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.
  - Cap file uploads at 2 MB and 5,000 rows with server-side validation.
- **Rationale**: Protects institutional administrative machines from malicious payload execution when opening downloaded spreadsheets.

---

## ADR-008: Immutable Snapshotting for Examination Enrollments
- **Status**: Decided
- **Context**: In academic institutions, students transfer sections, change batches, or update profile information. Historical examination results must remain faithful to the student's status at the time the exam was conducted.
- **Decision**: Create an explicit `ExaminationEnrollment` snapshot entity when an exam session is initiated. Historical results and eligibility queries bind strictly to this immutable snapshot rather than dynamic, mutable student profiles.
- **Rationale**: Guarantees historical accuracy and prevents accidental alteration of past academic records when a student's present enrollment changes.

---

## ADR-009: Production Zero-Seed & Offline First-Admin Bootstrap
- **Status**: Decided
- **Context**: Security best practices mandate that production databases must start empty without default passwords, demo accounts, or test fixtures.
- **Decision**:
  - The production database contains no seed scripts.
  - The initial system administrator is provisioned exclusively via an offline CLI command: `pnpm bootstrap:admin`.
  - The CLI script enforces strong password entropy, verifies that zero admins exist before executing, writes an audit record, and never exposes an HTTP onboarding endpoint.
- **Rationale**: Completely eliminates default credential vulnerabilities and unauthorized administrative takeover risks.

---

## ADR-010: Transactional Audit Logging & Concurrency Defense
- **Status**: Decided
- **Context**: Grade tampering, publication disputes, or race conditions during bulk review can cause institutional liability.
- **Decision**:
  - Every mutation (marks entry, submission, review, approval, publication, unpublication, correction) must record an `AuditLog` entry in the *exact same* database transaction.
  - Post-publication mark modifications require a written reason, create a `MarkCorrectionAudit` record, and enforce optimistic concurrency using record `version` counters.
- **Rationale**: Guarantees zero orphan changes and guarantees a verifiable audit trail with race-condition prevention.

