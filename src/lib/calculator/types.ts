/**
 * SRGC Student Result Management System - Calculation Engine Types
 * Pure, deterministic, zero external database/framework dependencies.
 */

export type ResultStatus =
  | "PASS"
  | "FAIL"
  | "WITHHELD"
  | "INCOMPLETE"
  | "ABSENT"
  | "DETAINED";

export type SubjectResultStatus =
  | "PASS"
  | "FAIL"
  | "WITHHELD"
  | "ABSENT"
  | "EXEMPT";

export type RoundingMode = "HALF_UP" | "TRUNCATE";

export interface GradeRule {
  grade: string;
  gradePoint: number;
  minPercentage: number;
  maxPercentage: number;
  isFail?: boolean;
  description?: string;
}

export interface PassingCriteria {
  minInternalPercentage: number;
  minExternalPercentage: number;
  minAggregatePercentage: number;
  allowGraceMarks?: boolean;
  maxGraceMarks?: number;
  maxGraceSubjects?: number;
}

export interface CalculationPolicy {
  gradingScale: GradeRule[];
  passingCriteria: PassingCriteria;
  roundingMode: RoundingMode;
  roundingDecimals: number;
  percentageMultiplier?: number; // e.g. 9.5 or 10.0 for CGPA to %
  allowRankingWithheld?: boolean;
  allowRankingIncomplete?: boolean;
}

export interface SubjectMarksInput {
  subjectId: string;
  subjectCode: string;
  subjectName?: string;
  credits: number;
  maxInternalMarks: number;
  minInternalMarks: number;
  maxExternalMarks: number;
  minExternalMarks: number;
  internalMarksObtained?: number | null;
  externalMarksObtained?: number | null;
  isElective?: boolean;
  isAuditCourse?: boolean; // non-credit course
  isWithheld?: boolean;
  isAbsent?: boolean;
}

export interface EvaluatedSubjectResult {
  subjectId: string;
  subjectCode: string;
  subjectName?: string;
  credits: number;
  isAuditCourse: boolean;
  maxInternalMarks: number;
  minInternalMarks: number;
  maxExternalMarks: number;
  minExternalMarks: number;
  maxTotalMarks: number;
  minTotalMarks: number;
  internalMarksObtained: number | null;
  externalMarksObtained: number | null;
  totalMarksObtained: number | null;
  percentage: number | null;
  grade: string;
  gradePoint: number;
  creditPoints: number; // credits * gradePoint
  status: SubjectResultStatus;
  graceMarksApplied?: number;
  remarks?: string;
}

export interface StudentResultInput {
  studentId: string;
  rollNumber: string;
  regNumber: string;
  studentName: string;
  subjects: SubjectMarksInput[];
  isWithheld?: boolean;
  withheldReason?: string;
}

export interface EvaluatedStudentResult {
  studentId: string;
  rollNumber: string;
  regNumber: string;
  studentName: string;
  subjects: EvaluatedSubjectResult[];
  totalCreditsOffered: number;
  totalCreditsEarned: number;
  totalMaxMarks: number;
  totalMarksObtained: number;
  overallPercentage: number;
  sgpa: number | null;
  status: ResultStatus;
  statusRemarks?: string;
  isEligibleForPromotion: boolean;
  backlogSubjectCodes: string[];
}

export interface RankedStudentResult extends EvaluatedStudentResult {
  rank: number | null; // null if withheld/incomplete unless policy allows
}

export interface SemesterHistoricalResult {
  semesterNumber: number;
  creditsOffered: number;
  creditsEarned: number;
  sgpa: number;
}

export interface CgpaCalculationInput {
  semesters: SemesterHistoricalResult[];
  policy: CalculationPolicy;
}

export interface CgpaCalculationResult {
  cumulativeCreditsOffered: number;
  cumulativeCreditsEarned: number;
  cgpa: number | null;
  equivalentPercentage: number | null;
}
