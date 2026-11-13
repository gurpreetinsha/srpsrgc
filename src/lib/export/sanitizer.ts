/**
 * Formula Injection (CSV / Excel Injection) Sanitizer.
 * In accordance with the security baseline, cells beginning with =, +, -, @, \t, or \r
 * are safely prepended with a single quote (') so that spreadsheet viewers treat them as text
 * rather than executable macros or external commands.
 */
export function sanitizeExportCell(value: unknown): unknown {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    // Check if string begins with characters that trigger formula execution
    if (/^[=+\-@\t\r]/.test(value)) {
      return `'${value}`;
    }
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

/**
 * Sanitizes an entire record row before export serialization.
 */
export function sanitizeExportRow(row: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    sanitized[key] = sanitizeExportCell(val);
  }
  return sanitized;
}

