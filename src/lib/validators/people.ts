import { z } from "zod";
import { EnrollmentStatus, AssignmentRole } from "@prisma/client";

export const FacultySchema = z.object({
  facultyCode: z.string().min(2, "Faculty code is required (e.g. FAC001)").toUpperCase(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  designation: z.string().min(2, "Designation is required (e.g. Assistant Professor)"),
  departmentId: z.string().uuid("Invalid department ID"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const StudentSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required").toUpperCase(),
  regNumber: z.string().min(1, "Registration number is required").toUpperCase(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  dob: z.string().or(z.date()).optional().nullable(),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional().nullable(),
  programId: z.string().uuid("Invalid program ID"),
  batchId: z.string().uuid("Invalid batch ID"),
  currentSemesterId: z.string().uuid("Invalid semester ID").optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const StudentEnrollmentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  batchId: z.string().uuid("Invalid batch ID"),
  semesterId: z.string().uuid("Invalid semester ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  enrollmentStatus: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ACTIVE),
});

export const FacultyAssignmentSchema = z.object({
  facultyId: z.string().uuid("Invalid faculty ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  semesterId: z.string().uuid("Invalid semester ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  role: z.nativeEnum(AssignmentRole).default(AssignmentRole.PRIMARY),
});

