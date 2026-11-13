# SRGC Student Result Management System — Detailed Technical Specification

## 1. System Mission & Scope
The SRGC Student Result Management System is a production-oriented, secure, enterprise-grade academic examination and result management platform tailored for Shri Ram Group of Colleges (SRGC). The system supports the complete result lifecycle:
1. Institution & Academic Setup (Departments, Programs, Batches, Semesters, Sections, Subjects, Credits, Grading Scales).
2. People & Enrollment (Students, Faculty, System Users, Section/Batch Enrollments).
3. Faculty Assignment (Year/Semester/Section/Subject scoping with conflict prevention).
4. Examination Lifecycle (Creation, Subject configuration, Enrollment snapshotting, Session scheduling).
5. Marks Entry & Submission (Draft saving, Bulk import via CSV/XLSX, Validation, Submission for review).
6. Administrative Review & Approval (Feedback, Rejection, Revision, Audit logging).
7. Publication & Result Access (Transactional publication, Concurrency controls, Student self-service, Authenticated pure-JS PDF generation).
8. Post-Publication Maintenance (Audited marks corrections, Optimistic concurrency, Historical unpublishing with mandatory audit reasoning).
9. Reporting & Analytics (Departmental, Program, Faculty, Examination, Performance statistics, Grade distributions, Sanitized CSV/XLSX exports).

---

## 2. Roles, Permissions & Centralized RBAC

### 2.1 ADMIN
- **Scope**: Comprehensive institutional authority across all academic entities, records, and system configurations.
- **Capabilities**:
  - Institutional Setup: Configure institution branding (name, address, contacts, session), departments, courses, programs, academic years, semesters, batches, sections, subjects, and credit structures.
  - User & People Management: Manage Student, Faculty, and Admin accounts; control account activation, deactivation, and session termination.
  - Faculty Assignments: Assign instructors to specific Year/Semester/Section/Subject combinations with automated clash and duplicate assignment detection.
  - Examination Administration: Configure exams, attach exam subjects, freeze eligible student rosters into `ExaminationEnrollment` immutable snapshots.
  - Marks Review & Moderation: Review marks submissions from faculty; approve or reject with written feedback.
  - Result Publication: Execute transactional, concurrency-safe publication with pre-publication validation gates; unpublish with mandatory audit reason.
  - Audited Corrections: Correct published marks requiring explicit reason, preserving full version history via `MarkCorrectionAudit`, using optimistic concurrency tokens.
  - Policy & Grading: Maintain grading scales, grade point mappings, passing criteria, SGPA/CGPA calculation formulas, ranking visibility rules, and withheld result policies.
  - Reports & Auditing: Access system-wide audit logs, generate and export performance summaries, rankings, pass/fail analytics.

### 2.2 FACULTY
- **Scope**: Strictly restricted to assigned Year/Semester/Section/Subject combinations for active terms.
- **Capabilities**:
  - View eligible enrolled students snapshot for assigned course sections.
  - Manual marks entry (internal assessments, mid-terms, practicals, end-term exams as configured).
  - Save partial drafts securely.
  - Bulk import marks via CSV and XLSX (validating schema, range, student registration numbers, with row-level error reporting).
  - Submit entered marks for administrative review; track submission status (DRAFT, SUBMITTED, REJECTED, APPROVED).
  - View administrative feedback upon rejection, rectify discrepancies, and resubmit.
  - **Restrictions**: Cannot publish results, cannot modify marks once approved/published, cannot access students or classes outside their explicit assignments.

### 2.3 STUDENT
- **Scope**: Strictly read-only access to their own academic profile and officially PUBLISHED results.
- **Capabilities**:
  - View individual published semester/term results, subject-wise scores, maximum marks, minimum passing marks, earned grade, grade points, SGPA, CGPA, and status (PASS, FAIL, WITHHELD, INCOMPLETE).
  - Download official digitally formatted result cards as pure-JS generated PDFs with authentic SRGC institutional headers and verification metadata.
  - View academic progression history across completed semesters.
  - View class/batch rankings only if configured as publicly visible by the institution's privacy policy.
  - **Restrictions**: Zero access to unpublished marks, draft submissions, administrative notes, audit logs, or records belonging to other students.

