import { EvaluatedStudentResult, RankedStudentResult, CalculationPolicy } from "./types";

/**
 * Assigns dense ranks to evaluated student results based on academic performance.
 * Students with WITHHELD or INCOMPLETE status are excluded from ranking unless policy explicitly allows.
 */
export function rankStudents(
  students: EvaluatedStudentResult[],
  policy: CalculationPolicy
): RankedStudentResult[] {
  // Segregate eligible vs ineligible students
  const eligible: EvaluatedStudentResult[] = [];
  const ineligible: EvaluatedStudentResult[] = [];

  for (const s of students) {
    const isWithheldOrIncomplete = s.status === "WITHHELD" || s.status === "INCOMPLETE";
    const allowRank =
      (!isWithheldOrIncomplete) ||
      (s.status === "WITHHELD" && policy.allowRankingWithheld) ||
      (s.status === "INCOMPLETE" && policy.allowRankingIncomplete);

    if (allowRank) {
      eligible.push(s);
    } else {
      ineligible.push(s);
    }
  }

  // Sort eligible students descending:
  // 1. SGPA (higher is better)
  // 2. Overall Percentage (higher is better)
  // 3. Total marks obtained (higher is better)
  // 4. Roll Number / Reg Number (deterministic tie-breaking order)
  eligible.sort((a, b) => {
    const aSgpa = a.sgpa ?? -1;
    const bSgpa = b.sgpa ?? -1;
    if (bSgpa !== aSgpa) return bSgpa - aSgpa;

    if (b.overallPercentage !== a.overallPercentage) {
      return b.overallPercentage - a.overallPercentage;
    }

    if (b.totalMarksObtained !== a.totalMarksObtained) {
      return b.totalMarksObtained - a.totalMarksObtained;
    }

    return a.rollNumber.localeCompare(b.rollNumber);
  });

  // Assign dense ranks (e.g., 1, 2, 2, 3...)
  const rankedEligible: RankedStudentResult[] = [];
  let currentRank = 1;

  for (let i = 0; i < eligible.length; i++) {
    const current = eligible[i]!;

    if (i > 0) {
      const prev = eligible[i - 1]!;
      const isTie =
        current.sgpa === prev.sgpa &&
        current.overallPercentage === prev.overallPercentage &&
        current.totalMarksObtained === prev.totalMarksObtained;

      if (!isTie) {
        currentRank = i + 1; // Standard competition rank (1, 2, 2, 4) or dense rank (i + 1)
      }
    }

    rankedEligible.push({
      ...current,
      rank: currentRank,
    });
  }

  // Ineligible students receive null rank
  const rankedIneligible: RankedStudentResult[] = ineligible.map((s) => ({
    ...s,
    rank: null,
  }));

  return [...rankedEligible, ...rankedIneligible];
}

