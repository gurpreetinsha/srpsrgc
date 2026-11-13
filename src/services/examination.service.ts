import { prisma } from "../lib/db/prisma";
import { assertAdmin, assertFacultyAssignment } from "../lib/auth/rbac";
import { AuthenticatedUser } from "../lib/auth/session";
import { logAuditInTx } from "../lib/audit/audit-logger";
import { evaluateBatchResults } from "../lib/calculator/engine";
import { DEFAULT_GRADING_SCALE } from "../lib/calculator/grades";
import { DEFAULT_PASSING_CRITERIA } from "../lib/calculator/passing";
import { CalculationPolicy, StudentResultInput } from "../lib/calculator/types";
import {
  ExaminationSchema,
  ExaminationSubjectSchema,
  BulkMarksEntrySchema,
  MarkReviewSchema,
  PublishResultSchema,
  UnpublishResultSchema,
  MarkCorrectionSchema,
} from "../lib/validators/examination";
import {
  ExamStatus,
  ExamEnrollmentStatus,
  MarkStatus,
  PublicationStatus,
  Role,
} from "@prisma/client";
import { z } from "zod";

export class ExaminationService {
  // ============================================================================
  // EXAMINATION DEFINITION & SETUP
  // ============================================================================
  static async createExamination(
    user: AuthenticatedUser,
    input: z.infer<typeof ExaminationSchema>
  ) {
    assertAdmin(user);
    const data = ExaminationSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const exam = await tx.examination.create({
        data: {
          title: data.title,
          code: data.code,
          academicYearId: data.academicYearId,
          semesterId: data.semesterId,
          programId: data.programId,
          examType: data.examType,
          status: data.status,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      // Create initial draft publication record
      await tx.resultPublication.create({
        data: {
          examinationId: exam.id,
          status: PublicationStatus.DRAFT,
        },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_EXAMINATION",
        entityType: "Examination",
        entityId: exam.id,
        newValues: exam,
      });

      return exam;
    });
  }

  static async addExaminationSubject(
    user: AuthenticatedUser,
    input: z.infer<typeof ExaminationSubjectSchema>
  ) {
    assertAdmin(user);
    const data = ExaminationSubjectSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const maxTotal = data.maxInternalMarks + data.maxExternalMarks;
      const minTotal = data.minInternalMarks + data.minExternalMarks;

      const examSubject = await tx.examinationSubject.create({
        data: {
          examinationId: data.examinationId,
          subjectId: data.subjectId,
          maxInternalMarks: data.maxInternalMarks,
          minInternalMarks: data.minInternalMarks,
          maxExternalMarks: data.maxExternalMarks,
          minExternalMarks: data.minExternalMarks,
          maxTotalMarks: maxTotal,
          minTotalMarks: minTotal,
        },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "ADD_EXAMINATION_SUBJECT",
        entityType: "ExaminationSubject",
        entityId: examSubject.id,
        newValues: examSubject,
      });

      return examSubject;
    });
  }

  /**
   * Freezes student eligibility snapshot into ExaminationEnrollment.
   * Decouples historical exam results from mutable live student profiles.
   */
  static async freezeEnrollmentRoster(
    user: AuthenticatedUser,
    examinationId: string
  ) {
    assertAdmin(user);

    return prisma.$transaction(async (tx) => {
      const exam = await tx.examination.findUniqueOrThrow({
        where: { id: examinationId },
        include: { program: true, semester: true },
      });

      // Fetch active enrollments for this program and semester
      const activeEnrollments = await tx.studentEnrollment.findMany({
        where: {
          semesterId: exam.semesterId,
          academicYearId: exam.academicYearId,
          enrollmentStatus: "ACTIVE",
          student: { programId: exam.programId },
        },
        include: {
          student: true,
          batch: true,
          section: true,
          semester: true,
        },
      });

      if (activeEnrollments.length === 0) {
        throw new Error("No active student enrollments found matching this program and semester");
      }

      let createdCount = 0;
      for (const enr of activeEnrollments) {
        await tx.examinationEnrollment.upsert({
          where: {
            examinationId_studentId: {
              examinationId: exam.id,
              studentId: enr.studentId,
            },
          },
          create: {
            examinationId: exam.id,
            studentId: enr.studentId,
            rollNumberSnapshot: enr.student.rollNumber,
            regNumberSnapshot: enr.student.regNumber,
            studentNameSnapshot: `${enr.student.firstName} ${enr.student.lastName}`,
            programSnapshot: exam.program.name,
            batchSnapshot: enr.batch.name,
            semesterSnapshot: enr.semester.title,
            sectionSnapshot: enr.section.name,
            status: ExamEnrollmentStatus.ELIGIBLE,
          },
          update: {
            rollNumberSnapshot: enr.student.rollNumber,
            regNumberSnapshot: enr.student.regNumber,
            studentNameSnapshot: `${enr.student.firstName} ${enr.student.lastName}`,
          },
        });
        createdCount++;
      }

      // Transition exam status to MARKS_ENTRY
      await tx.examination.update({
        where: { id: exam.id },
        data: { status: ExamStatus.MARKS_ENTRY },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "FREEZE_EXAMINATION_ROSTER",
        entityType: "Examination",
        entityId: exam.id,
        newValues: { studentCount: createdCount },
      });

      return { enrolledCount: createdCount };
    });
  }

  // ============================================================================
  // MARKS ENTRY & SUBMISSION
  // ============================================================================
  static async enterMarks(
    user: AuthenticatedUser,
    input: z.infer<typeof BulkMarksEntrySchema>
  ) {
    const data = BulkMarksEntrySchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const examSubject = await tx.examinationSubject.findUniqueOrThrow({
        where: { id: data.examinationSubjectId },
        include: { examination: true, subject: true },
      });

      // Authorization guard: Faculty must be assigned to this subject/semester
      if (user.role === Role.FACULTY) {
        // Find enrollment to extract section
        const firstEnrollment = await tx.examinationEnrollment.findFirst({
          where: { id: data.marks[0]?.examinationEnrollmentId },
        });

        if (firstEnrollment) {
          const section = await tx.section.findFirst({
            where: { name: firstEnrollment.sectionSnapshot },
          });

          if (section) {
            await assertFacultyAssignment(user, {
              subjectId: examSubject.subjectId,
              sectionId: section.id,
              semesterId: examSubject.examination.semesterId,
            });
          }
        }
      }

      const markStatus: MarkStatus = data.saveAsDraft
        ? MarkStatus.DRAFT
        : MarkStatus.SUBMITTED;

      let savedCount = 0;

      for (const row of data.marks) {
        const internal = row.internalMarks ?? null;
        const external = row.externalMarks ?? null;
        const total = internal !== null && external !== null ? internal + external : null;

        await tx.mark.upsert({
          where: {
            examinationEnrollmentId_examinationSubjectId: {
              examinationEnrollmentId: row.examinationEnrollmentId,
              examinationSubjectId: data.examinationSubjectId,
            },
          },
          create: {
            examinationEnrollmentId: row.examinationEnrollmentId,
            examinationSubjectId: data.examinationSubjectId,
            internalMarks: internal,
            externalMarks: external,
            totalMarks: total,
            status: row.isWithheld ? MarkStatus.WITHHELD : markStatus,
            submittedById: data.saveAsDraft ? null : user.id,
            submittedAt: data.saveAsDraft ? null : new Date(),
          },
          update: {
            internalMarks: internal,
            externalMarks: external,
            totalMarks: total,
            status: row.isWithheld ? MarkStatus.WITHHELD : markStatus,
            submittedById: data.saveAsDraft ? undefined : user.id,
            submittedAt: data.saveAsDraft ? undefined : new Date(),
          },
        });
        savedCount++;
      }

      // If submitted for review, update exam status to UNDER_REVIEW
      if (!data.saveAsDraft) {
        await tx.examination.update({
          where: { id: examSubject.examinationId },
          data: { status: ExamStatus.UNDER_REVIEW },
        });
      }

      await logAuditInTx(tx, {
        userId: user.id,
        action: data.saveAsDraft ? "SAVE_MARKS_DRAFT" : "SUBMIT_MARKS_FOR_REVIEW",
        entityType: "ExaminationSubject",
        entityId: examSubject.id,
        newValues: { marksUpdatedCount: savedCount, status: markStatus },
      });

      return { savedCount, status: markStatus };
    });
  }

  // ============================================================================
  // ADMINISTRATIVE REVIEW & MODERATION
  // ============================================================================
  static async reviewMarks(
    user: AuthenticatedUser,
    input: z.infer<typeof MarkReviewSchema>
  ) {
    assertAdmin(user);
    const data = MarkReviewSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const newStatus = data.action === "APPROVE" ? MarkStatus.APPROVED : MarkStatus.REJECTED;

      const updated = await tx.mark.updateMany({
        where: {
          examinationSubjectId: data.examinationSubjectId,
          status: { in: [MarkStatus.SUBMITTED, MarkStatus.DRAFT] },
        },
        data: {
          status: newStatus,
          approvedById: data.action === "APPROVE" ? user.id : null,
          approvedAt: data.action === "APPROVE" ? new Date() : null,
          rejectionReason: data.action === "REJECT" ? data.rejectionReason : null,
        },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: data.action === "APPROVE" ? "APPROVE_MARKS" : "REJECT_MARKS",
        entityType: "ExaminationSubject",
        entityId: data.examinationSubjectId,
        newValues: { action: data.action, count: updated.count, reason: data.rejectionReason },
      });

      return { action: data.action, count: updated.count };
    });
  }

  // ============================================================================
  // PRE-PUBLICATION INTEGRITY CHECKS
  // ============================================================================
  static async validatePrePublicationGates(examinationId: string) {
    const exam = await prisma.examination.findUniqueOrThrow({
      where: { id: examinationId },
      include: {
        examSubjects: { include: { subject: true } },
        enrollments: { select: { id: true, studentId: true } },
      },
    });

    const errors: string[] = [];

    // Gate 1: Check enrollments snapshot
    if (exam.enrollments.length === 0) {
      errors.push("No eligible students are registered in the examination snapshot roster.");
    }

    // Gate 2: Check required subjects
    if (exam.examSubjects.length === 0) {
      errors.push("No examination subjects have been configured for this examination.");
    }

    // Gate 3: Check that every subject has approved marks for enrolled students
    for (const sub of exam.examSubjects) {
      const marks = await prisma.mark.findMany({
        where: { examinationSubjectId: sub.id },
      });

      if (marks.length < exam.enrollments.length) {
        errors.push(`Subject ${sub.subject.code} has missing marks (${marks.length}/${exam.enrollments.length} entered).`);
      }

      const unapproved = marks.filter((m) => m.status !== MarkStatus.APPROVED && m.status !== MarkStatus.WITHHELD);
      if (unapproved.length > 0) {
        errors.push(`Subject ${sub.subject.code} has ${unapproved.length} unapproved or draft marks.`);
      }

      // Check mark bounds
      for (const m of marks) {
        if (m.internalMarks !== null && (m.internalMarks < 0 || m.internalMarks > sub.maxInternalMarks)) {
          errors.push(`Mark ${m.id} in ${sub.subject.code} has internal marks out of bounds [0, ${sub.maxInternalMarks}].`);
        }
        if (m.externalMarks !== null && (m.externalMarks < 0 || m.externalMarks > sub.maxExternalMarks)) {
          errors.push(`Mark ${m.id} in ${sub.subject.code} has external marks out of bounds [0, ${sub.maxExternalMarks}].`);
        }
      }
    }

    // Gate 4: Check for unresolved import errors
    const openImportErrors = await prisma.importJob.count({
      where: {
        status: { in: ["PENDING", "PROCESSING", "FAILED"] },
      },
    });
    if (openImportErrors > 0) {
      errors.push(`There are ${openImportErrors} incomplete or failed data import jobs requiring administrative reconciliation.`);
    }

    return {
      canPublish: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // RESULT PUBLICATION & VERSIONING
  // ============================================================================
  static async publishResults(
    user: AuthenticatedUser,
    input: z.infer<typeof PublishResultSchema>
  ) {
    assertAdmin(user);
    const data = PublishResultSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      // 1. Pre-publication check
      const gateCheck = await this.validatePrePublicationGates(data.examinationId);
      if (!gateCheck.canPublish) {
        throw new Error(`Pre-publication validation failed:\n- ${gateCheck.errors.join("\n- ")}`);
      }

      // 2. Fetch publication record with optimistic concurrency check
      const pub = await tx.resultPublication.findUniqueOrThrow({
        where: { examinationId: data.examinationId },
      });

      if (pub.version !== data.version) {
        throw new Error(
          `Concurrency Conflict: Publication record version mismatch (expected ${data.version}, current ${pub.version}). Please refresh and retry.`
        );
      }

      // 3. Assemble student marks for pure calculation engine evaluation
      const exam = await tx.examination.findUniqueOrThrow({
        where: { id: data.examinationId },
        include: {
          examSubjects: { include: { subject: { include: { subjectCredits: true } } } },
          enrollments: {
            include: {
              marks: {
                include: {
                  examinationSubject: {
                    include: {
                      subject: {
                        include: { subjectCredits: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const calcStudents: StudentResultInput[] = exam.enrollments.map((enr) => ({
        studentId: enr.studentId,
        rollNumber: enr.rollNumberSnapshot,
        regNumber: enr.regNumberSnapshot,
        studentName: enr.studentNameSnapshot,
        isWithheld: enr.status === ExamEnrollmentStatus.WITHHELD,
        subjects: enr.marks.map((m) => {
          const subCredit = m.examinationSubject.subject.subjectCredits[0];
          return {
            subjectId: m.examinationSubject.subjectId,
            subjectCode: m.examinationSubject.subject.code,
            subjectName: m.examinationSubject.subject.name,
            credits: subCredit ? subCredit.credits : 4.0,
            maxInternalMarks: m.examinationSubject.maxInternalMarks,
            minInternalMarks: m.examinationSubject.minInternalMarks,
            maxExternalMarks: m.examinationSubject.maxExternalMarks,
            minExternalMarks: m.examinationSubject.minExternalMarks,
            internalMarksObtained: m.internalMarks,
            externalMarksObtained: m.externalMarks,
            isWithheld: m.status === MarkStatus.WITHHELD,
          };
        }),
      }));

      const policy: CalculationPolicy = {
        gradingScale: DEFAULT_GRADING_SCALE,
        passingCriteria: DEFAULT_PASSING_CRITERIA,
        roundingMode: "HALF_UP",
        roundingDecimals: 2,
        percentageMultiplier: 9.5,
        allowRankingWithheld: false,
        allowRankingIncomplete: false,
      };

      // Execute Pure Calculation Engine
      const evaluatedBatch = evaluateBatchResults(calcStudents, policy);

      const nextVersion = pub.version + 1;

      // 4. Update publication status
      const updatedPub = await tx.resultPublication.update({
        where: { id: pub.id },
        data: {
          status: PublicationStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedById: user.id,
          version: nextVersion,
        },
      });

      // 5. Store immutable version snapshot
      await tx.resultPublicationVersion.create({
        data: {
          resultPublicationId: pub.id,
          versionNumber: nextVersion,
          snapshotJson: JSON.parse(JSON.stringify(evaluatedBatch)),
          publishedById: user.id,
          notes: "Official Result Publication",
        },
      });

      // 6. Transition Exam status to COMPLETED
      await tx.examination.update({
        where: { id: exam.id },
        data: { status: ExamStatus.COMPLETED },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "PUBLISH_RESULTS",
        entityType: "ResultPublication",
        entityId: updatedPub.id,
        newValues: { version: nextVersion, studentCount: evaluatedBatch.length },
      });

      return {
        publicationId: updatedPub.id,
        version: nextVersion,
        studentCount: evaluatedBatch.length,
      };
    });
  }

  // ============================================================================
  // UNPUBLISHING (WITH MANDATORY AUDIT REASON)
  // ============================================================================
  static async unpublishResults(
    user: AuthenticatedUser,
    input: z.infer<typeof UnpublishResultSchema>
  ) {
    assertAdmin(user);
    const data = UnpublishResultSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const pub = await tx.resultPublication.findUniqueOrThrow({
        where: { examinationId: data.examinationId },
      });

      if (pub.version !== data.version) {
        throw new Error(
          `Concurrency Conflict: Publication record version mismatch (expected ${data.version}, current ${pub.version}).`
        );
      }

      const nextVersion = pub.version + 1;

      const updated = await tx.resultPublication.update({
        where: { id: pub.id },
        data: {
          status: PublicationStatus.UNPUBLISHED,
          unpublishReason: data.unpublishReason,
          version: nextVersion,
        },
      });

      // Reopen exam status to UNDER_REVIEW
      await tx.examination.update({
        where: { id: data.examinationId },
        data: { status: ExamStatus.UNDER_REVIEW },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "UNPUBLISH_RESULTS",
        entityType: "ResultPublication",
        entityId: updated.id,
        newValues: {
          version: nextVersion,
          reason: data.unpublishReason,
        },
      });

      return updated;
    });
  }

  // ============================================================================
  // AUDITED POST-PUBLICATION MARKS CORRECTION
  // ============================================================================
  static async correctPublishedMark(
    user: AuthenticatedUser,
    input: z.infer<typeof MarkCorrectionSchema>
  ) {
    assertAdmin(user);
    const data = MarkCorrectionSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const currentMark = await tx.mark.findUniqueOrThrow({
        where: { id: data.markId },
        include: {
          examinationSubject: { include: { examination: { include: { publication: true } } } },
        },
      });

      // Optimistic concurrency check on Mark version
      if (currentMark.version !== data.version) {
        throw new Error(
          `Concurrency Conflict: Mark version mismatch (expected ${data.version}, current ${currentMark.version}). Please reload record.`
        );
      }

      const internal = data.internalMarks !== undefined ? data.internalMarks : currentMark.internalMarks;
      const external = data.externalMarks !== undefined ? data.externalMarks : currentMark.externalMarks;
      const total = internal !== null && external !== null ? internal + external : null;

      // 1. Record immutable correction audit
      await tx.markCorrectionAudit.create({
        data: {
          markId: currentMark.id,
          previousInternal: currentMark.internalMarks,
          newInternal: internal,
          previousExternal: currentMark.externalMarks,
          newExternal: external,
          reason: data.reason,
          changedById: user.id,
        },
      });

      // 2. Update Mark record and bump version
      const updatedMark = await tx.mark.update({
        where: { id: currentMark.id },
        data: {
          internalMarks: internal,
          externalMarks: external,
          totalMarks: total,
          version: currentMark.version + 1,
        },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CORRECT_PUBLISHED_MARK",
        entityType: "Mark",
        entityId: updatedMark.id,
        oldValues: { internal: currentMark.internalMarks, external: currentMark.externalMarks },
        newValues: { internal, external, reason: data.reason },
      });

      return updatedMark;
    });
  }
}
