import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";

export const MAX_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_IMPORT_ROWS = 5000;

export interface RawImportRow {
  rowNumber: number;
  rollNumber: string;
  regNumber?: string;
  studentName?: string;
  internalMarks?: number | null;
  externalMarks?: number | null;
  isAbsent?: boolean;
  isWithheld?: boolean;
}

export interface ParseResult {
  rows: RawImportRow[];
  errors: { rowNumber: number; rawContent: string; message: string }[];
  totalRows: number;
}

/**
 * Parses CSV buffer into structured rows with size and row count guards.
 */
export function parseMarksCsv(buffer: Buffer): ParseResult {
  if (buffer.length > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new Error(`File size ${buffer.length} bytes exceeds 2 MB limit.`);
  }

  const content = buffer.toString("utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (records.length > MAX_IMPORT_ROWS) {
    throw new Error(`File contains ${records.length} rows, exceeding the 5,000 row maximum.`);
  }

  const rows: RawImportRow[] = [];
  const errors: { rowNumber: number; rawContent: string; message: string }[] = [];

  for (let idx = 0; idx < records.length; idx++) {
    const raw = records[idx]!;
    const rowNumber = idx + 2; // Row 1 is header
    const rawStr = JSON.stringify(raw);

    // Normalize keys (case-insensitive lookup)
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[k.trim().toLowerCase()] = v ? v.trim() : "";
    }

    const roll = normalized["rollnumber"] || normalized["roll_number"] || normalized["roll no"] || normalized["roll_no"];
    if (!roll) {
      errors.push({ rowNumber, rawContent: rawStr, message: "Missing required Roll Number" });
      continue;
    }

    const internalStr = normalized["internalmarks"] || normalized["internal_marks"] || normalized["internal"];
    const externalStr = normalized["externalmarks"] || normalized["external_marks"] || normalized["external"];
    const statusStr = (normalized["status"] || normalized["attendance"] || "").toUpperCase();

    let internal: number | null = null;
    let external: number | null = null;
    let isAbsent = false;
    let isWithheld = false;

    if (statusStr === "AB" || statusStr === "ABSENT") {
      isAbsent = true;
    } else if (statusStr === "WH" || statusStr === "WITHHELD") {
      isWithheld = true;
    } else {
      if (internalStr !== undefined && internalStr !== "") {
        const parsed = Number(internalStr);
        if (isNaN(parsed) || parsed < 0) {
          errors.push({ rowNumber, rawContent: rawStr, message: `Invalid internal marks: '${internalStr}'` });
          continue;
        }
        internal = parsed;
      }

      if (externalStr !== undefined && externalStr !== "") {
        const parsed = Number(externalStr);
        if (isNaN(parsed) || parsed < 0) {
          errors.push({ rowNumber, rawContent: rawStr, message: `Invalid external marks: '${externalStr}'` });
          continue;
        }
        external = parsed;
      }
    }

    rows.push({
      rowNumber,
      rollNumber: roll.toUpperCase(),
      regNumber: normalized["regnumber"] || normalized["reg_number"],
      studentName: normalized["name"] || normalized["student_name"],
      internalMarks: internal,
      externalMarks: external,
      isAbsent,
      isWithheld,
    });
  }

  return {
    rows,
    errors,
    totalRows: records.length,
  };
}

/**
 * Parses XLSX buffer using ExcelJS into structured rows with size and row count guards.
 */
export async function parseMarksXlsx(buffer: Buffer): Promise<ParseResult> {
  if (buffer.length > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new Error(`File size ${buffer.length} bytes exceeds 2 MB limit.`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Uploaded workbook contains no worksheets.");
  }

  const rows: RawImportRow[] = [];
  const errors: { rowNumber: number; rawContent: string; message: string }[] = [];
  const headerMap: Map<string, number> = new Map();

  let totalRows = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // Map headers by stripping whitespace and underscores for robust matching
      row.eachCell((cell, colNumber) => {
        const rawText = cell.value !== null && cell.value !== undefined ? cell.value.toString() : "";
        const cleanKey = rawText.replace(/[\s_-]+/g, "").toLowerCase();
        if (cleanKey) {
          headerMap.set(cleanKey, colNumber);
        }
      });
      return;
    }

    totalRows++;
    if (totalRows > MAX_IMPORT_ROWS) {
      throw new Error(`Workbook exceeds the maximum allowed ${MAX_IMPORT_ROWS} rows.`);
    }

    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        const cleanKey = k.replace(/[\s_-]+/g, "").toLowerCase();
        const col = headerMap.get(cleanKey);
        if (col) {
          const val = row.getCell(col).value;
          return val !== null && val !== undefined ? val.toString().trim() : "";
        }
      }
      return "";
    };

    const roll = getVal("rollnumber", "roll_number", "roll no", "roll_no");
    const rawStr = JSON.stringify(row.values);

    if (!roll) {
      errors.push({ rowNumber, rawContent: rawStr, message: "Missing required Roll Number" });
      return;
    }

    const internalStr = getVal("internalmarks", "internal_marks", "internal");
    const externalStr = getVal("externalmarks", "external_marks", "external");
    const statusStr = getVal("status", "attendance").toUpperCase();

    let internal: number | null = null;
    let external: number | null = null;
    let isAbsent = false;
    let isWithheld = false;

    if (statusStr === "AB" || statusStr === "ABSENT") {
      isAbsent = true;
    } else if (statusStr === "WH" || statusStr === "WITHHELD") {
      isWithheld = true;
    } else {
      if (internalStr !== "") {
        const parsed = Number(internalStr);
        if (isNaN(parsed) || parsed < 0) {
          errors.push({ rowNumber, rawContent: rawStr, message: `Invalid internal marks: '${internalStr}'` });
          return;
        }
        internal = parsed;
      }

      if (externalStr !== "") {
        const parsed = Number(externalStr);
        if (isNaN(parsed) || parsed < 0) {
          errors.push({ rowNumber, rawContent: rawStr, message: `Invalid external marks: '${externalStr}'` });
          return;
        }
        external = parsed;
      }
    }

    rows.push({
      rowNumber,
      rollNumber: roll.toUpperCase(),
      regNumber: getVal("regnumber", "reg_number"),
      studentName: getVal("name", "student_name"),
      internalMarks: internal,
      externalMarks: external,
      isAbsent,
      isWithheld,
    });
  });

  return {
    rows,
    errors,
    totalRows,
  };
}
