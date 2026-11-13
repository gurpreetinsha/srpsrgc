import { describe, it, expect } from "vitest";
import {
  evaluateStudentResult,
  evaluateBatchResults,
} from "../../src/lib/calculator/engine";
import {
  roundNumber,
  getGradeFromPercentage,
  DEFAULT_GRADING_SCALE,
} from "../../src/lib/calculator/grades";
import {
  calculateSgpa,
  calculateCgpa,
} from "../../src/lib/calculator/gpa";
import {
  evaluateSubjectMarks,
  DEFAULT_PASSING_CRITERIA,
} from "../../src/lib/calculator/passing";
import {
  CalculationPolicy,
  StudentResultInput,
  SubjectMarksInput,
  SemesterHistoricalResult,
} from "../../src/lib/calculator/types";

const standardPolicy: CalculationPolicy = {
  gradingScale: DEFAULT_GRADING_SCALE,
  passingCriteria: DEFAULT_PASSING_CRITERIA,
  roundingMode: "HALF_UP",
  roundingDecimals: 2,
  percentageMultiplier: 9.5,
  allowRankingWithheld: false,
  allowRankingIncomplete: false,
};

describe("Pure Calculation Engine Unit Tests", () => {
  describe("Rounding Module", () => {
    it("rounds half up correctly to 2 decimals", () => {
      expect(roundNumber(74.444, 2, "HALF_UP")).toBe(74.44);
      expect(roundNumber(74.445, 2, "HALF_UP")).toBe(74.45);
      expect(roundNumber(74.446, 2, "HALF_UP")).toBe(74.45);
    });

    it("truncates correctly when TRUNCATE mode is selected", () => {
      expect(roundNumber(74.449, 2, "TRUNCATE")).toBe(74.44);
      expect(roundNumber(89.999, 1, "TRUNCATE")).toBe(89.9);
    });

    it("handles edge numbers (0, NaN, Infinity)", () => {
      expect(roundNumber(0, 2)).toBe(0);
      expect(roundNumber(NaN, 2)).toBe(0);
      expect(roundNumber(Infinity, 2)).toBe(0);
    });
  });

  describe("Grade Allocation Module", () => {
    it("allocates Outstanding (O) for 95%", () => {
      const res = getGradeFromPercentage(95, DEFAULT_GRADING_SCALE);
      expect(res.grade).toBe("O");
      expect(res.gradePoint).toBe(10.0);
      expect(res.isFail).toBe(false);
    });

    it("allocates Fail (F) for 35%", () => {
      const res = getGradeFromPercentage(35, DEFAULT_GRADING_SCALE);
      expect(res.grade).toBe("F");
      expect(res.gradePoint).toBe(0.0);
      expect(res.isFail).toBe(true);
    });

    it("allocates Pass (P) for exact 40% threshold", () => {
      const res = getGradeFromPercentage(40.0, DEFAULT_GRADING_SCALE);
      expect(res.grade).toBe("P");
      expect(res.gradePoint).toBe(4.0);
      expect(res.isFail).toBe(false);
    });
  });

  describe("Subject Passing Evaluation", () => {
    const subjectA: SubjectMarksInput = {
      subjectId: "sub-1",
      subjectCode: "CS101",
      subjectName: "Programming in C",
      credits: 4,
      maxInternalMarks: 30,
      minInternalMarks: 12,
      maxExternalMarks: 70,
      minExternalMarks: 28,
      internalMarksObtained: 25,
      externalMarksObtained: 60,
    };

    it("passes a subject with high marks", () => {
      const res = evaluateSubjectMarks(
        subjectA,
        DEFAULT_PASSING_CRITERIA,
        DEFAULT_GRADING_SCALE
      );
      expect(res.status).toBe("PASS");
      expect(res.totalMarksObtained).toBe(85);
      expect(res.percentage).toBe(85.0);
      expect(res.grade).toBe("A+");
      expect(res.gradePoint).toBe(9.0);
      expect(res.creditPoints).toBe(36.0); // 4 * 9
    });

    it("fails when internal marks are below threshold", () => {
      const res = evaluateSubjectMarks(
        { ...subjectA, internalMarksObtained: 10 }, // 10 < 12
        DEFAULT_PASSING_CRITERIA,
        DEFAULT_GRADING_SCALE
      );
      expect(res.status).toBe("FAIL");
      expect(res.grade).toBe("F");
      expect(res.gradePoint).toBe(0);
      expect(res.creditPoints).toBe(0);
    });

    it("fails when external marks are below threshold", () => {
      const res = evaluateSubjectMarks(
        { ...subjectA, externalMarksObtained: 20 }, // 20 < 28
        DEFAULT_PASSING_CRITERIA,
        DEFAULT_GRADING_SCALE
      );
      expect(res.status).toBe("FAIL");
      expect(res.grade).toBe("F");
      expect(res.gradePoint).toBe(0);
    });

    it("throws error for out of bounds marks", () => {
      expect(() =>
        evaluateSubjectMarks(
          { ...subjectA, internalMarksObtained: 35 }, // 35 > 30 max
          DEFAULT_PASSING_CRITERIA,
          DEFAULT_GRADING_SCALE
        )
      ).toThrow("out of range");

      expect(() =>
        evaluateSubjectMarks(
          { ...subjectA, externalMarksObtained: -5 }, // negative
          DEFAULT_PASSING_CRITERIA,
          DEFAULT_GRADING_SCALE
        )
      ).toThrow("out of range");
    });

    it("handles zero marks correctly as a valid score resulting in fail", () => {
      const res = evaluateSubjectMarks(
        { ...subjectA, internalMarksObtained: 0, externalMarksObtained: 0 },
        DEFAULT_PASSING_CRITERIA,
        DEFAULT_GRADING_SCALE
      );
      expect(res.status).toBe("FAIL");
      expect(res.totalMarksObtained).toBe(0);
      expect(res.percentage).toBe(0);
      expect(res.grade).toBe("F");
    });

    it("handles absent student", () => {
      const res = evaluateSubjectMarks(
        { ...subjectA, isAbsent: true },
        DEFAULT_PASSING_CRITERIA,
        DEFAULT_GRADING_SCALE
      );
      expect(res.status).toBe("ABSENT");
      expect(res.grade).toBe("AB");
      expect(res.gradePoint).toBe(0);
    });

    it("handles withheld subject", () => {
      const res = evaluateSubjectMarks(
        { ...subjectA, isWithheld: true },
        DEFAULT_PASSING_CRITERIA,
        DEFAULT_GRADING_SCALE
      );
      expect(res.status).toBe("WITHHELD");
      expect(res.grade).toBe("WH");
      expect(res.totalMarksObtained).toBeNull();
    });

    it("applies grace marks when enabled and borderline fail", () => {
      const gracePolicy = {
        ...DEFAULT_PASSING_CRITERIA,
        allowGraceMarks: true,
        maxGraceMarks: 3,
      };
      // Internal: 12/30 (pass), External: 26/70 (fail, min is 28, total 38, min total 40)
      const borderline: SubjectMarksInput = {
        ...subjectA,
        internalMarksObtained: 12,
        externalMarksObtained: 26,
      };
      const res = evaluateSubjectMarks(borderline, gracePolicy, DEFAULT_GRADING_SCALE);
      expect(res.status).toBe("PASS");
      expect(res.graceMarksApplied).toBe(2);
      expect(res.totalMarksObtained).toBe(40);
    });
  });

  describe("SGPA and CGPA Calculations", () => {
    it("computes weighted SGPA with differing credits", () => {
      const subjects = [
        {
          subjectId: "1",
          subjectCode: "SUB1",
          credits: 4,
          isAuditCourse: false,
          maxInternalMarks: 50,
          minInternalMarks: 20,
          maxExternalMarks: 50,
          minExternalMarks: 20,
          maxTotalMarks: 100,
          minTotalMarks: 40,
          internalMarksObtained: 40,
          externalMarksObtained: 40,
          totalMarksObtained: 80,
          percentage: 80,
          grade: "A+",
          gradePoint: 9.0,
          creditPoints: 36.0, // 4 * 9
          status: "PASS" as const,
        },
        {
          subjectId: "2",
          subjectCode: "SUB2",
          credits: 2,
          isAuditCourse: false,
          maxInternalMarks: 50,
          minInternalMarks: 20,
          maxExternalMarks: 50,
          minExternalMarks: 20,
          maxTotalMarks: 100,
          minTotalMarks: 40,
          internalMarksObtained: 35,
          externalMarksObtained: 35,
          totalMarksObtained: 70,
          percentage: 70,
          grade: "A",
          gradePoint: 8.0,
          creditPoints: 16.0, // 2 * 8
          status: "PASS" as const,
        },
      ];

      // Total credits: 6, Total points: 52, SGPA: 52/6 = 8.6666... -> 8.67
      const sgpaRes = calculateSgpa(subjects, "HALF_UP", 2);
      expect(sgpaRes.totalCreditsOffered).toBe(6);
      expect(sgpaRes.totalCreditsEarned).toBe(6);
      expect(sgpaRes.sgpa).toBe(8.67);
    });

    it("ignores non-credit audit courses in SGPA denominator", () => {
      const subjects = [
        {
          subjectId: "1",
          subjectCode: "SUB1",
          credits: 4,
          isAuditCourse: false,
          maxInternalMarks: 50,
          minInternalMarks: 20,
          maxExternalMarks: 50,
          minExternalMarks: 20,
          maxTotalMarks: 100,
          minTotalMarks: 40,
          internalMarksObtained: 45,
          externalMarksObtained: 45,
          totalMarksObtained: 90,
          percentage: 90,
          grade: "O",
          gradePoint: 10.0,
          creditPoints: 40.0,
          status: "PASS" as const,
        },
        {
          subjectId: "2",
          subjectCode: "AUDIT1",
          credits: 0,
          isAuditCourse: true, // Audit course
          maxInternalMarks: 50,
          minInternalMarks: 20,
          maxExternalMarks: 50,
          minExternalMarks: 20,
          maxTotalMarks: 100,
          minTotalMarks: 40,
          internalMarksObtained: 40,
          externalMarksObtained: 40,
          totalMarksObtained: 80,
          percentage: 80,
          grade: "A+",
          gradePoint: 9.0,
          creditPoints: 0,
          status: "PASS" as const,
        },
      ];

      const sgpaRes = calculateSgpa(subjects, "HALF_UP", 2);
      expect(sgpaRes.totalCreditsOffered).toBe(4);
      expect(sgpaRes.sgpa).toBe(10.0);
    });

    it("computes cumulative CGPA and equivalent percentage correctly", () => {
      const semesters: SemesterHistoricalResult[] = [
        { semesterNumber: 1, creditsOffered: 20, creditsEarned: 20, sgpa: 8.0 },
        { semesterNumber: 2, creditsOffered: 20, creditsEarned: 20, sgpa: 8.5 },
      ];
      // Total points = (20 * 8.0) + (20 * 8.5) = 160 + 170 = 330. CGPA = 330 / 40 = 8.25.
      // Equiv % = 8.25 * 9.5 = 78.375 -> 78.38
      const cgpaRes = calculateCgpa(semesters, standardPolicy);
      expect(cgpaRes.cumulativeCreditsOffered).toBe(40);
      expect(cgpaRes.cumulativeCreditsEarned).toBe(40);
      expect(cgpaRes.cgpa).toBe(8.25);
      expect(cgpaRes.equivalentPercentage).toBe(78.38);
    });
  });

  describe("Student Result Evaluation & Ranking", () => {
    const student1: StudentResultInput = {
      studentId: "s1",
      rollNumber: "230101",
      regNumber: "REG001",
      studentName: "Aarav Sharma",
      subjects: [
        {
          subjectId: "sub1",
          subjectCode: "CS101",
          credits: 4,
          maxInternalMarks: 30,
          minInternalMarks: 12,
          maxExternalMarks: 70,
          minExternalMarks: 28,
          internalMarksObtained: 28,
          externalMarksObtained: 65,
        },
      ],
    };

    const student2: StudentResultInput = {
      studentId: "s2",
      rollNumber: "230102",
      regNumber: "REG002",
      studentName: "Bhavna Patel",
      subjects: [
        {
          subjectId: "sub1",
          subjectCode: "CS101",
          credits: 4,
          maxInternalMarks: 30,
          minInternalMarks: 12,
          maxExternalMarks: 70,
          minExternalMarks: 28,
          internalMarksObtained: 20,
          externalMarksObtained: 40,
        },
      ],
    };

    const studentWithheld: StudentResultInput = {
      studentId: "s3",
      rollNumber: "230103",
      regNumber: "REG003",
      studentName: "Chetan Kumar",
      isWithheld: true,
      withheldReason: "Attendance shortage",
      subjects: [
        {
          subjectId: "sub1",
          subjectCode: "CS101",
          credits: 4,
          maxInternalMarks: 30,
          minInternalMarks: 12,
          maxExternalMarks: 70,
          minExternalMarks: 28,
          internalMarksObtained: 25,
          externalMarksObtained: 55,
        },
      ],
    };

    it("evaluates a student and marks PASS when all criteria met", () => {
      const res = evaluateStudentResult(student1, standardPolicy);
      expect(res.status).toBe("PASS");
      expect(res.sgpa).toBe(10.0);
      expect(res.backlogSubjectCodes.length).toBe(0);
      expect(res.isEligibleForPromotion).toBe(true);
    });

    it("evaluates a withheld student without giving PASS or SGPA", () => {
      const res = evaluateStudentResult(studentWithheld, standardPolicy);
      expect(res.status).toBe("WITHHELD");
      expect(res.sgpa).toBeNull();
      expect(res.isEligibleForPromotion).toBe(false);
      expect(res.statusRemarks).toBe("Attendance shortage");
    });

    it("ranks students deterministically and excludes withheld students", () => {
      const batch = [student2, studentWithheld, student1];
      const ranked = evaluateBatchResults(batch, standardPolicy);

      // Student 1 has higher score -> Rank 1
      const s1Ranked = ranked.find((r) => r.studentId === "s1");
      expect(s1Ranked?.rank).toBe(1);

      // Student 2 has lower score -> Rank 2
      const s2Ranked = ranked.find((r) => r.studentId === "s2");
      expect(s2Ranked?.rank).toBe(2);

      // Withheld student has null rank per policy
      const s3Ranked = ranked.find((r) => r.studentId === "s3");
      expect(s3Ranked?.rank).toBeNull();
    });

    it("handles ranking ties with equal rank and preserves deterministic order", () => {
      const studentTie: StudentResultInput = {
        studentId: "s4",
        rollNumber: "230104",
        regNumber: "REG004",
        studentName: "Divya Verma",
        subjects: [
          {
            subjectId: "sub1",
            subjectCode: "CS101",
            credits: 4,
            maxInternalMarks: 30,
            minInternalMarks: 12,
            maxExternalMarks: 70,
            minExternalMarks: 28,
            internalMarksObtained: 28,
            externalMarksObtained: 65, // exactly matches student1
          },
        ],
      };

      const ranked = evaluateBatchResults([studentTie, student1], standardPolicy);
      expect(ranked[0]?.rank).toBe(1);
      expect(ranked[1]?.rank).toBe(1); // Tie at Rank 1
    });
  });
});

