import { GradeRule, RoundingMode } from "./types";

/**
 * Rounds a number to a specified number of decimal places according to the rounding mode.
 */
export function roundNumber(
  val: number,
  decimals: number,
  mode: RoundingMode = "HALF_UP"
): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  if (mode === "TRUNCATE") {
    const factor = Math.pow(10, decimals);
    return Math.trunc(val * factor) / factor;
  }
  // Decimal exponential rounding avoiding IEEE 754 precision quirks
  return Number(Math.round(Number(val + "e" + decimals)) + "e-" + decimals);
}

/**
 * Default SRGC / UGC 10-point Letter Grading Scale
 */
export const DEFAULT_GRADING_SCALE: GradeRule[] = [
  { grade: "O", gradePoint: 10.0, minPercentage: 90, maxPercentage: 100, description: "Outstanding" },
  { grade: "A+", gradePoint: 9.0, minPercentage: 80, maxPercentage: 89.99, description: "Excellent" },
  { grade: "A", gradePoint: 8.0, minPercentage: 70, maxPercentage: 79.99, description: "Very Good" },
  { grade: "B+", gradePoint: 7.0, minPercentage: 60, maxPercentage: 69.99, description: "Good" },
  { grade: "B", gradePoint: 6.0, minPercentage: 50, maxPercentage: 59.99, description: "Above Average" },
  { grade: "C", gradePoint: 5.0, minPercentage: 45, maxPercentage: 49.99, description: "Average" },
  { grade: "P", gradePoint: 4.0, minPercentage: 40, maxPercentage: 44.99, description: "Pass" },
  { grade: "F", gradePoint: 0.0, minPercentage: 0, maxPercentage: 39.99, isFail: true, description: "Fail" },
];

/**
 * Evaluates the letter grade and grade point corresponding to an earned percentage.
 */
export function getGradeFromPercentage(
  percentage: number,
  gradingScale: GradeRule[],
  roundingMode: RoundingMode = "HALF_UP",
  roundingDecimals: number = 2
): { grade: string; gradePoint: number; isFail: boolean } {
  const roundedPct = roundNumber(percentage, roundingDecimals, roundingMode);

  // Normalize and sort scale descending by minPercentage
  const sortedScale = [...gradingScale].sort((a, b) => b.minPercentage - a.minPercentage);

  for (const rule of sortedScale) {
    // Check if percentage falls within range (allowing small epsilon for upper bound if 100)
    if (roundedPct >= rule.minPercentage) {
      return {
        grade: rule.grade,
        gradePoint: rule.gradePoint,
        isFail: !!rule.isFail,
      };
    }
  }

  // Fallback to lowest rule or default Fail
  const lowest = sortedScale[sortedScale.length - 1];
  return {
    grade: lowest ? lowest.grade : "F",
    gradePoint: lowest ? lowest.gradePoint : 0,
    isFail: true,
  };
}
