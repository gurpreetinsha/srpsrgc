import { prisma } from "../lib/db/prisma";
import { assertStudentOwnership, ForbiddenError } from "../lib/auth/rbac";
import { AuthenticatedUser } from "../lib/auth/session";
import { generateResultCardPdf } from "../lib/pdf/result-card-generator";
import { EvaluatedStudentResult } from "../lib/calculator/types";
import crypto from "crypto";

export class StudentResultService {
  /**
   * Retrieves all published examination results for an authorized student.
   */
  static async getPublishedResultsForStudent(
    user: AuthenticatedUser,
    studentId: string
  ) {
    assertStudentOwnership(user, studentId);

    // Fetch institution settings to check rank visibility
    const settings = await prisma.institutionSetting.findFirst();
    const allowRankView = settings?.allowStudentRankView ?? false;

    // Fetch published examinations where this student is enrolled
    const publications = await prisma.resultPublication.findMany({
      where: {
        status: "PUBLISHED",
        examination: {
          enrollments: {
            some: { studentId },
          },
        },
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        examination: {
          include: {
            program: true,
            semester: true,
            academicYear: true,
            enrollments: {
              where: { studentId },
              include: {
                marks: {
                  include: {
                    examinationSubject: {
                      include: { subject: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const pub of publications) {
      const exam = pub.examination;
      const latestVersion = pub.versions[0];
      if (!latestVersion) continue;

      // Extract student's pre-calculated result from the immutable snapshot
      const snapshot = latestVersion.snapshotJson as unknown as EvaluatedStudentResult[];
      const studentCalc = snapshot.find((s) => s.studentId === studentId);

      if (studentCalc) {
        results.push({
          examinationId: exam.id,
          examinationTitle: exam.title,
          examinationCode: exam.code,
          academicYear: exam.academicYear.name,
          semester: exam.semester.title,
          program: exam.program.name,
          publishedAt: pub.publishedAt,
          result: {
            ...studentCalc,
            // Strip rank if not permitted by privacy policy
            rank: allowRankView ? (studentCalc as { rank?: number }).rank : null,
          },
        });
      }
    }

    return results;
  }

  /**
   * Generates authenticated PDF result card.
   */
  static async getResultCardPdf(
    user: AuthenticatedUser,
    params: { studentId: string; examinationId: string }
  ): Promise<Uint8Array> {
    assertStudentOwnership(user, params.studentId);

    // Verify examination is published
    const pub = await prisma.resultPublication.findUnique({
      where: { examinationId: params.examinationId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        examination: {
          include: {
            program: true,
            semester: true,
            academicYear: true,
            enrollments: { where: { studentId: params.studentId } },
          },
        },
      },
    });

    if (!pub || pub.status !== "PUBLISHED") {
      throw new ForbiddenError("Examination result has not been officially published");
    }

    const latestVersion = pub.versions[0];
    if (!latestVersion) {
      throw new Error("No publication version snapshot available");
    }

    const snapshot = latestVersion.snapshotJson as unknown as EvaluatedStudentResult[];
    const studentResult = snapshot.find((s) => s.studentId === params.studentId);

    if (!studentResult) {
      throw new Error("Student result not found in publication snapshot");
    }

    const settings = await prisma.institutionSetting.findFirst();
    const enrollment = pub.examination.enrollments[0];

    // Compute tamper-evident verification hash
    const rawDataToHash = `${params.studentId}:${pub.examinationId}:${latestVersion.versionNumber}:${studentResult.sgpa}`;
    const verificationHash = crypto.createHash("sha256").update(rawDataToHash).digest("hex").substring(0, 24);

    return await generateResultCardPdf({
      institutionName: settings?.institutionName || "Shri Ram Group of Colleges",
      institutionCode: settings?.institutionCode || "SRGC",
      tagline: settings?.tagline || undefined,
      address: settings?.address || undefined,
      examinationTitle: pub.examination.title,
      academicSession: pub.examination.academicYear.name,
      studentResult,
      programName: pub.examination.program.name,
      semesterName: pub.examination.semester.title,
      batchName: enrollment?.batchSnapshot || "Current Batch",
      verificationHash,
      issuedAt: new Date(),
    });
  }
}

