import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { EvaluatedStudentResult } from "../calculator/types";

export interface PdfResultCardData {
  institutionName: string;
  institutionCode: string;
  tagline?: string;
  address?: string;
  examinationTitle: string;
  academicSession: string;
  studentResult: EvaluatedStudentResult;
  programName: string;
  semesterName: string;
  batchName: string;
  verificationHash: string;
  issuedAt: Date;
}

/**
 * Pure-JavaScript PDF Result Card / Transcript Generator.
 * Built with pdf-lib: zero headless Chrome, zero native binaries, fast & memory-efficient.
 */
export async function generateResultCardPdf(data: PdfResultCardData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points

  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const crimsonRed = rgb(0.60, 0.11, 0.11); // #991b1b SRGC Crimson Red
  const darkCrimson = rgb(0.50, 0.11, 0.11); // #7f1d1d SRGC Dark Red
  const slateText = rgb(0.2, 0.25, 0.33);
  const borderGrey = rgb(0.85, 0.88, 0.92);
  const lightBg = rgb(0.98, 0.96, 0.96); // Soft clean background

  let y = 800;

  // 1. Institutional Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 55,
    width: 515,
    height: 60,
    color: lightBg,
    borderColor: crimsonRed,
    borderWidth: 1.5,
  });

  page.drawText(data.institutionName.toUpperCase(), {
    x: 60,
    y: y - 20,
    size: 15,
    font: timesRomanBold,
    color: crimsonRed,
  });

  if (data.tagline) {
    page.drawText(data.tagline, {
      x: 60,
      y: y - 34,
      size: 9,
      font: helvetica,
      color: darkCrimson,
    });
  }

  if (data.address) {
    page.drawText(data.address, {
      x: 60,
      y: y - 47,
      size: 8,
      font: helvetica,
      color: slateText,
    });
  }

  y -= 75;

  // 2. Examination Title Banner
  page.drawText("STATEMENT OF GRADES / RESULT CARD", {
    x: 180,
    y: y,
    size: 12,
    font: timesRomanBold,
    color: crimsonRed,
  });

  y -= 16;
  page.drawText(`${data.examinationTitle} — Academic Session: ${data.academicSession}`, {
    x: 155,
    y: y,
    size: 10,
    font: helveticaBold,
    color: slateText,
  });

  y -= 25;

  // 3. Student Identification Table
  page.drawRectangle({
    x: 40,
    y: y - 50,
    width: 515,
    height: 55,
    borderColor: borderGrey,
    borderWidth: 1,
    color: lightBg,
  });

  const res = data.studentResult;
  // Row 1
  page.drawText(`Student Name: ${res.studentName}`, { x: 50, y: y - 18, size: 9, font: helveticaBold, color: crimsonRed });
  page.drawText(`Roll Number: ${res.rollNumber}`, { x: 340, y: y - 18, size: 9, font: helveticaBold, color: crimsonRed });

  // Row 2
  page.drawText(`Program: ${data.programName}`, { x: 50, y: y - 33, size: 9, font: helvetica, color: slateText });
  page.drawText(`Registration No: ${res.regNumber}`, { x: 340, y: y - 33, size: 9, font: helvetica, color: slateText });

  // Row 3
  page.drawText(`Term / Semester: ${data.semesterName}`, { x: 50, y: y - 47, size: 9, font: helvetica, color: slateText });
  page.drawText(`Batch: ${data.batchName}`, { x: 340, y: y - 47, size: 9, font: helvetica, color: slateText });

  y -= 75;

  // 4. Course / Subject Marks Table Header
  page.drawRectangle({
    x: 40,
    y: y - 18,
    width: 515,
    height: 20,
    color: crimsonRed,
  });

  page.drawText("CODE", { x: 45, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("SUBJECT TITLE", { x: 115, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("CREDITS", { x: 275, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("MAX", { x: 330, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("OBT", { x: 385, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("GRADE", { x: 440, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("STATUS", { x: 495, y: y - 13, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });

  y -= 20;

  // Subject Rows
  for (let i = 0; i < res.subjects.length; i++) {
    const sub = res.subjects[i]!;
    const rowBg = i % 2 === 0 ? rgb(1, 1, 1) : lightBg;

    page.drawRectangle({
      x: 40,
      y: y - 16,
      width: 515,
      height: 18,
      color: rowBg,
      borderColor: borderGrey,
      borderWidth: 0.5,
    });

    page.drawText(sub.subjectCode, { x: 45, y: y - 12, size: 8, font: helvetica, color: slateText });

    const title = (sub.subjectName || "Subject Course").substring(0, 32);
    page.drawText(title, { x: 115, y: y - 12, size: 8, font: helvetica, color: slateText });
    page.drawText(sub.credits.toFixed(1), { x: 285, y: y - 12, size: 8, font: helvetica, color: slateText });
    page.drawText(sub.maxTotalMarks.toString(), { x: 335, y: y - 12, size: 8, font: helvetica, color: slateText });

    const obtText = sub.totalMarksObtained !== null ? sub.totalMarksObtained.toString() : "-";
    page.drawText(obtText, { x: 390, y: y - 12, size: 8, font: helvetica, color: slateText });
    page.drawText(sub.grade, { x: 445, y: y - 12, size: 8, font: helveticaBold, color: crimsonRed });

    const statusColor = sub.status === "PASS" ? rgb(0.1, 0.5, 0.2) : rgb(0.7, 0.1, 0.1);
    page.drawText(sub.status, { x: 495, y: y - 12, size: 8, font: helveticaBold, color: statusColor });

    y -= 18;
  }

  y -= 15;

  // 5. Semester Summary Block
  page.drawRectangle({
    x: 40,
    y: y - 45,
    width: 515,
    height: 50,
    borderColor: crimsonRed,
    borderWidth: 1,
    color: lightBg,
  });

  page.drawText(`Total Credits Offered: ${res.totalCreditsOffered}`, { x: 55, y: y - 18, size: 9, font: helvetica, color: slateText });
  page.drawText(`Credits Earned: ${res.totalCreditsEarned}`, { x: 200, y: y - 18, size: 9, font: helvetica, color: slateText });

  const sgpaText = res.sgpa !== null ? res.sgpa.toFixed(2) : "N/A";
  page.drawText(`SGPA: ${sgpaText}`, { x: 350, y: y - 18, size: 10, font: helveticaBold, color: crimsonRed });

  page.drawText(`Percentage: ${res.overallPercentage.toFixed(2)}%`, { x: 55, y: y - 35, size: 9, font: helvetica, color: slateText });
  const finalStatusColor = res.status === "PASS" ? rgb(0.1, 0.5, 0.2) : rgb(0.7, 0.1, 0.1);
  page.drawText(`FINAL RESULT: ${res.status}`, { x: 350, y: y - 35, size: 11, font: helveticaBold, color: finalStatusColor });

  y -= 80;

  // 6. Signatures and Verification
  page.drawLine({ start: { x: 60, y }, end: { x: 180, y }, color: slateText, thickness: 0.8 });
  page.drawText("Prepared By (Exam Cell)", { x: 65, y: y - 14, size: 8, font: helvetica, color: slateText });

  page.drawLine({ start: { x: 235, y }, end: { x: 355, y }, color: slateText, thickness: 0.8 });
  page.drawText("Checked By (Dean Academics)", { x: 240, y: y - 14, size: 8, font: helvetica, color: slateText });

  page.drawLine({ start: { x: 410, y }, end: { x: 530, y }, color: slateText, thickness: 0.8 });
  page.drawText("Controller of Examinations", { x: 420, y: y - 14, size: 8, font: helvetica, color: slateText });

  // 7. Security Hash & Disclaimer Footer
  y -= 50;
  page.drawText(`Verification Reference: ${data.verificationHash}`, {
    x: 40,
    y,
    size: 7,
    font: helvetica,
    color: slateText,
  });

  y -= 12;
  page.drawText(
    "Disclaimer: This digitally generated result card is for student guidance. Official physical stamped transcripts issued by the Registrar take legal precedence.",
    {
      x: 40,
      y,
      size: 6.5,
      font: helvetica,
      color: slateText,
    }
  );

  return await pdfDoc.save();
}
