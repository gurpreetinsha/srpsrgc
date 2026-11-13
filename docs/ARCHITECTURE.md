# SRGC Student Result Management System — System Architecture Document

## 1. Architectural Philosophy & Layered Structure

The SRGC Student Result Management System is designed as a modular, layered, serverless-ready enterprise system built on Next.js App Router and PostgreSQL.

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   Next.js App Router (Server & Client Components)       │
│   Tailwind CSS + shadcn/ui + Lucide Icons + Recharts   │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTP / Server Actions)
┌──────────────────────────▼─────────────────────────────┐
│                 Controller / Boundary                  │
│       App Router Handlers (`/api/...`) & Actions       │
│     Zod Request Validation + Centralized Auth Guard    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                     Service Layer                      │
│        Encapsulates All Business Logic & Rules         │
│  Orchestrates Repositories, Audit Logging, Permissions │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
┌──────────────▼────────────┐ ┌────────────▼─────────────┐
│  Calculation Engine       │ │   Operational Services   │
│  (Pure TS, Zero DB Deps)  │ │   - PDF Generator (JS)   │
│  - SGPA / CGPA / Percent  │ │   - ExcelJS / CSV Parser │
│  - Grading & Pass/Fail    │ │   - Postgres RateLimiter │
│  - Rankings & Bounds      │ │   - Notifications Service│
└───────────────────────────┘ └──────────────────────────┘
               │                           │
