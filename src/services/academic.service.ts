import { prisma } from "../lib/db/prisma";
import { assertAdmin } from "../lib/auth/rbac";
import { AuthenticatedUser } from "../lib/auth/session";
import { logAuditInTx } from "../lib/audit/audit-logger";
import {
  DepartmentSchema,
  ProgramSchema,
  AcademicYearSchema,
  BatchSchema,
  SemesterSchema,
  SectionSchema,
  SubjectSchema,
  SubjectCreditSchema,
} from "../lib/validators/academic";
import { z } from "zod";

export class AcademicService {
  // ============================================================================
  // DEPARTMENTS
  // ============================================================================
  static async listDepartments() {
    return prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { programs: true, subjects: true, faculty: true } },
      },
    });
  }

  static async createDepartment(
    user: AuthenticatedUser,
    input: z.infer<typeof DepartmentSchema>
  ) {
    assertAdmin(user);
    const data = DepartmentSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const created = await tx.department.create({ data });
      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_DEPARTMENT",
        entityType: "Department",
        entityId: created.id,
        newValues: created,
      });
      return created;
    });
  }

  // ============================================================================
  // PROGRAMS / COURSES
  // ============================================================================
  static async listPrograms(departmentId?: string) {
    return prisma.program.findMany({
      where: departmentId ? { departmentId } : undefined,
      orderBy: { name: "asc" },
      include: {
        department: true,
        _count: { select: { batches: true, students: true, semesters: true } },
      },
    });
  }

  static async createProgram(
    user: AuthenticatedUser,
    input: z.infer<typeof ProgramSchema>
  ) {
    assertAdmin(user);
    const data = ProgramSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const created = await tx.program.create({ data });

      // Automatically initialize default semesters for the program (e.g. Semesters 1 to N)
      for (let sem = 1; sem <= created.totalSemesters; sem++) {
        await tx.semester.create({
          data: {
            programId: created.id,
            semesterNumber: sem,
            title: `Semester ${sem}`,
          },
        });
      }

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_PROGRAM",
        entityType: "Program",
        entityId: created.id,
        newValues: created,
      });
      return created;
    });
  }

  // ============================================================================
  // ACADEMIC YEARS
  // ============================================================================
  static async listAcademicYears() {
    return prisma.academicYear.findMany({
      orderBy: { startDate: "desc" },
    });
  }

  static async createAcademicYear(
    user: AuthenticatedUser,
    input: z.infer<typeof AcademicYearSchema>
  ) {
    assertAdmin(user);
    const data = AcademicYearSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      // If marking as current, unmark previous current year
      if (data.isCurrent) {
        await tx.academicYear.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }

      const created = await tx.academicYear.create({
        data: {
          name: data.name,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isCurrent: data.isCurrent,
        },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_ACADEMIC_YEAR",
        entityType: "AcademicYear",
        entityId: created.id,
        newValues: created,
      });
      return created;
    });
  }

  // ============================================================================
  // BATCHES
  // ============================================================================
  static async listBatches(programId?: string) {
    return prisma.batch.findMany({
      where: programId ? { programId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        program: true,
        academicYear: true,
        _count: { select: { sections: true, students: true } },
      },
    });
  }

  static async createBatch(
    user: AuthenticatedUser,
    input: z.infer<typeof BatchSchema>
  ) {
    assertAdmin(user);
    const data = BatchSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const created = await tx.batch.create({ data });

      // Automatically create a default "Section A" for new batch
      await tx.section.create({
        data: {
          batchId: created.id,
          name: "Section A",
        },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_BATCH",
        entityType: "Batch",
        entityId: created.id,
        newValues: created,
      });
      return created;
    });
  }

  // ============================================================================
  // SEMESTERS & SECTIONS
  // ============================================================================
  static async listSemesters(programId: string) {
    return prisma.semester.findMany({
      where: { programId },
      orderBy: { semesterNumber: "asc" },
    });
  }

  static async createSemester(
    user: AuthenticatedUser,
    input: z.infer<typeof SemesterSchema>
  ) {
    assertAdmin(user);
    const data = SemesterSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const created = await tx.semester.create({ data });
      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_SEMESTER",
        entityType: "Semester",
        entityId: created.id,
        newValues: created,
      });
      return created;
    });
  }

  static async listSections(batchId: string) {
    return prisma.section.findMany({
      where: { batchId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { studentEnrollments: true, facultyAssignments: true } },
      },
    });
  }

  static async createSection(
    user: AuthenticatedUser,
    input: z.infer<typeof SectionSchema>
  ) {
    assertAdmin(user);
    const data = SectionSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const created = await tx.section.create({ data });
      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_SECTION",
        entityType: "Section",
        entityId: created.id,
        newValues: created,
      });
      return created;
    });
  }

  // ============================================================================
  // SUBJECTS & CREDITS
  // ============================================================================
  static async listSubjects(departmentId?: string) {
    return prisma.subject.findMany({
      where: departmentId ? { departmentId } : undefined,
      orderBy: { code: "asc" },
      include: {
        department: true,
        subjectCredits: {
          include: {
            program: true,
            semester: true,
          },
        },
      },
    });
  }

  static async createSubject(
    user: AuthenticatedUser,
    input: z.infer<typeof SubjectSchema>
  ) {
    assertAdmin(user);
    const data = SubjectSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const created = await tx.subject.create({ data });
      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_SUBJECT",
        entityType: "Subject",
        entityId: created.id,
        newValues: created,
      });
      return created;
    });
  }

  static async configureSubjectCredit(
    user: AuthenticatedUser,
    input: z.infer<typeof SubjectCreditSchema>
  ) {
    assertAdmin(user);
    const data = SubjectCreditSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const credit = await tx.subjectCredit.upsert({
        where: {
          subjectId_programId_semesterId: {
            subjectId: data.subjectId,
            programId: data.programId,
            semesterId: data.semesterId,
          },
        },
        create: data,
        update: data,
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CONFIGURE_SUBJECT_CREDIT",
        entityType: "SubjectCredit",
        entityId: credit.id,
        newValues: credit,
      });
      return credit;
    });
  }
}

