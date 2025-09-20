// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 30000,
  retries: 3,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  EMPLOYEE_LOGIN: '/employees/login',
  EMPLOYEE_SESSION: '/employees/session',

  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE_BY_ID: (id: number) => `/employees/${id}`,

  // Attendance
  ATTENDANCE: '/attendance',
  ATTENDANCE_EMPLOYEE: (employeeId: number) => `/attendance/employee/${employeeId}`,
  ATTENDANCE_SUMMARY: (employeeId: number) => `/attendance/employee/${employeeId}/summary`,
  ATTENDANCE_CALENDAR: (employeeId: number) => `/attendance/employee/${employeeId}/calendar`,
  ATTENDANCE_UPLOAD: '/attendance/upload',
  ATTENDANCE_UPLOAD_HISTORY: '/attendance/upload-history',
  ATTENDANCE_DELETE_BATCH: '/attendance/delete-batch',

  // Breaks
  BREAKS: '/breaks',
  BREAKS_IN: '/breaks/in',
  BREAKS_OUT: '/breaks/out',
  BREAKS_STATUS: '/breaks/status',
  BREAKS_HISTORY: (employeeId: number) => `/breaks/history/${employeeId}`,
  BREAKS_SUMMARY: (employeeId: number) => `/breaks/summary/${employeeId}`,
  BREAKS_WARNING: '/breaks/warning',

  // Work Logs
  LOGS: '/logs',
  LOGS_BY_DATE: '/logs/by-date',
  LOGS_SUMMARY: '/logs/summary',
  LOGS_BY_ID: (id: number) => `/logs/${id}`,

  // Assignments
  ASSIGNMENTS: '/assignments',
  ASSIGNMENTS_BULK: '/assignments/bulk',
  ASSIGNMENT_BY_ID: (id: number) => `/assignments/${id}`,

  // Tags
  TAGS: '/tags',
  TAG_BY_ID: (id: number) => `/tags/${id}`,

  // Issues
  ISSUES: '/issues',
  ISSUE_BY_ID: (id: number) => `/issues/${id}`,

  // Warnings
  WARNINGS: '/warnings',
  WARNING_BY_ID: (id: number) => `/warnings/${id}`,

  // Flowace
  FLOWACE: '/flowace',
  FLOWACE_UPLOAD: '/flowace/upload',
  FLOWACE_UPLOAD_HISTORY: '/flowace/upload-history',
  FLOWACE_DELETE_BATCH: (batchId: string) => `/flowace/upload-history/${batchId}`,
  FLOWACE_EMPLOYEE: (employeeId: number) => `/flowace/employee/${employeeId}`,

  // Assets
  ASSETS: '/assets',
  ASSETS_ASSIGN: '/assets/assign',
  ASSETS_HISTORY: '/assets/history',
  ASSET_BY_ID: (id: number) => `/assets/${id}`,

  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;