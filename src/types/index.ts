// src/types/index.ts - Enhanced with additional utility types

// Employee Types
export interface Employee {
  id: number;
  name: string;
  email: string;
  employeeCode: string;
  createdAt: Date;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  employeeCode: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  employeeCode?: string;
}

// Tag Types
export interface Tag {
  id: number;
  tagName: string;
  timeMinutes: number;
  createdAt: Date;
}

export interface CreateTagRequest {
  tagName: string;
  timeMinutes: number;
}

export interface UpdateTagRequest {
  tagName?: string;
  timeMinutes?: number;
}

// Assignment Types
export interface Assignment {
  id: number;
  employeeId: number;
  tagId: number;
  isMandatory: boolean;
  createdAt: Date;
  employee?: Employee;
  tag?: Tag;
}

export interface CreateAssignmentRequest {
  employeeId: number;
  tagId: number;
  isMandatory: boolean;
}

export interface CreateBulkAssignmentRequest {
  employeeId: number;
  tagIds: number[];
  isMandatory: boolean;
}

// Log Types
export interface Log {
  id: number;
  employeeId: number;
  tagId: number;
  count: number;
  totalMinutes: number;
  logDate: Date;
  createdAt: Date;
  employee?: Employee;
  tag?: Tag;
}

export interface CreateLogRequest {
  employeeId: number;
  tagId: number;
  count: number;
  logDate: string;
}

export interface SubmitLogRequest {
  employeeId: number;
  logs: {
    tagId: number;
    count: number;
  }[];
  logDate: string;
}

export interface UpdateLogRequest {
  count: number;
}

// Warning Types
export type WarningType = 'ATTENDANCE' | 'PERFORMANCE' | 'CONDUCT' | 'OTHER';

