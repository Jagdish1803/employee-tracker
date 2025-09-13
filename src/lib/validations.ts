import { z } from 'zod';

// Employee validation schemas
export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  employeeCode: z.string().min(3, 'Employee code must be at least 3 characters').regex(/^[a-zA-Z0-9]+$/, 'Employee code must be alphanumeric'),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeLoginSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
});

// Tag validation schemas
export const createTagSchema = z.object({
  tagName: z.string().min(1, 'Tag name is required').max(100, 'Tag name too long'),
  timeMinutes: z.number().min(1, 'Time must be at least 1 minute').max(480, 'Time cannot exceed 8 hours'),
});

export const updateTagSchema = createTagSchema.partial();

// Assignment validation schemas
export const createAssignmentSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
  tagId: z.number().positive('Tag ID must be positive'),
  isMandatory: z.boolean().default(false),
});

// Bulk assignment validation schema for multi-tag assignments
export const createBulkAssignmentSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
  tagIds: z.array(z.number().positive('Tag ID must be positive')).min(1, 'At least one tag must be selected'),
  isMandatory: z.boolean().default(false),
});

// Log validation schemas
export const createLogSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
  tagId: z.number().positive('Tag ID must be positive'),
  count: z.number().min(0, 'Count cannot be negative'),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export const submitLogSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
  logs: z.array(z.object({
    tagId: z.number().positive('Tag ID must be positive'),
    count: z.number().min(0, 'Count cannot be negative'),
  })),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export const updateLogSchema = z.object({
  count: z.number().min(0, 'Count cannot be negative'),
});

// Warning validation schemas
export const createWarningSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
  warningType: z.enum(['ATTENDANCE', 'PERFORMANCE', 'CONDUCT', 'OTHER']),
  warningMessage: z.string().min(1, 'Warning message is required').max(500, 'Warning message too long'),
  warningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
});

export const updateWarningSchema = z.object({
  isActive: z.boolean(),
});

// Break validation schemas
export const breakRequestSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
});

export const sendBreakWarningSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
  breakId: z.number().positive('Break ID must be positive'),
});

// Issue validation schemas
export const createIssueSchema = z.object({
  employeeId: z.number().positive('Employee ID must be positive'),
  issueCategory: z.enum(['Equipment', 'Cleanliness', 'Documents', 'Stationery', 'IT Support', 'Other']),
  issueDescription: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
});

export const updateIssueSchema = z.object({
  issueStatus: z.enum(['pending', 'in_progress', 'resolved']).optional(),
  adminResponse: z.string().max(1000, 'Admin response too long').optional(),
});

// Filter validation schemas
export const dateFilterSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export const employeeFilterSchema = dateFilterSchema.extend({
  employeeId: z.number().positive().optional(),
});

// Query parameter schemas
export const idParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),
});

export const employeeQuerySchema = z.object({
  employeeId: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).optional(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  breakDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  active: z.string().transform((val) => val === 'true').optional(),
  status: z.enum(['pending', 'in_progress', 'resolved']).optional(),
});

// Type exports for the schemas
export type CreateEmployeeData = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeData = z.infer<typeof updateEmployeeSchema>;
export type EmployeeLoginData = z.infer<typeof employeeLoginSchema>;
export type CreateTagData = z.infer<typeof createTagSchema>;
export type UpdateTagData = z.infer<typeof updateTagSchema>;
export type CreateAssignmentData = z.infer<typeof createAssignmentSchema>;
export type CreateBulkAssignmentData = z.infer<typeof createBulkAssignmentSchema>;
export type CreateLogData = z.infer<typeof createLogSchema>;
export type SubmitLogData = z.infer<typeof submitLogSchema>;
export type UpdateLogData = z.infer<typeof updateLogSchema>;
export type CreateWarningData = z.infer<typeof createWarningSchema>;
export type UpdateWarningData = z.infer<typeof updateWarningSchema>;
export type BreakRequestData = z.infer<typeof breakRequestSchema>;
export type CreateIssueData = z.infer<typeof createIssueSchema>;
export type UpdateIssueData = z.infer<typeof updateIssueSchema>;
export type DateFilterData = z.infer<typeof dateFilterSchema>;
export type EmployeeFilterData = z.infer<typeof employeeFilterSchema>;
export type EmployeeQueryData = z.infer<typeof employeeQuerySchema>;