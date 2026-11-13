import {
  StudentResultInput,
  EvaluatedStudentResult,
  RankedStudentResult,
  CalculationPolicy,
  ResultStatus,
} from "./types";
import { evaluateSubjectMarks } from "./passing";
import { calculateSgpa } from "./gpa";
import { roundNumber } from "./grades";
import { rankStudents } from "./ranking";

/**
 * Pure Calculation Engine for evaluating an individual student's examination results.
 */
export function evaluateStudentResult(
  input: StudentResultInput,
  policy: CalculationPolicy
): EvaluatedStudentResult {
  // Check if entire student result is withheld
  if (input.isWithheld) {
    const evaluatedSubjects = input.subjects.map((sub) =>
      evaluateSubjectMarks(
        { ...sub, isWithheld: true },
        policy.passingCriteria,
        policy.gradingScale,
        policy.roundingMode,
        policy.roundingDecimals
      )
    );

    return {
      studentId: input.studentId,
      rollNumber: input.rollNumber,
      regNumber: input.regNumber,
      studentName: input.studentName,
      subjects: evaluatedSubjects,
      totalCreditsOffered: 0,
      totalCreditsEarned: 0,
      totalMaxMarks: 0,
      totalMarksObtained: 0,
      overallPercentage: 0,
      sgpa: null,
      status: "WITHHELD",
      statusRemarks: input.withheldReason || "Result withheld by administration",
      isEligibleForPromotion: false,
      backlogSubjectCodes: [],
    };
  }

  // Evaluate each subject
  const evaluatedSubjects = input.subjects.map((sub) =>
    evaluateSubjectMarks(
      sub,
      policy.passingCriteria,
      policy.gradingScale,
      policy.roundingMode,
      policy.roundingDecimals
    )
  );

  let totalMaxMarks = 0;
  let totalMarksObtained = 0;
  let hasIncomplete = false;
  let hasWithheldSubject = false;
  let hasFail = false;
  const backlogSubjectCodes: string[] = [];

  for (const evaluated of evaluatedSubjects) {
    if (evaluated.status === "WITHHELD") {
      hasWithheldSubject = true;
    } else if (evaluated.totalMarksObtained === null) {
      hasIncomplete = true;
    } else {
      totalMaxMarks += evaluated.maxTotalMarks;
      totalMarksObtained += evaluated.totalMarksObtained;
    }

    if (evaluated.status === "FAIL" || evaluated.status === "ABSENT") {
      hasFail = true;
      backlogSubjectCodes.push(evaluated.subjectCode);
    }
  }

  const { sgpa, totalCreditsOffered, totalCreditsEarned } = calculateSgpa(
    evaluatedSubjects,
    policy.roundingMode,
    policy.roundingDecimals
  );

  const rawPct = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
  const overallPercentage = roundNumber(rawPct, policy.roundingDecimals, policy.roundingMode);

  // Determine overall result status
  let status: ResultStatus;
  let statusRemarks: string | undefined;

  if (hasWithheldSubject) {
    status = "WITHHELD";
    statusRemarks = "One or more subject marks are withheld";
  } else if (hasIncomplete) {
    status = "INCOMPLETE";
    statusRemarks = "Examination marks are incomplete or missing";
  } else if (hasFail) {
    status = "FAIL";
    statusRemarks = `Failed in ${backlogSubjectCodes.length} subject(s)`;
  } else {
    status = "PASS";
    statusRemarks = "Passed successfully";
  }

  // Promotion criteria: Max allowed backlogs can be configurable; default is 0 for clear pass
  const isEligibleForPromotion = status === "PASS" || backlogSubjectCodes.length <= 4;

  return {
    studentId: input.studentId,
    rollNumber: input.rollNumber,
    regNumber: input.regNumber,
    studentName: input.studentName,
    subjects: evaluatedSubjects,
    totalCreditsOffered,
    totalCreditsEarned,
    totalMaxMarks,
    totalMarksObtained,
    overallPercentage,
    sgpa: status === "WITHHELD" || status === "INCOMPLETE" ? null : sgpa,
    status,
    statusRemarks,
    isEligibleForPromotion,
    backlogSubjectCodes,
  };
}

/**
 * Pure Calculation Engine coordinator for evaluating and ranking an entire batch or section of students.
 */
export function evaluateBatchResults(
  students: StudentResultInput[],
  policy: CalculationPolicy
): RankedStudentResult[] {
  const evaluated = students.map((s) => evaluateStudentResult(s, policy));
  return rankStudents(evaluated, policy);
}

