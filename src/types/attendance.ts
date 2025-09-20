// Attendance-related types
import { ATTENDANCE_STATUS } from '../constants/app';

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  lunchOutTime?: string;
  lunchInTime?: string;
  hoursWorked?: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceSummary {
  employeeId: number;
  month: string;
  year: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lateDays: number;
  leaveDays: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  attendancePercentage: number;
}

export interface AttendanceCalendarData {
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
}

export interface AttendanceUploadResult {
  success: boolean;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  errors?: Array<{ row: number; error: string }>;
  batchId?: string;
}