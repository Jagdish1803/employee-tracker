// Database Configuration
export const DATABASE_CONFIG = {
  // Connection settings
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 10000,

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Caching
  CACHE_TTL: 300000, // 5 minutes

  // File upload limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_CSV_ROWS: 10000,
} as const;

// Table Names
export const TABLES = {
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  BREAKS: 'breaks',
  LOGS: 'logs',
  ASSIGNMENTS: 'assignments',
  TAGS: 'tags',
  ISSUES: 'issues',
  WARNINGS: 'warnings',
  FLOWACE: 'flowace',
  ASSETS: 'assets',
  ASSET_ASSIGNMENTS: 'asset_assignments',
  UPLOAD_HISTORY: 'upload_history',
} as const;

// Common column names
export const COLUMNS = {
  ID: 'id',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  EMPLOYEE_ID: 'employee_id',
  DATE: 'date',
  STATUS: 'status',
  TYPE: 'type',
  TIMESTAMP: 'timestamp',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
export type ColumnName = typeof COLUMNS[keyof typeof COLUMNS];