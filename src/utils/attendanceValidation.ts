import { z } from 'zod';
import { csvRowSchema } from './csvParsers';

export interface ValidationResult {
  isValid: boolean;
  data?: Record<string, unknown>;
  errors: string[];
}

export function validateAttendanceRecord(record: Record<string, unknown>, rowIndex: number): ValidationResult {
  try {
    const validatedData = csvRowSchema.parse(record);
    return {
      isValid: true,
      data: validatedData,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err =>
        `Row ${rowIndex}: ${err.path.join('.')} - ${err.message}`
      );
      return {
        isValid: false,
        errors
      };
    }
    return {
      isValid: false,
      errors: [`Row ${rowIndex}: Validation failed - ${error}`]
    };
  }
}

export function validateDateFormat(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

export function validateTimeFormat(timeString: string): boolean {
  if (!timeString) return true; // Optional field
  return /^\d{1,2}:\d{2}(:\d{2})?(AM|PM)?$/i.test(timeString);
}

export function validateEmployeeCode(code: string): boolean {
  return /^[A-Za-z]+\d+$/.test(code);
}

export function detectDuplicateRecords(records: Record<string, unknown>[]): number[] {
  const seen = new Set();
  const duplicateIndices: number[] = [];

  records.forEach((record, index) => {
    const key = `${record.employeeCode}-${record.date}`;
    if (seen.has(key)) {
      duplicateIndices.push(index);
    } else {
      seen.add(key);
    }
  });

  return duplicateIndices;
}

export function sanitizeAttendanceData(record: Record<string, unknown>) {
  return {
    ...record,
    employeeCode: typeof record.employeeCode === 'string' ? record.employeeCode.trim().toUpperCase() : record.employeeCode,
    status: typeof record.status === 'string' ? record.status.toUpperCase() : record.status,
    checkInTime: typeof record.checkInTime === 'string' ? record.checkInTime.trim() : record.checkInTime,
    checkOutTime: typeof record.checkOutTime === 'string' ? record.checkOutTime.trim() : record.checkOutTime,
    exceptionNotes: typeof record.exceptionNotes === 'string' ? record.exceptionNotes.trim() : record.exceptionNotes,
  };
}