┌──────────────▼───────────────────────────▼─────────────┐
│                   Repository Layer                     │
│       Data Access Objects (DAO) via Prisma ORM         │
│  Explicit Transactions, Query Scoping & Integrity      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                   Persistence Layer                    │
│      PostgreSQL (Pooled DATABASE_URL, Unpooled Direct) │
└────────────────────────────────────────────────────────┘
```

### 1.1 Separation of Concerns
1. **Controller / Boundary Layer**: Validates input types, headers, cookies, CSRF tokens, and unpacks the authenticated session. It delegates immediate execution to the Service layer and maps typed service outcomes to HTTP responses.
2. **Service Layer**: Houses institutional business rules, state transitions, validation checks, permission assertions, and transactional orchestration. Every mutation writes an audit log in the same database transaction.
3. **Pure Calculation Engine**: Zero external dependencies, pure mathematical and algorithmic evaluation of marks, grades, SGPA, CGPA, pass/fail status, and rankings.
4. **Repository Layer**: Directly interacts with Prisma Client. Implements strict tenancy/ownership filters so no raw identifiers from the client can leak unauthorized data.

---

## 2. Directory Structure

```
srpsrgc/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI workflow: lint, tsc, test, build
├── docs/
│   ├── SPEC.md                    # System specification
│   ├── ARCHITECTURE.md            # Architectural design (this file)
│   ├── DECISIONS.md               # Architectural Decision Records (ADR)
│   ├── PROGRESS.md                # Phase-by-phase implementation progress
│   └── OPEN_POLICY_QUESTIONS.md   # Open institutional policy variables
├── prisma/
│   ├── schema.prisma              # Database schema definitions
│   └── migrations/                # Version-controlled migrations
├── src/
│   ├── app/                       # Next.js App Router pages and API routes
│   │   ├── (auth)/                # Auth routes: /login, /forgot-password, etc.
│   │   ├── (dashboard)/           # Protected portal routes
│   │   │   ├── admin/             # Admin management console
│   │   │   ├── faculty/           # Faculty marks entry portal
│   │   │   └── student/           # Student results & transcript portal
│   │   ├── api/                   # REST route handlers
│   │   │   ├── auth/              # Login, logout, session check
│   │   │   ├── exams/             # Examination APIs
│   │   │   ├── marks/             # Marks entry, submission, review
│   │   │   ├── publication/       # Publish, unpublish, correct
│   │   │   ├── reports/           # Reporting & analytics
│   │   │   └── students/          # Student queries & PDF download
│   │   ├── layout.tsx             # Root layout with providers
│   │   └── page.tsx               # Landing / portal redirection
│   ├── components/                # UI components (shadcn/ui + custom)
│   │   ├── ui/                    # Base primitives (button, dialog, table...)
│   │   ├── layouts/               # Admin, Faculty, Student layout headers/nav
│   │   └── shared/                # Feedback, empty states, error boundaries
│   ├── lib/                       # Core system modules
│   │   ├── auth/                  # Password hashing, token gen, session store
│   │   │   ├── argon.ts           # Argon2id password hashing
│   │   │   ├── session.ts         # Cookie & database session lifecycle
│   │   │   ├── rbac.ts            # Centralized authorization & guards
│   │   │   └── rate-limit.ts      # Postgres-backed atomic rate limiter
│   │   ├── calculator/            # PURE RESULT CALCULATION ENGINE
│   │   │   ├── engine.ts          # Evaluator for grades, SGPA, CGPA, rank
│   │   │   ├── types.ts           # Pure input/output types
│   │   │   └── __tests__/         # 100% unit tests for calculation edge cases
│   │   ├── db/                    # Prisma client singleton
│   │   │   └── prisma.ts          # Instrumented Prisma instance
│   │   ├── audit/                 # Transactional audit logging helper
│   │   │   └── audit-logger.ts
│   │   ├── export/                # Export builders (CSV, XLSX with sanitization)
│   │   │   ├── excel.ts           # ExcelJS generator
│   │   │   └── csv.ts             # CSV generator with formula injection defense
│   │   ├── import/                # Bulk data parser & validator
│   │   │   └── marks-importer.ts  # Row-by-row validator & error compiler
│   │   ├── pdf/                   # Pure-JS PDF generation
│   │   │   └── result-card.tsx    # @react-pdf/renderer document definition
│   │   └── validators/            # Shared Zod schemas for all models
│   ├── repositories/              # Data access layers
│   │   ├── academic.repository.ts
│   │   ├── exam.repository.ts
│   │   ├── marks.repository.ts
│   │   ├── user.repository.ts
│   │   └── student.repository.ts
│   ├── services/                  # Business logic services
│   │   ├── auth.service.ts
│   │   ├── academic.service.ts
│   │   ├── exam.service.ts
│   │   ├── marks.service.ts
│   │   ├── publication.service.ts
│   │   └── report.service.ts
│   └── scripts/                   # CLI maintenance & bootstrapping
│       └── bootstrap-admin.ts     # pnpm bootstrap:admin script
├── tests/                         # Integration, operational & E2E tests
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── rbac.test.ts
│   │   └── publication.test.ts
│   └── e2e/                       # Playwright test specs
├── docker-compose.yml             # Local Postgres container definition
├── vitest.config.ts               # Unit & integration test configuration
├── playwright.config.ts           # Playwright E2E configuration
├── package.json
└── tsconfig.json
```

---

## 3. Core Subsystem Architectures

### 3.1 Authentication & Session Architecture
1. **Identifier Resolution**: The user submits their institution identifier (Roll No., Faculty ID, or Admin Email) and password.
2. **Rate Limiting**: Before password verification, the PostgreSQL-backed rate limiter increments attempts for the identifier and client IP. If thresholds are exceeded, the request is throttled with HTTP 429.
3. **Verification**: The user record is retrieved. `@node-rs/argon2` verifies the hash.
4. **Session Token Generation**:
   - `crypto.randomBytes(32).toString('hex')` generates a 256-bit cryptographically secure string.
   - The token's SHA-256 digest (`crypto.createHash('sha256').update(token).digest('hex')`) is stored in the `Session` table along with `userId`, `expiresAt`, IP, and User-Agent.
   - The unhashed token is sent to the client in an `httpOnly`, `Secure` (in production), `SameSite=Lax`, `Path=/` cookie named `srgc_session`.
5. **Session Resolution**: Every incoming authenticated request reads the cookie, hashes the value with SHA-256, and queries the database session. If expired or inactive, the session is cleared.
6. **Password Reset**: Generates a high-entropy random token, hashes it, stores it in `PasswordResetToken` with a 15-minute expiry. The response always returns success to prevent user enumeration attacks.

### 3.2 Authorization & Centralized RBAC Pattern
- Central authorization is encapsulated in `src/lib/auth/rbac.ts`.
- Every service method accepts an `ActorContext`:
  ```typescript
  export interface ActorContext {
    userId: string;
    role: 'ADMIN' | 'FACULTY' | 'STUDENT';
    facultyId?: string;
    studentId?: string;
  }
  ```
- Guard helpers ensure that ownership checks cannot be bypassed:
  - `assertAdmin(actor)`
  - `assertFacultyAssignment(actor, subjectId, sectionId, semesterId)`
  - `assertStudentOwnership(actor, studentId)`
- Repositories enforce tenancy filters directly in `WHERE` clauses.

### 3.3 Transactional Audit Logging Pattern
Audit logs are never dispatched asynchronously to detached workers where database failure could lead to unlogged mutations. Instead, every state modification wraps the mutation and audit record in a single Prisma transaction:
```typescript
await prisma.$transaction(async (tx) => {
  const updated = await tx.mark.update({ ... });
  await tx.auditLog.create({
    data: {
      userId: actor.userId,
      action: 'UPDATE_MARK',
      entityType: 'Mark',
      entityId: markId,
      oldValues: previousData,
      newValues: updated,
      ipAddress: context.ip,
      userAgent: context.userAgent,
    }
  });
});
```

### 3.4 Concurrency Control & Optimistic Locking
- **Publication**: Published status transitions use optimistic locking via a `version` field on `ResultPublication` and `Examination`. Concurrent publish requests detect version mismatch and roll back with conflict errors.
- **Marks Corrections**: Published marks corrections require the client to pass the existing `version` number. If another administrator has updated the record concurrently, the update is rejected.

### 3.5 Pure Calculation Engine Architecture
- Located in `src/lib/calculator/`.
- Interfaces:
  ```typescript
  export interface SubjectScoreInput {
    subjectId: string;
    subjectCode: string;
    credits: number;
    internalMarks: number;
    externalMarks: number;
    maxInternalMarks: number;
    maxExternalMarks: number;
    minInternalMarks: number;
    minExternalMarks: number;
    isElective?: boolean;
    isWithheld?: boolean;
    isAbsent?: boolean;
  }

  export interface CalculationPolicyInput {
    gradingScale: GradeRuleInput[];
    passingCriteria: PassingCriteriaInput;
    sgpaFormula: 'WEIGHTED_CREDIT_POINTS' | 'PERCENTAGE_AVERAGE';
    cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDITS' | 'SEMESTER_AVERAGE';
    roundingMode: 'HALF_UP' | 'TRUNCATE';
    roundingDecimals: number;
    allowGraceMarks: boolean;
    graceMarksLimit: number;
  }
  ```
- Outputs include structured student summaries:
  - Subject results: percentage, letter grade, grade points, credit points, pass/fail status.
  - Semester results: total credits offered, total credits earned, total marks obtained, max marks, SGPA, overall semester result status (`PASS`, `FAIL`, `WITHHELD`, `INCOMPLETE`, `PROMOTED_WITH_BACKLOG`).
  - Class Rankings: Standard dense ranking with tie-breaking.

### 3.6 PDF Generation Subsystem
- Implemented with pure JavaScript (`@react-pdf/renderer`).
- Renders server-side directly into a Node.js `ReadableStream` or `Buffer`.
- Generates standardized SRGC result cards containing:
  - Institution Header: Shri Ram Group of Colleges, College Emblem placeholder / URL, Academic Session.
  - Student Profile: Name, Roll Number, Registration Number, Program, Semester, Batch.
  - Result Table: Subject Code, Subject Title, Credits, Max Marks, Marks Obtained, Grade, Grade Point.
  - Summary Metrics: Total Credits, Earned Credits, SGPA, CGPA (if cumulative), Final Status.
  - Verification & Governance: Security Verification Hash, Date of Issue, Registrar Disclaimer stating official stamped physical copies take precedence.

### 3.7 Import & Export Subsystems
- **Imports**:
  - Validates file headers, row limits (≤ 5,000 rows), and file size (≤ 2 MB).
  - Two-stage process: Parse & Dry-Run Preview -> Explicit Confirmation.
  - Generates comprehensive row-level diagnostic reports detailing errors (e.g., student not enrolled, marks exceed subject maximum, malformed numbers).
- **Exports**:
  - Sanitization against Formula Injection (CSV / Excel injection):
    ```typescript
    export function sanitizeExportCell(value: unknown): unknown {
      if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) {
        return `'${value}`;
      }
      return value;
    }
    ```
  - Direct streaming using `exceljs` for XLSX and robust streaming parser for CSV.

---

## 4. Security & Compliance Baseline

1. **Defense in Depth**: Zod validation on all inputs, strict TypeScript types, PostgreSQL foreign key constraints and CHECK rules.
2. **Secret Safety**: Secrets (DB passwords, session keys) are strictly confined to server-side code. No client bundle ever receives database connection strings or secret tokens.
3. **Headers & Protection**:
   - `Content-Security-Policy`: Restricts scripts, styles, frames.
   - `X-Frame-Options: DENY`: Prevents clickjacking.
   - `X-Content-Type-Options: nosniff`.
   - `Strict-Transport-Security`: HSTS enabled in production.
   - `Referrer-Policy: strict-origin-when-cross-origin`.
4. **Rate Limiting**: Backed by PostgreSQL atomic upsert queries with timestamp-based window expiration, guaranteeing that serverless restarts or multiple instances share the exact same rate limit counts.

