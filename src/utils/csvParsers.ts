import { z } from 'zod';

export const csvRowSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'LEAVE_APPROVED', 'WFH_APPROVED', 'LATE', 'HALF_DAY']).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  totalHours: z.string().optional().transform(val => val && val.trim() !== '' ? parseFloat(val) : undefined),
  tagWorkMinutes: z.string().optional().transform(val => val && val.trim() !== '' ? parseInt(val) : 0),
  flowaceMinutes: z.string().optional().transform(val => val && val.trim() !== '' ? parseInt(val) : 0),
  hasException: z.string().optional().transform(val => val?.toLowerCase() === 'true'),
  exceptionType: z.enum(['WORKED_ON_APPROVED_LEAVE', 'NO_WORK_ON_WFH', 'ABSENT_DESPITE_DENIAL', 'WORKED_DESPITE_DENIAL', 'ATTENDANCE_WORK_MISMATCH', 'MISSING_CHECKOUT', 'WORK_WITHOUT_CHECKIN']).optional(),
  exceptionNotes: z.string().optional(),
});

export function parseSrpFile(content: string, selectedDate?: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const data = [];

  // Find the data section - skip header lines until we find the actual data rows
  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for lines that start with a number followed by employee code (case insensitive)
    if (/^\s*\d+\s+[A-Za-z]+\d+/.test(line)) {
      dataStartIndex = i;
      break;
    }
  }

  if (dataStartIndex === -1) {
    return {
      data: [],
      errors: ['No attendance data found in file'],
      meta: { fields: ['employeeCode', 'date', 'status', 'checkInTime', 'checkOutTime'] }
    };
  }

  // Use the selected date from the form, or extract from header as fallback
  let attendanceDate = selectedDate || '';

  // Extract date from file header if not provided
  if (!attendanceDate) {
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      const dateMatch = line.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        attendanceDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        break;
      }
    }
  }

  if (!attendanceDate) {
    return {
      data: [],
      errors: ['Could not determine attendance date from file'],
      meta: { fields: ['employeeCode', 'date', 'status', 'checkInTime', 'checkOutTime'] }
    };
  }

  // Parse each data row
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const row = parseSrpDataRow(line, attendanceDate);
      if (row) {
        data.push(row);
      }
    } catch (error) {
      console.error(`Error parsing line ${i + 1}: ${line}`, error);
    }
  }

  return {
    data,
    errors: [],
    meta: { fields: ['employeeCode', 'date', 'status', 'checkInTime', 'checkOutTime'] }
  };
}

function parseSrpDataRow(line: string, attendanceDate: string) {
  // Split by whitespace and handle quoted fields
  const fields = line.match(/\S+/g) || [];

  if (fields.length < 2) return null;

  // Skip the serial number (first field) and get employee code
  const employeeCode = fields[1];

  // Default status mapping
  let status = 'PRESENT';
  let checkInTime = '';
  let checkOutTime = '';

  // Parse time fields - look for time patterns
  const timeFields = fields.slice(2);
  const timePattern = /^\d{1,2}:\d{2}(:\d{2})?(AM|PM)?$/i;

  for (const field of timeFields) {
    if (timePattern.test(field)) {
      if (!checkInTime) {
        checkInTime = field;
      } else if (!checkOutTime) {
        checkOutTime = field;
      }
    }

    // Check for status indicators
    if (field.toUpperCase().includes('ABSENT')) {
      status = 'ABSENT';
    } else if (field.toUpperCase().includes('LEAVE')) {
      status = 'LEAVE_APPROVED';
    } else if (field.toUpperCase().includes('WFH')) {
      status = 'WFH_APPROVED';
    } else if (field.toUpperCase().includes('LATE')) {
      status = 'LATE';
    }
  }

  return {
    employeeCode,
    date: attendanceDate,
    status,
    checkInTime,
    checkOutTime,
  };
}

export function parseStandardCSV(_content: string, _selectedDate?: string) {
  // Implementation for standard CSV parsing
  // This would be moved from the route file
  return {
    data: [],
    errors: [],
    meta: { fields: [] }
  };
}

export function detectFileFormat(content: string): 'csv' | 'srp' | 'unknown' {
  const lines = content.split('\n').slice(0, 10);

  // Check for SRP format indicators
  for (const line of lines) {
    if (/^\s*\d+\s+[A-Za-z]+\d+/.test(line.trim())) {
      return 'srp';
    }
  }

  // Check for CSV format (comma-separated headers)
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.includes(',') && firstLine.toLowerCase().includes('employee')) {
    return 'csv';
  }

  return 'unknown';
}