export interface Warning {
  id: number;
  employeeId: number;
  warningType: WarningType;
  warningMessage: string;
  warningDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarningRequest {
  employeeId: number;
  warningType: WarningType;
  warningMessage: string;
  warningDate?: string;
}

// Submission Status Types
export interface SubmissionStatus {
  id: number;
  employeeId: number;
  submissionDate: Date;
  submissionTime: Date;
  isLocked: boolean;
  totalMinutes: number;
  statusMessage: string;
  employee?: Employee;
}

// Break Types
export interface Break {
  id: number;
  employeeId: number;
  breakDate: Date;
  breakInTime?: Date;
  breakOutTime?: Date;
  breakDuration: number;
  isActive: boolean;
  warningSent: boolean;
  createdAt: Date;
  employee?: Employee;
}

export interface BreakRequest {
  employeeId: number;
}

export interface BreakWarningRequest {
  employeeId: number;
  breakId: number;
}

// Issue Types
export interface Issue {
  id: number;
  employeeId: number;
  issueCategory: string;
  issueDescription: string;
  issueStatus: 'pending' | 'in_progress' | 'resolved';
  raisedDate: Date;
  resolvedDate?: Date;
  adminResponse?: string;
  daysElapsed: number;
  employee?: Employee;
}

export interface CreateIssueRequest {
  employeeId: number;
  issueCategory: string;
  issueDescription: string;
}

export interface UpdateIssueRequest {
  issueStatus?: 'pending' | 'in_progress' | 'resolved';
  adminResponse?: string;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

// Performance Data Types
export interface PerformanceMetrics {
  totalMinutes: number;
  totalDays: number;
  avgMinutesPerDay: number;
  tagPerformance: Record<string, {
    totalMinutes: number;
    totalCount: number;
    timePerUnit: number;
  }>;
  dailyPerformance: Record<string, number>;
}

export interface WeeklyStats {
  totalMinutes: number;
  daysWorked: number;
  avgPerDay: number;
}

// Dashboard Data Types
export interface DashboardData {
  todayLogs: Log[];
  currentBreak: Break | null;
  recentIssues: Issue[];
  activeWarnings: Warning[];
  weeklyStats: WeeklyStats;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number;
  totalTags: number;
  todaysSubmissions: number;
  pendingIssues: number;
}

// Filter Types
export interface DateFilter {
  dateFrom: string;
  dateTo: string;
}

export interface EmployeeFilter extends Partial<DateFilter> {
  employeeId?: number;
  logDate?: string;
  breakDate?: string;
  active?: boolean;
  status?: 'pending' | 'in_progress' | 'resolved';
}

// Session Types (for employee login)
export interface EmployeeSession {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
}

// Login Response Types
export interface LoginResponse {
  employee: Employee;
  session: EmployeeSession;
}

// Summary Types
export interface LogsSummary {
  today: {
    logs: Log[];
    totalMinutes: number;
    totalEntries: number;
  };
  weekly: {
    logs: Log[];
    totalMinutes: number;
    daysWorked: number;
    averagePerDay: number;
  };
}

// Utility Types
export type IssueCategory = 'Equipment' | 'Cleanliness' | 'Documents' | 'Stationery' | 'IT Support' | 'Other';
export type IssueStatus = 'pending' | 'in_progress' | 'resolved';
export type DateRangePreset = 'week' | 'month' | 'quarter';

// Form State Types
export interface EmployeeFormData {
  name: string;
  email: string;
  employeeCode: string;
}

export interface TagFormData {
  tagName: string;
  timeMinutes: number;
}

export interface IssueFormData {
  issueCategory: string;
  issueDescription: string;
}

export interface WorkLogFormData {
  logs: Record<number, number>; // tagId -> count
}

// Component Props Types
export interface EmployeePanelProps {
  employee: Employee;
  onLogout: () => void;
}

export interface WorkLogFormProps {
  employeeId: number;
  selectedDate: string;
  assignments: Assignment[];
  onSubmitSuccess: () => void;
}

export interface BreakTrackerProps {
  employeeId: number;
  currentBreak: Break | null;
  onBreakIn: () => void;
  onBreakOut: () => void;
}

export interface IssueFormProps {
  employeeId: number;
  onSubmitSuccess: () => void;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: ValidationError[] | string;
}

// Attendance Types
export interface Attendance {
  id: number;
  employeeId: number;
  attendanceDate: string; // YYYY-MM-DD format
  checkInTime?: string;
  checkOutTime?: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE_APPROVED' | 'WFH_APPROVED' | 'LATE' | 'HALF_DAY';
  hoursWorked?: number;
  remarks?: string;
  isHoliday: boolean;
  isLeave: boolean;
  leaveType?: string;
  uploadedAt: string;
  uploadedBy?: number;
  source: 'SRP_FILE' | 'MANUAL_ENTRY' | 'BIOMETRIC_IMPORT' | 'CSV_IMPORT';
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  uploadedByAdmin?: Employee;
}

export interface AttendanceUploadRequest {
  file: File;
  month: string; // YYYY-MM format
  year: string;
}

export interface AttendanceCalendarView {
  date: string;
  status: Attendance['status'];
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
  remarks?: string;
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

// Attendance related types
export interface AttendanceRecord {
  id: string | number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  lunchOutTime?: string | null; // Break start time
  lunchInTime?: string | null;  // Break end time
  hoursWorked: number;
  remarks: string | null;
  source: string;
  uploadedAt: string;
  shift?: string | null;
  shiftStart?: string | null;
  employee?: {
    name: string;
    employeeCode: string;
  };
}

export interface UploadHistory {
  id: number;
  filename: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  uploadedAt: string;
  completedAt: string | null;
  batchId: string;
  errors: Record<string, unknown>;
  summary: Record<string, unknown>;
}

// Employee attendance types
export interface AttendanceCalendarView {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE_APPROVED' | 'WFH_APPROVED';
  checkInTime?: string;
  checkOutTime?: string;
  lunchOutTime?: string;
  lunchInTime?: string;
  hoursWorked?: number;
  remarks?: string;
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

// Loading State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}