import { prisma } from "../lib/db/prisma";
import { assertAdmin } from "../lib/auth/rbac";
import { AuthenticatedUser } from "../lib/auth/session";
import { EvaluatedStudentResult } from "../lib/calculator/types";
import { sanitizeExportCell, sanitizeExportRow } from "../lib/export/sanitizer";
import ExcelJS from "exceljs";
import { stringify } from "csv-stringify/sync";

export interface ExamSummaryReport {
  examinationId: string;
  examinationTitle: string;
  academicYear: string;
  programName: string;
  totalEnrolled: number;
  totalPassed: number;
  totalFailed: number;
  totalWithheld: number;
  passPercentage: number;
  averageSgpa: number | null;
  gradeDistribution: Record<string, number>;
}

export class ReportService {
  /**
   * Generates performance analytics for a published examination.
   */
  static async getExamPerformanceReport(
    user: AuthenticatedUser,
    examinationId: string
  ): Promise<ExamSummaryReport> {
    assertAdmin(user);

    const exam = await prisma.examination.findUniqueOrThrow({
      where: { id: examinationId },
      include: {
        program: true,
        academicYear: true,
        publication: {
          include: {
            versions: { orderBy: { versionNumber: "desc" }, take: 1 },
          },
        },
      },
    });

    const latestVersion = exam.publication?.versions[0];
    if (!latestVersion) {
      throw new Error("No publication data available for this examination.");
    }

    const students = latestVersion.snapshotJson as unknown as EvaluatedStudentResult[];

    let passedCount = 0;
    let failedCount = 0;
    let withheldCount = 0;
    let totalSgpa = 0;
    let sgpaCount = 0;
    const gradeDistribution: Record<string, number> = {};

    for (const s of students) {
      if (s.status === "PASS") passedCount++;
      else if (s.status === "FAIL") failedCount++;
      else if (s.status === "WITHHELD") withheldCount++;

      if (s.sgpa !== null) {
        totalSgpa += s.sgpa;
        sgpaCount++;
      }

      for (const sub of s.subjects) {
        gradeDistribution[sub.grade] = (gradeDistribution[sub.grade] || 0) + 1;
      }
    }

    const total = students.length;
    const passPercentage = total > 0 ? Math.round((passedCount / total) * 10000) / 100 : 0;
    const averageSgpa = sgpaCount > 0 ? Math.round((totalSgpa / sgpaCount) * 100) / 100 : null;

    return {
      examinationId: exam.id,
      examinationTitle: exam.title,
      academicYear: exam.academicYear.name,
      programName: exam.program.name,
      totalEnrolled: total,
      totalPassed: passedCount,
      totalFailed: failedCount,
      totalWithheld: withheldCount,
      passPercentage,
      averageSgpa,
      gradeDistribution,
    };
  }

  /**
   * Exports examination result roster as CSV with formula injection sanitization.
   */
  static async exportExamRosterCsv(
    user: AuthenticatedUser,
    examinationId: string
  ): Promise<string> {
    assertAdmin(user);

    const exam = await prisma.examination.findUniqueOrThrow({
      where: { id: examinationId },
      include: {
        publication: {
          include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
        },
      },
    });

    const latestVersion = exam.publication?.versions[0];
    if (!latestVersion) {
      throw new Error("No publication snapshot found for export.");
    }

    const students = latestVersion.snapshotJson as unknown as (EvaluatedStudentResult & { rank?: number })[];

    const rows = students.map((s) => {
      const rowData = {
        "Rank": s.rank ?? "-",
        "Roll Number": s.rollNumber,
        "Registration No": s.regNumber,
        "Student Name": s.studentName,
        "Credits Offered": s.totalCreditsOffered,
        "Credits Earned": s.totalCreditsEarned,
        "Total Marks": s.totalMarksObtained,
        "Percentage": s.overallPercentage,
        "SGPA": s.sgpa !== null ? s.sgpa : "N/A",
        "Result Status": s.status,
      };
      return sanitizeExportRow(rowData);
    });

    return stringify(rows, { header: true });
  }

  /**
   * Exports examination result roster as XLSX with ExcelJS and formula injection defense.
   */
  static async exportExamRosterXlsx(
    user: AuthenticatedUser,
    examinationId: string
  ): Promise<Buffer> {
    assertAdmin(user);

    const exam = await prisma.examination.findUniqueOrThrow({
      where: { id: examinationId },
      include: {
        publication: {
          include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
        },
      },
    });

    const latestVersion = exam.publication?.versions[0];
    if (!latestVersion) {
      throw new Error("No publication snapshot found for export.");
    }

    const students = latestVersion.snapshotJson as unknown as (EvaluatedStudentResult & { rank?: number })[];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Exam Results");

    sheet.columns = [
      { header: "Rank", key: "rank", width: 10 },
      { header: "Roll Number", key: "roll", width: 15 },
      { header: "Registration No", key: "reg", width: 18 },
      { header: "Student Name", key: "name", width: 25 },
      { header: "Credits Offered", key: "creditsOffered", width: 15 },
      { header: "Credits Earned", key: "creditsEarned", width: 15 },
      { header: "Total Marks", key: "totalMarks", width: 14 },
      { header: "Percentage", key: "percentage", width: 14 },
      { header: "SGPA", key: "sgpa", width: 12 },
      { header: "Result Status", key: "status", width: 15 },
    ];

    for (const s of students) {
      sheet.addRow({
        rank: sanitizeExportCell(s.rank ?? "-"),
        roll: sanitizeExportCell(s.rollNumber),
        reg: sanitizeExportCell(s.regNumber),
        name: sanitizeExportCell(s.studentName),
        creditsOffered: s.totalCreditsOffered,
        creditsEarned: s.totalCreditsEarned,
        totalMarks: s.totalMarksObtained,
        percentage: s.overallPercentage,
        sgpa: s.sgpa !== null ? s.sgpa : "N/A",
        status: sanitizeExportCell(s.status),
      });
    }

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}

