import { describe, it, expect } from "vitest";
import { parseMarksCsv, parseMarksXlsx } from "../../src/lib/import/marks-importer";
import { sanitizeExportCell, sanitizeExportRow } from "../../src/lib/export/sanitizer";
import ExcelJS from "exceljs";

describe("Phase 5: Import & Export Security Unit Tests", () => {
  describe("Formula Injection Defense (Sanitization)", () => {
    it("prepends single quote to cells beginning with formula trigger characters (=, +, -, @)", () => {
      expect(sanitizeExportCell("=CMD|' /C calc'!A0")).toBe("'=CMD|' /C calc'!A0");
      expect(sanitizeExportCell("+12345")).toBe("'+12345");
      expect(sanitizeExportCell("-100")).toBe("'-100");
      expect(sanitizeExportCell("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
    });

    it("leaves safe strings and numbers untouched", () => {
      expect(sanitizeExportCell("Aarav Sharma")).toBe("Aarav Sharma");
      expect(sanitizeExportCell("CS101")).toBe("CS101");
      expect(sanitizeExportCell(95)).toBe(95);
      expect(sanitizeExportCell(true)).toBe(true);
    });

    it("sanitizes an entire record object row", () => {
      const row = {
        roll: "230101",
        name: "=HYPERLINK(\"http://malicious.com\")",
        marks: 85,
      };
      const sanitized = sanitizeExportRow(row);
      expect(sanitized["roll"]).toBe("230101");
      expect(sanitized["name"]).toBe("'=HYPERLINK(\"http://malicious.com\")");
      expect(sanitized["marks"]).toBe(85);
    });
  });

  describe("CSV Marks Importer", () => {
    it("parses valid CSV rows accurately", () => {
      const csvData = Buffer.from(
        "roll_number,internal_marks,external_marks\n230101,25,65\n230102,28,68",
        "utf8"
      );
      const res = parseMarksCsv(csvData);

      expect(res.totalRows).toBe(2);
      expect(res.rows).toHaveLength(2);
      expect(res.errors).toHaveLength(0);
      expect(res.rows[0]?.rollNumber).toBe("230101");
      expect(res.rows[0]?.internalMarks).toBe(25);
      expect(res.rows[0]?.externalMarks).toBe(65);
    });

    it("identifies row-level errors for missing roll numbers or invalid numbers", () => {
      const csvData = Buffer.from(
        "roll_number,internal_marks,external_marks\n,25,65\n230102,abc,68",
        "utf8"
      );
      const res = parseMarksCsv(csvData);

      expect(res.rows).toHaveLength(0);
      expect(res.errors).toHaveLength(2);
      expect(res.errors[0]?.message).toContain("Missing required Roll Number");
      expect(res.errors[1]?.message).toContain("Invalid internal marks");
    });
  });

  describe("Excel Marks Importer (ExcelJS)", () => {
    it("parses valid XLSX buffer", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Marks");
      sheet.addRow(["Roll Number", "Internal Marks", "External Marks"]);
      sheet.addRow(["230101", 26, 64]);
      sheet.addRow(["230102", 29, 69]);

      const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
      const res = await parseMarksXlsx(buffer);

      expect(res.totalRows).toBe(2);
      expect(res.rows).toHaveLength(2);
      expect(res.errors).toHaveLength(0);
      expect(res.rows[0]?.rollNumber).toBe("230101");
      expect(res.rows[0]?.internalMarks).toBe(26);
    });
  });
});
