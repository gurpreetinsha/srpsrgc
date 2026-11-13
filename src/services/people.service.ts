import { prisma } from "../lib/db/prisma";
import { assertAdmin } from "../lib/auth/rbac";
import { AuthenticatedUser } from "../lib/auth/session";
import { hashPassword } from "../lib/auth/argon";
import { logAuditInTx } from "../lib/audit/audit-logger";
import {
  FacultySchema,
  StudentSchema,
  StudentEnrollmentSchema,
  FacultyAssignmentSchema,
} from "../lib/validators/people";
import { Role, AssignmentRole, Prisma } from "@prisma/client";
import { z } from "zod";

export class PeopleService {
  // ============================================================================
  // FACULTY MANAGEMENT
  // ============================================================================
  static async listFaculty(params?: { departmentId?: string; search?: string }) {
    const where: Prisma.FacultyWhereInput = {};
    if (params?.departmentId) where.departmentId = params.departmentId;
    if (params?.search) {
      where.OR = [
        { facultyCode: { contains: params.search, mode: "insensitive" } },
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { contactEmail: { contains: params.search, mode: "insensitive" } },
      ];
    }

    return prisma.faculty.findMany({
      where,
      orderBy: { facultyCode: "asc" },
      include: {
        department: true,
        user: { select: { id: true, isActive: true, lastLoginAt: true } },
        _count: { select: { assignments: true } },
      },
    });
  }

  static async createFaculty(
    user: AuthenticatedUser,
    input: z.infer<typeof FacultySchema>
  ) {
    assertAdmin(user);
    const data = FacultySchema.parse(input);

    return prisma.$transaction(async (tx) => {
      // 1. Create User account for authentication
      const initialPassword = data.password || `${data.facultyCode}@Srgc2026`;
      const passwordHash = await hashPassword(initialPassword);

      const authUser = await tx.user.create({
        data: {
          identifier: data.facultyCode,
          email: data.contactEmail,
          passwordHash,
          role: Role.FACULTY,
          isActive: true,
        },
      });

      // 2. Create Faculty Profile
      const faculty = await tx.faculty.create({
        data: {
          userId: authUser.id,
          facultyCode: data.facultyCode,
          firstName: data.firstName,
          lastName: data.lastName,
          designation: data.designation,
          departmentId: data.departmentId,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
        },
        include: { department: true },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_FACULTY",
        entityType: "Faculty",
        entityId: faculty.id,
        newValues: faculty,
      });

      return faculty;
    });
  }

  // ============================================================================
  // STUDENT MANAGEMENT
  // ============================================================================
  static async listStudents(params?: {
    programId?: string;
    batchId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(1, params?.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.StudentWhereInput = {};
    if (params?.programId) where.programId = params.programId;
    if (params?.batchId) where.batchId = params.batchId;
    if (params?.search) {
      where.OR = [
        { rollNumber: { contains: params.search, mode: "insensitive" } },
        { regNumber: { contains: params.search, mode: "insensitive" } },
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { rollNumber: "asc" },
        include: {
          program: true,
          batch: true,
          currentSemester: true,
          user: { select: { id: true, isActive: true, lastLoginAt: true } },
          enrollments: {
            include: { section: true, semester: true, academicYear: true },
            orderBy: { enrolledAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    return {
      items: students,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async createStudent(
    user: AuthenticatedUser,
    input: z.infer<typeof StudentSchema>
  ) {
    assertAdmin(user);
    const data = StudentSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      // 1. Create User account for authentication
      const initialPassword = data.password || `${data.rollNumber}@Srgc2026`;
      const passwordHash = await hashPassword(initialPassword);

      const authUser = await tx.user.create({
        data: {
          identifier: data.rollNumber,
          email: data.contactEmail,
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
        },
      });

      // 2. Create Student Profile
      const student = await tx.student.create({
        data: {
          userId: authUser.id,
          rollNumber: data.rollNumber,
          regNumber: data.regNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dob: data.dob ? new Date(data.dob) : null,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          programId: data.programId,
          batchId: data.batchId,
          currentSemesterId: data.currentSemesterId,
        },
        include: { program: true, batch: true },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "CREATE_STUDENT",
        entityType: "Student",
        entityId: student.id,
        newValues: student,
      });

      return student;
    });
  }

  // ============================================================================
  // ENROLLMENTS & ASSIGNMENTS
  // ============================================================================
  static async enrollStudent(
    user: AuthenticatedUser,
    input: z.infer<typeof StudentEnrollmentSchema>
  ) {
    assertAdmin(user);
    const data = StudentEnrollmentSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const enrollment = await tx.studentEnrollment.upsert({
        where: {
          studentId_semesterId_academicYearId: {
            studentId: data.studentId,
            semesterId: data.semesterId,
            academicYearId: data.academicYearId,
          },
        },
        create: data,
        update: {
          sectionId: data.sectionId,
          enrollmentStatus: data.enrollmentStatus,
        },
      });

      // Update student's current semester pointer
      await tx.student.update({
        where: { id: data.studentId },
        data: { currentSemesterId: data.semesterId },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "ENROLL_STUDENT",
        entityType: "StudentEnrollment",
        entityId: enrollment.id,
        newValues: enrollment,
      });

      return enrollment;
    });
  }

  static async assignFaculty(
    user: AuthenticatedUser,
    input: z.infer<typeof FacultyAssignmentSchema>
  ) {
    assertAdmin(user);
    const data = FacultyAssignmentSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      // Clash detection: If assigning as PRIMARY, verify no conflicting PRIMARY instructor exists
      if (data.role === AssignmentRole.PRIMARY) {
        const existingPrimary = await tx.facultyAssignment.findFirst({
          where: {
            subjectId: data.subjectId,
            sectionId: data.sectionId,
            semesterId: data.semesterId,
            academicYearId: data.academicYearId,
            role: AssignmentRole.PRIMARY,
            facultyId: { not: data.facultyId },
          },
          include: { faculty: true },
        });

        if (existingPrimary) {
          throw new Error(
            `Assignment conflict: Faculty ${existingPrimary.faculty.firstName} ${existingPrimary.faculty.lastName} (${existingPrimary.faculty.facultyCode}) is already assigned as Primary Instructor for this class.`
          );
        }
      }

      const assignment = await tx.facultyAssignment.upsert({
        where: {
          facultyId_subjectId_sectionId_semesterId_academicYearId: {
            facultyId: data.facultyId,
            subjectId: data.subjectId,
            sectionId: data.sectionId,
            semesterId: data.semesterId,
            academicYearId: data.academicYearId,
          },
        },
        create: data,
        update: { role: data.role },
      });

      await logAuditInTx(tx, {
        userId: user.id,
        action: "ASSIGN_FACULTY",
        entityType: "FacultyAssignment",
        entityId: assignment.id,
        newValues: assignment,
      });

      return assignment;
    });
  }
}
