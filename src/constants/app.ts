// Application Constants
export const APP_CONFIG = {
  NAME: 'Employee Tracker',
  VERSION: '1.0.0',
  DESCRIPTION: 'Comprehensive employee management and tracking system',
  COMPANY: 'Your Company',
} as const;

// Attendance Status Types
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  WFH_APPROVED: 'WFH_APPROVED',
} as const;

// Break Configuration
export const BREAK_CONFIG = {
  MAX_RECOMMENDED_DURATION: 30, // minutes
  WARNING_THRESHOLD: 30, // minutes
  TIMER_UPDATE_INTERVAL: 1000, // milliseconds
} as const;

// Flowace Configuration
export const FLOWACE_CONFIG = {
  HIGH_PRODUCTIVITY_THRESHOLD: 80, // percentage
  MEDIUM_PRODUCTIVITY_THRESHOLD: 60, // percentage
  DEFAULT_WORK_HOURS: 8,
  CSV_UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 10,
  TOAST_DURATION: 3000, // milliseconds
  LOADING_DELAY: 200, // milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds
} as const;

// Date Formats
export const DATE_FORMATS = {
  API: 'yyyy-MM-dd',
  DISPLAY: 'MMM d, yyyy',
  FULL: 'EEEE, MMMM d, yyyy',
  TIME: 'HH:mm',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
} as const;

// File Types
export const ALLOWED_FILE_TYPES = {
  CSV: '.csv',
  EXCEL: '.xlsx,.xls',
  IMAGES: '.png,.jpg,.jpeg,.gif',
  DOCUMENTS: '.pdf,.doc,.docx',
} as const;

// Employee Roles
export const EMPLOYEE_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR: 'hr',
} as const;

// Asset Types
export const ASSET_TYPES = {
  LAPTOP: 'laptop',
  DESKTOP: 'desktop',
  MONITOR: 'monitor',
  PHONE: 'phone',
  TABLET: 'tablet',
  ACCESSORIES: 'accessories',
  SOFTWARE: 'software',
  OTHER: 'other',
} as const;

// Issue Priorities
export const ISSUE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Issue Status
export const ISSUE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  ADMIN: '/admin',
  EMPLOYEE: '/employee',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_EMPLOYEES: '/admin/employees',
  ADMIN_ATTENDANCE: '/admin/attendance',
  ADMIN_FLOWACE: '/admin/flowace',
  ADMIN_BREAKS: '/admin/breaks',
  ADMIN_ISSUES: '/admin/issues',
  ADMIN_WARNINGS: '/admin/warnings',
  ADMIN_ASSETS: '/admin/assets',
  ADMIN_ASSIGNMENTS: '/admin/assignments',
  ADMIN_TAGS: '/admin/tags',
  EMPLOYEE_DASHBOARD: '/employee',
  EMPLOYEE_WORK_LOG: '/employee/work-log',
  EMPLOYEE_ASSIGNMENTS: '/employee/assignments',
  EMPLOYEE_ATTENDANCE: '/employee/attendance',
  EMPLOYEE_FLOWACE: '/employee/flowace',
  EMPLOYEE_BREAKS: '/employee/breaks',
  EMPLOYEE_ISSUES: '/employee/issues',
  EMPLOYEE_WARNINGS: '/employee/warnings',
  EMPLOYEE_PERFORMANCE: '/employee/performance',
  EMPLOYEE_ASSETS: '/employee/assets',
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;
export type EmployeeRole = typeof EMPLOYEE_ROLES[keyof typeof EMPLOYEE_ROLES];
export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];
export type IssuePriority = typeof ISSUE_PRIORITIES[keyof typeof ISSUE_PRIORITIES];
export type IssueStatus = typeof ISSUE_STATUS[keyof typeof ISSUE_STATUS];
export type Route = typeof ROUTES[keyof typeof ROUTES];