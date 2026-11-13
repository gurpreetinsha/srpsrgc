import { z } from "zod";
import { SubjectType } from "@prisma/client";

export const InstitutionSettingSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required"),
  institutionCode: z.string().min(2, "Institution code is required"),
  tagline: z.string().optional().nullable(),
  logoUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid contact email").optional().nullable().or(z.literal("")),
  contactPhone: z.string().optional().nullable(),
  affiliation: z.string().optional().nullable(),
  currentAcademicSession: z.string().optional().nullable(),
  allowStudentRankView: z.boolean().default(false),
});

export const DepartmentSchema = z.object({
  code: z.string().min(1, "Department code is required").toUpperCase(),
  name: z.string().min(2, "Department name is required"),
  description: z.string().optional().nullable(),
});

export const ProgramSchema = z.object({
  code: z.string().min(1, "Program code is required").toUpperCase(),
  name: z.string().min(2, "Program name is required"),
  departmentId: z.string().uuid("Invalid department ID"),
  durationYears: z.number().int().min(1).max(6),
  totalSemesters: z.number().int().min(1).max(12),
});

export const AcademicYearSchema = z.object({
  name: z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format (e.g. 2025-2026)"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isCurrent: z.boolean().default(false),
});

export const BatchSchema = z.object({
  name: z.string().min(2, "Batch name is required (e.g. 2023-2027)"),
  programId: z.string().uuid("Invalid program ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
});

export const SemesterSchema = z.object({
  programId: z.string().uuid("Invalid program ID"),
  semesterNumber: z.number().int().min(1).max(12),
  title: z.string().min(2, "Semester title is required"),
});

export const SectionSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID"),
  name: z.string().min(1, "Section name is required (e.g. Section A)"),
});

export const SubjectSchema = z.object({
  code: z.string().min(1, "Subject code is required").toUpperCase(),
  name: z.string().min(2, "Subject name is required"),
  type: z.nativeEnum(SubjectType).default(SubjectType.THEORY),
  departmentId: z.string().uuid("Invalid department ID"),
});

export const SubjectCreditSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  programId: z.string().uuid("Invalid program ID"),
  semesterId: z.string().uuid("Invalid semester ID"),
  credits: z.number().min(0, "Credits cannot be negative"),
  maxInternalMarks: z.number().min(0, "Max internal marks must be non-negative"),
  minInternalMarks: z.number().min(0, "Min internal marks must be non-negative"),
  maxExternalMarks: z.number().min(0, "Max external marks must be non-negative"),
  minExternalMarks: z.number().min(0, "Min external marks must be non-negative"),
}).refine(
  (data) => data.minInternalMarks <= data.maxInternalMarks,
  { message: "Min internal marks cannot exceed max internal marks", path: ["minInternalMarks"] }
).refine(
  (data) => data.minExternalMarks <= data.maxExternalMarks,
  { message: "Min external marks cannot exceed max external marks", path: ["minExternalMarks"] }
);

