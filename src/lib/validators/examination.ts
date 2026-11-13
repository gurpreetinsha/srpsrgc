import { z } from "zod";
import { ExamType, ExamStatus } from "@prisma/client";

export const ExaminationSchema = z.object({
  title: z.string().min(2, "Examination title is required"),
  code: z.string().min(2, "Examination code is required (e.g. EXAM-2025-ODD)").toUpperCase(),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  semesterId: z.string().uuid("Invalid semester ID"),
  programId: z.string().uuid("Invalid program ID"),
  examType: z.nativeEnum(ExamType).default(ExamType.REGULAR),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: z.nativeEnum(ExamStatus).default(ExamStatus.UPCOMING),
});

export const ExaminationSubjectSchema = z.object({
  examinationId: z.string().uuid("Invalid examination ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  maxInternalMarks: z.number().min(0),
  minInternalMarks: z.number().min(0),
  maxExternalMarks: z.number().min(0),
  minExternalMarks: z.number().min(0),
}).refine(
  (data) => data.minInternalMarks <= data.maxInternalMarks,
  { message: "Min internal marks cannot exceed max", path: ["minInternalMarks"] }
).refine(
  (data) => data.minExternalMarks <= data.maxExternalMarks,
  { message: "Min external marks cannot exceed max", path: ["minExternalMarks"] }
);

export const MarkEntryRowSchema = z.object({
  examinationEnrollmentId: z.string().uuid("Invalid enrollment ID"),
  internalMarks: z.number().min(0).optional().nullable(),
  externalMarks: z.number().min(0).optional().nullable(),
  isAbsent: z.boolean().optional(),
  isWithheld: z.boolean().optional(),
});

export const BulkMarksEntrySchema = z.object({
  examinationSubjectId: z.string().uuid("Invalid examination subject ID"),
  marks: z.array(MarkEntryRowSchema),
  saveAsDraft: z.boolean().default(true),
});

export const MarkReviewSchema = z.object({
  examinationSubjectId: z.string().uuid("Invalid examination subject ID"),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
}).refine(
  (data) => data.action !== "REJECT" || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: "Rejection reason is required when rejecting submissions", path: ["rejectionReason"] }
);

export const PublishResultSchema = z.object({
  examinationId: z.string().uuid("Invalid examination ID"),
  version: z.number().int().min(1),
  calculationPolicyId: z.string().uuid().optional(),
});

export const UnpublishResultSchema = z.object({
  examinationId: z.string().uuid("Invalid examination ID"),
  unpublishReason: z.string().min(5, "A substantive justification reason is required for unpublishing"),
  version: z.number().int().min(1),
});

export const MarkCorrectionSchema = z.object({
  markId: z.string().uuid("Invalid mark ID"),
  internalMarks: z.number().min(0).optional().nullable(),
  externalMarks: z.number().min(0).optional().nullable(),
  reason: z.string().min(5, "Substantive institutional justification reason is required"),
  version: z.number().int().min(1, "Optimistic concurrency version token is required"),
});
