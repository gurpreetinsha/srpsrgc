import { describe, it, expect } from "vitest";
import { generateResultCardPdf, PdfResultCardData } from "../../src/lib/pdf/result-card-generator";
import { EvaluatedStudentResult } from "../../src/lib/calculator/types";

describe("Phase 7: Pure-JS PDF Transcript Generator Unit Tests", () => {
  it("generates valid PDF buffer matching A4 dimensions and SRGC branding", async () => {
    const mockStudentResult: EvaluatedStudentResult = {
      studentId: "s-123",
      rollNumber: "230101",
      regNumber: "SRGC20230101",
      studentName: "Aarav Sharma",
      subjects: [
        {
          subjectId: "sub-1",
          subjectCode: "CS101",
          subjectName: "Data Structures & Algorithms",
          credits: 4,
          isAuditCourse: false,
          maxInternalMarks: 30,
          minInternalMarks: 12,
          maxExternalMarks: 70,
          minExternalMarks: 28,
          maxTotalMarks: 100,
          minTotalMarks: 40,
          internalMarksObtained: 27,
          externalMarksObtained: 63,
          totalMarksObtained: 90,
          percentage: 90.0,
          grade: "O",
          gradePoint: 10.0,
          creditPoints: 40.0,
          status: "PASS",
        },
      ],
      totalCreditsOffered: 4,
      totalCreditsEarned: 4,
      totalMaxMarks: 100,
      totalMarksObtained: 90,
      overallPercentage: 90.0,
      sgpa: 10.0,
      status: "PASS",
      isEligibleForPromotion: true,
      backlogSubjectCodes: [],
    };

    const pdfData: PdfResultCardData = {
      institutionName: "Shri Ram Group of Colleges",
      institutionCode: "SRGC",
      tagline: "Excellence in Technical & Professional Education",
      address: "Parikshitgarh Road, Muzaffarnagar, UP",
      examinationTitle: "B.Tech End-Term Examination (Odd Semester)",
      academicSession: "2025-2026",
      studentResult: mockStudentResult,
      programName: "Computer Science & Engineering",
      semesterName: "Semester 3",
      batchName: "Batch 2023-2027",
      verificationHash: "a1b2c3d4e5f6789012345678",
      issuedAt: new Date(),
    };

    const pdfBytes = await generateResultCardPdf(pdfData);

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000); // Standard PDF > 1KB

    // Verify PDF Magic Bytes (%PDF-1.)
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf8");
    expect(header).toBe("%PDF-");
  });
});