---

## 3. Data Model & Database Architecture

The persistence layer is PostgreSQL managed via Prisma ORM with strict foreign keys, unique constraints, explicit cascade/restrict rules, CHECK constraints, composite indexes, and historical versioning tables.

### 3.1 Entity Groups
1. **Identity & Security**:
   - `User`: Primary authentication identity (`id`, `identifier`, `email`, `passwordHash`, `role`, `isActive`, `lastLoginAt`, timestamps).
   - `Session`: Server-side opaque session token store (`id`, `tokenHash`, `userId`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`).
   - `PasswordResetToken`: Secure hashed reset token store with single-use flag and expiry.
   - `AuditLog`: Immutable log of sensitive operations (`id`, `userId`, `action`, `entityType`, `entityId`, `oldValues`, `newValues`, `ipAddress`, `userAgent`, `createdAt`).
   - `RateLimitRecord`: Atomic tracking table for sliding-window / bucketed rate limiting (`key`, `points`, `expireAt`).

2. **Institution & Governance**:
   - `InstitutionSetting`: Singleton/key-value store for institution branding, logo URL, affiliation, contact details, active academic session, and policy overrides.
   - `Department`: Academic divisions (e.g., Computer Science & Engineering, Management Studies).
   - `Course` / `Program`: Degree programs under departments (e.g., B.Tech CSE, BCA, BBA, MBA).

3. **Academic Structure**:
   - `AcademicYear`: High-level academic periods (e.g., 2025-2026).
   - `Semester`: Numerical or ordinal terms within programs (e.g., Sem 1 through Sem 8).
   - `Batch`: Student entry cohorts (e.g., Batch 2023-2027).
   - `Section`: Cohort division units (e.g., Section A, Section B).
   - `Subject`: Course offerings (`code`, `name`, `type`: Theory/Practical/Elective).
   - `SubjectCredit`: Credit weights assigned per program-semester-subject.
   - `StudentEnrollment`: Program, batch, semester, and section assignment records.
   - `FacultyAssignment`: Scoped instructor assignments linking Faculty to AcademicYear, Semester, Section, and Subject.

4. **People**:
   - `Student`: Student profile (`id`, `userId`, `regNumber`, `rollNumber`, `firstName`, `lastName`, `dob`, `gender`, `contactEmail`, `contactPhone`, `programId`, `batchId`, `currentSemesterId`).
   - `Faculty`: Faculty profile (`id`, `userId`, `facultyCode`, `firstName`, `lastName`, `designation`, `departmentId`, `contactEmail`, `contactPhone`).

5. **Examination & Result Lifecycle**:
   - `Examination`: Exam session definition (`title`, `code`, `academicYearId`, `semesterId`, `programId`, `examType`, `startDate`, `endDate`, `status`: UPCOMING, IN_PROGRESS, MARKS_ENTRY, UNDER_REVIEW, COMPLETED).
   - `ExaminationSubject`: Subjects included in an exam session (`examinationId`, `subjectId`, `maxInternalMarks`, `minInternalMarks`, `maxExternalMarks`, `minExternalMarks`, `maxMarks`, `minMarks`).
   - `ExaminationEnrollment`: **Immutable snapshot** of eligible students registered for the exam session at time of exam setup, decoupling historical results from mutable student profiles.
   - `Mark`: Individual student mark per exam subject (`examinationEnrollmentId`, `examinationSubjectId`, `internalMarks`, `externalMarks`, `totalMarks`, `grade`, `gradePoint`, `status`: DRAFT, SUBMITTED, REJECTED, APPROVED, WITHHELD, INCOMPLETE, `version`).
   - `MarkCorrectionAudit`: Immutable historical ledger of post-publication mark alterations (`id`, `markId`, `previousInternal`, `newInternal`, `previousExternal`, `newExternal`, `reason`, `changedById`, `createdAt`).
   - `ResultPublication`: Institutional publication record per exam/section (`examinationId`, `status`: DRAFT, PUBLISHED, UNPUBLISHED, `publishedAt`, `publishedById`, `unpublishReason`, `version`).
   - `ResultPublicationVersion`: Versioned snapshot of published calculations for tamper-evident auditing.

6. **Grading & Calculation Policy**:
   - `GradingScale`: Defined scale container (e.g., "SRGC 10-Point Relative / Absolute Scale").
   - `GradeRule`: Min percentage, max percentage, letter grade, grade point, description, isFail.
   - `PassingCriteria`: Minimum theory %, practical %, aggregate %, credit requirements.
   - `ResultCalculationPolicy`: SGPA formula, CGPA formula, rounding precision (e.g., 2 decimal places), withheld policy, rank display settings.

7. **Operations & Async Utilities**:
   - `ImportJob`: Bulk upload metadata (`jobType`, `fileName`, `uploadedById`, `status`, `totalRows`, `processedRows`, `errorCount`).
   - `ImportError`: Row-level failure diagnostics (`importJobId`, `rowNumber`, `rawContent`, `errorMessage`).
   - `ExportJob`: Generated export tracking (`exportType`, `requestedById`, `status`, `fileKey`).
   - `Notification`: In-app broadcast and targeted notifications (`userId`, `title`, `message`, `category`, `isRead`, `createdAt`).

---

## 4. Academic Workflow & Lifecycle Gates

### 4.1 Marks Entry to Approval Pipeline
```
[ Faculty Draft Entry / CSV Import ]
                │
                ▼
[ Validation: Ranges, Formats, Eligibility ]
                │
                ▼
      [ Submit for Review ]  ───────────────┐
                │                           │
                ▼                           ▼
      [ Under Admin Review ]         [ Rejected by Admin ]
                │                           │
                ├───────────────────────────┘
                ▼
       [ Admin Approved ]
```

### 4.2 Publication Pipeline & Pre-Publication Validation Gates
Result publication cannot occur until the transactional pre-flight check confirms:
1. **Valid Examination State**: Exam status is closed for entry and ready for publishing.
2. **Eligibility Match**: All snapshot enrollments in `ExaminationEnrollment` have valid marks records.
3. **Completeness Verification**: Every mandatory subject has entered and approved marks, or is explicitly flagged as absent/withheld per policy.
4. **Range & Integrity Verification**: No marks exceed subject maximums or fall below zero.
5. **Zero Open Import Errors**: All pending data imports have been successfully reconciled.
6. **Confirmed Policy**: Administrator has confirmed and locked calculation policy for the exam session.

### 4.3 Post-Publication Alterations & Auditing
- **Unpublishing**: Requires a mandatory, non-empty institutional justification reason. Marks remain preserved; student access is revoked immediately; an immutable publication history entry is created.
- **Marks Correction**: Allowed only by administrators using optimistic locking (`version` check). Requires a mandatory written reason. Fires a `MarkCorrectionAudit` record and updates calculation snapshots in the same transaction.

---

## 5. Calculation Engine Specification

The calculation engine is implemented as a **pure, zero-dependency, framework-agnostic TypeScript module** (`src/lib/calculator/`).

### 5.1 Pure Engine Principles
- No database connections, no ORM, no HTTP/request dependencies.
- Completely deterministic: given the same policy and student marks input, it returns the exact same result structure.
- 100% testable in isolation with high-volume edge cases.

### 5.2 Handled Rules & Edge Cases
1. **Grade Assignment**: Evaluates total marks percentage against `GradeRule` boundaries. Supports upper/lower inclusive boundary rules without gaps or overlaps.
2. **Passing Logic**:
   - Minimum internal assessment threshold.
   - Minimum external examination threshold.
   - Minimum aggregate threshold.
   - Grace mark allowances (if configured in policy).
3. **Credit Points & SGPA**:
   - Formula: $\text{SGPA} = \frac{\sum (\text{Credits}_i \times \text{GradePoint}_i)}{\sum \text{Credits}_i}$ across all attempted subjects in the semester.
4. **Cumulative CGPA**:
   - Weighted average of SGPA across all completed semesters weighted by semester credits.
5. **Special Result Statuses**:
   - **WITHHELD**: Student marks withheld due to administrative or disciplinary reasons. Does NOT receive a PASS status, SGPA is marked WITHHELD, excluded from class ranking.
   - **INCOMPLETE**: Missing marks in one or more mandatory subjects. Status set to INCOMPLETE, SGPA marked INCOMPLETE.
   - **FAIL**: Failure in one or more mandatory subjects or failure to meet minimum passing credit threshold.
6. **Tie-Breaking & Ranking**:
   - Deterministic ranking: SGPA/Percentage descending -> Total marks descending -> Alphabetical / Registration number deterministic secondary ordering for dense ranks.
7. **Rounding Precision**: Configurable rounding modes (round half up / truncate) to exact decimal places (default 2).

---

## 6. Security & Infrastructure Architecture

### 6.1 Authentication & Session Management
- **Identities**: Login via institution identifier (Roll number, Faculty code, Admin username/email) + password.
- **Password Hashing**: `@node-rs/argon2` (Argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4) with bcryptjs fallback if environment requires.
- **Session Tokens**: 256-bit cryptographically secure random tokens generated server-side via `crypto.randomBytes(32)`.
- **Token Storage**: Plain token is stored ONLY in an `httpOnly`, `Secure`, `SameSite=Lax` cookie. Only the SHA-256 hash of the token is stored in the database `Session` table.
- **CSRF Protection**: SameSite cookies + Origin/Host verification on all state-mutating requests (POST, PUT, PATCH, DELETE).
- **Brute-Force & Rate Limiting**: PostgreSQL-backed atomic counter table tracking IP and identifier attempts, supporting serverless multi-instance deployments without memory leak or cache divergence.
- **Password Reset**: Constant-time response flow; never reveals whether an email/identifier exists in the database.

### 6.2 Authorization & Scope Enforcement
- Centralized RBAC module (`src/lib/auth/rbac.ts`).
- Ownership scoping: every database query for faculty or student explicitly embeds `session.userId` or verified `studentId`/`facultyId`. IDs passed in request params are treated as untrusted and verified against session context.

### 6.3 Input Validation & Sanitization
- Zod schemas at all boundary layers (API routes, Server Actions, Form submissions, CSV/Excel parsers).
- Formula Injection Defense: All CSV and XLSX export generators prepend single quote `'` to any string cell beginning with `=`, `+`, `-`, or `@`.
- Strict file upload limits: 2 MB file size, 5,000 maximum rows, MIME type verification (text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet).

### 6.4 PDF Generation
- Pure-JS rendering using `@react-pdf/renderer` or `pdf-lib`.
- Zero headless Chrome / Puppeteer dependencies to guarantee serverless execution within memory and CPU limits.
- Authentic institutional layout matching SRGC specifications with dynamic QR verification token, official grading scale legend, and explicit disclaimer that physical transcripts take precedence.

---

## 7. Operational & Verification Rules
- Production database starts empty: **Zero seed scripts** in production.
- First administrator created exclusively via offline CLI command: `pnpm bootstrap:admin`.
- Comprehensive test suite: Unit tests for calculation engine, integration tests for repositories and services, API authorization tests, and Playwright end-to-end user journey tests.
- Every phase gated by strict verification: Prisma validate, TypeScript noEmit, ESLint, Unit/Integration tests, and Next.js build.

