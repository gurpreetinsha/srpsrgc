import {
  EvaluatedSubjectResult,
  RoundingMode,
  SemesterHistoricalResult,
  CgpaCalculationResult,
  CalculationPolicy,
} from "./types";
import { roundNumber } from "./grades";

/**
 * Calculates Semester Grade Point Average (SGPA) from evaluated subject results.
 * Ignores audit/non-credit courses.
 */
export function calculateSgpa(
  subjects: EvaluatedSubjectResult[],
  roundingMode: RoundingMode = "HALF_UP",
  roundingDecimals: number = 2
): {
  sgpa: number | null;
  totalCreditsOffered: number;
  totalCreditsEarned: number;
} {
  let totalCreditsOffered = 0;
  let totalCreditsEarned = 0;
  let totalWeightedCreditPoints = 0;

  for (const sub of subjects) {
    if (sub.isAuditCourse) {
      continue;
    }

    totalCreditsOffered += sub.credits;

    if (sub.status === "PASS") {
      totalCreditsEarned += sub.credits;
    }

    totalWeightedCreditPoints += sub.creditPoints;
  }

  if (totalCreditsOffered === 0) {
    return {
      sgpa: null,
      totalCreditsOffered: 0,
      totalCreditsEarned: 0,
    };
  }

  const rawSgpa = totalWeightedCreditPoints / totalCreditsOffered;
  const sgpa = roundNumber(rawSgpa, roundingDecimals, roundingMode);

  return {
    sgpa,
    totalCreditsOffered,
    totalCreditsEarned,
  };
}

/**
 * Calculates Cumulative Grade Point Average (CGPA) across completed semesters.
 */
export function calculateCgpa(
  semesters: SemesterHistoricalResult[],
  policy: CalculationPolicy
): CgpaCalculationResult {
  let cumulativeCreditsOffered = 0;
  let cumulativeCreditsEarned = 0;
  let cumulativeWeightedPoints = 0;

  for (const sem of semesters) {
    cumulativeCreditsOffered += sem.creditsOffered;
    cumulativeCreditsEarned += sem.creditsEarned;
    cumulativeWeightedPoints += sem.creditsOffered * sem.sgpa;
  }

  if (cumulativeCreditsOffered === 0) {
    return {
      cumulativeCreditsOffered: 0,
      cumulativeCreditsEarned: 0,
      cgpa: null,
      equivalentPercentage: null,
    };
  }

  const rawCgpa = cumulativeWeightedPoints / cumulativeCreditsOffered;
  const cgpa = roundNumber(rawCgpa, policy.roundingDecimals, policy.roundingMode);

  const multiplier = policy.percentageMultiplier ?? 9.5;
  const rawPct = (cgpa ?? 0) * multiplier;
  const equivalentPercentage = roundNumber(rawPct, policy.roundingDecimals, policy.roundingMode);

  return {
    cumulativeCreditsOffered,
    cumulativeCreditsEarned,
    cgpa,
    equivalentPercentage,
  };
}
