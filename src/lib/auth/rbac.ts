import { Role } from "@prisma/client";
import { AuthenticatedUser } from "./session";
import { prisma } from "../db/prisma";

export class AuthError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = "Access denied: insufficient permissions") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

/**
 * Asserts that the authenticated user possesses the ADMIN role.
 */
export function assertAdmin(user: AuthenticatedUser): void {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenError("This operation requires administrative privileges");
  }
}

/**
 * Asserts that the authenticated user possesses the FACULTY role.
 */
export function assertFaculty(user: AuthenticatedUser): void {
  if (user.role !== Role.FACULTY) {
    throw new ForbiddenError("This operation requires faculty privileges");
  }
  if (!user.facultyId) {
    throw new ForbiddenError("Faculty profile not associated with this account");
  }
}

/**
 * Asserts that the authenticated user possesses the STUDENT role.
 */
export function assertStudent(user: AuthenticatedUser): void {
  if (user.role !== Role.STUDENT) {
    throw new ForbiddenError("This operation requires student privileges");
  }
  if (!user.studentId) {
    throw new ForbiddenError("Student profile not associated with this account");
  }
}

/**
 * Asserts that the faculty member is officially assigned to teach the given subject/section/semester.
 */
export async function assertFacultyAssignment(
  user: AuthenticatedUser,
  params: {
    subjectId: string;
    sectionId: string;
    semesterId: string;
    academicYearId?: string;
  }
): Promise<void> {
  // Administrators bypass faculty assignment scope
  if (user.role === Role.ADMIN) {
    return;
  }

  assertFaculty(user);

  const whereClause: {
    facultyId: string;
    subjectId: string;
    sectionId: string;
    semesterId: string;
    academicYearId?: string;
  } = {
    facultyId: user.facultyId!,
    subjectId: params.subjectId,
    sectionId: params.sectionId,
    semesterId: params.semesterId,
  };

  if (params.academicYearId) {
    whereClause.academicYearId = params.academicYearId;
  }

  const assignment = await prisma.facultyAssignment.findFirst({
    where: whereClause,
  });

  if (!assignment) {
    throw new ForbiddenError(
      "You are not assigned to instruct this subject for the specified section and semester"
    );
  }
}

/**
 * Asserts that a student can only access their own profile or results.
 */
export function assertStudentOwnership(
  user: AuthenticatedUser,
  requestedStudentId: string
): void {
  // Administrators and Faculty (within assignment) can view student profiles
  if (user.role === Role.ADMIN) {
    return;
  }

  if (user.role === Role.STUDENT) {
    if (user.studentId !== requestedStudentId) {
      throw new ForbiddenError("Access denied: You may only view your own records");
    }
    return;
  }

  throw new ForbiddenError("Unauthorized access to student record");
}

/**
 * Enforces result visibility rules:
 * - Admin: can view all marks/results regardless of publication status.
 * - Faculty: can view marks they entered or are assigned to review.
 * - Student: can ONLY view PUBLISHED results for their own studentId.
 */
export function assertResultAccess(
  user: AuthenticatedUser,
  result: {
    studentId: string;
    publicationStatus: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  }
): void {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (user.role === Role.STUDENT) {
    if (user.studentId !== result.studentId) {
      throw new ForbiddenError("Access denied: You may only view your own results");
    }
    if (result.publicationStatus !== "PUBLISHED") {
      throw new ForbiddenError("This examination result has not yet been officially published");
    }
    return;
  }

  // Faculty cannot view student's full cross-subject semester card unless explicitly permitted
  throw new ForbiddenError("Insufficient permissions to access this result card");
}

