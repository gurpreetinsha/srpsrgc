import {
  SubjectMarksInput,
  EvaluatedSubjectResult,
  PassingCriteria,
  GradeRule,
  RoundingMode,
} from "./types";
import { getGradeFromPercentage, roundNumber } from "./grades";

export const DEFAULT_PASSING_CRITERIA: PassingCriteria = {
  minInternalPercentage: 40,
  minExternalPercentage: 40,
  minAggregatePercentage: 40,
  allowGraceMarks: false,
  maxGraceMarks: 0,
  maxGraceSubjects: 0,
};

/**
 * Evaluates an individual subject's score against institutional passing criteria.
 */
export function evaluateSubjectMarks(
  input: SubjectMarksInput,
  criteria: PassingCriteria,
  gradingScale: GradeRule[],
  roundingMode: RoundingMode = "HALF_UP",
  roundingDecimals: number = 2
): EvaluatedSubjectResult {
  const maxTotal = input.maxInternalMarks + input.maxExternalMarks;
  const minTotal = input.minInternalMarks + input.minExternalMarks;

  // Handle explicit Withheld
  if (input.isWithheld) {
    return {
      subjectId: input.subjectId,
      subjectCode: input.subjectCode,
      subjectName: input.subjectName,
      credits: input.credits,
      isAuditCourse: !!input.isAuditCourse,
      maxInternalMarks: input.maxInternalMarks,
      minInternalMarks: input.minInternalMarks,
      maxExternalMarks: input.maxExternalMarks,
      minExternalMarks: input.minExternalMarks,
      maxTotalMarks: maxTotal,
      minTotalMarks: minTotal,
      internalMarksObtained: input.internalMarksObtained ?? null,
      externalMarksObtained: input.externalMarksObtained ?? null,
      totalMarksObtained: null,
      percentage: null,
      grade: "WH",
      gradePoint: 0,
      creditPoints: 0,
      status: "WITHHELD",
      remarks: "Marks withheld by administration",
    };
  }

  // Handle explicit Absent
  if (input.isAbsent) {
    return {
      subjectId: input.subjectId,
      subjectCode: input.subjectCode,
      subjectName: input.subjectName,
      credits: input.credits,
      isAuditCourse: !!input.isAuditCourse,
      maxInternalMarks: input.maxInternalMarks,
      minInternalMarks: input.minInternalMarks,
      maxExternalMarks: input.maxExternalMarks,
      minExternalMarks: input.minExternalMarks,
      maxTotalMarks: maxTotal,
      minTotalMarks: minTotal,
      internalMarksObtained: 0,
      externalMarksObtained: 0,
      totalMarksObtained: 0,
      percentage: 0,
      grade: "AB",
      gradePoint: 0,
      creditPoints: 0,
      status: "ABSENT",
      remarks: "Absent for examination",
    };
  }

  // Handle missing marks (incomplete)
  if (
    input.internalMarksObtained === null ||
    input.internalMarksObtained === undefined ||
    input.externalMarksObtained === null ||
    input.externalMarksObtained === undefined
  ) {
    return {
      subjectId: input.subjectId,
      subjectCode: input.subjectCode,
      subjectName: input.subjectName,
      credits: input.credits,
      isAuditCourse: !!input.isAuditCourse,
      maxInternalMarks: input.maxInternalMarks,
      minInternalMarks: input.minInternalMarks,
      maxExternalMarks: input.maxExternalMarks,
      minExternalMarks: input.minExternalMarks,
      maxTotalMarks: maxTotal,
      minTotalMarks: minTotal,
      internalMarksObtained: input.internalMarksObtained ?? null,
      externalMarksObtained: input.externalMarksObtained ?? null,
      totalMarksObtained: null,
      percentage: null,
      grade: "INC",
      gradePoint: 0,
      creditPoints: 0,
      status: "FAIL",
      remarks: "Marks incomplete / missing",
    };
  }

  const internal = Number(input.internalMarksObtained);
  const external = Number(input.externalMarksObtained);
  const total = internal + external;

  // Validation: bounds check
  if (internal < 0 || internal > input.maxInternalMarks) {
    throw new Error(
      `Internal marks ${internal} out of range [0, ${input.maxInternalMarks}] for ${input.subjectCode}`
    );
  }
  if (external < 0 || external > input.maxExternalMarks) {
    throw new Error(
      `External marks ${external} out of range [0, ${input.maxExternalMarks}] for ${input.subjectCode}`
    );
  }

  const internalPct = input.maxInternalMarks > 0 ? (internal / input.maxInternalMarks) * 100 : 100;
  const externalPct = input.maxExternalMarks > 0 ? (external / input.maxExternalMarks) * 100 : 100;
  const aggregatePct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  const passedInternal = internal >= input.minInternalMarks && internalPct >= criteria.minInternalPercentage;
  const passedExternal = external >= input.minExternalMarks && externalPct >= criteria.minExternalPercentage;
  const passedAggregate = total >= minTotal && aggregatePct >= criteria.minAggregatePercentage;

  let isPassed = passedInternal && passedExternal && passedAggregate;
  let graceApplied = 0;
  let remarks: string | undefined;

  // Check Grace Marks if allowed and borderline fail
  if (
    !isPassed &&
    criteria.allowGraceMarks &&
    (criteria.maxGraceMarks ?? 0) > 0
  ) {
    const maxGrace = criteria.maxGraceMarks ?? 0;
    const internalShortage = Math.max(0, input.minInternalMarks - internal);
    const externalShortage = Math.max(0, input.minExternalMarks - external);
    const aggregateShortage = Math.max(0, minTotal - total);

    const neededGrace = Math.max(internalShortage + externalShortage, aggregateShortage);

    if (neededGrace > 0 && neededGrace <= maxGrace) {
      graceApplied = neededGrace;
      isPassed = true;
      remarks = `Passed with ${graceApplied} grace mark(s)`;
    }
  }

  const finalTotal = total + graceApplied;
  const finalPercentage = roundNumber(
    maxTotal > 0 ? (finalTotal / maxTotal) * 100 : 0,
    roundingDecimals,
    roundingMode
  );

  const gradeInfo = getGradeFromPercentage(
    finalPercentage,
    gradingScale,
    roundingMode,
    roundingDecimals
  );

  // If failed criteria, grade must reflect Fail
  const finalGrade = isPassed && !gradeInfo.isFail ? gradeInfo.grade : "F";
  const finalGradePoint = isPassed && !gradeInfo.isFail ? gradeInfo.gradePoint : 0;
  const creditPoints = input.isAuditCourse ? 0 : roundNumber(input.credits * finalGradePoint, 2, roundingMode);

  return {
    subjectId: input.subjectId,
    subjectCode: input.subjectCode,
    subjectName: input.subjectName,
    credits: input.credits,
    isAuditCourse: !!input.isAuditCourse,
    maxInternalMarks: input.maxInternalMarks,
    minInternalMarks: input.minInternalMarks,
    maxExternalMarks: input.maxExternalMarks,
    minExternalMarks: input.minExternalMarks,
    maxTotalMarks: maxTotal,
    minTotalMarks: minTotal,
    internalMarksObtained: internal,
    externalMarksObtained: external,
    totalMarksObtained: finalTotal,
    percentage: finalPercentage,
    grade: finalGrade,
    gradePoint: finalGradePoint,
    creditPoints,
    status: isPassed ? "PASS" : "FAIL",
    graceMarksApplied: graceApplied > 0 ? graceApplied : undefined,
    remarks,
  };
}
