// src/api/index.ts
// Export API clients
export { apiClient } from './clients/base';

// Export all services
export * from './services';

// Re-export commonly used service instances
export {
  attendanceService,
  logService,
  employeeService,
  tagService,
  issueService,
  breakService,
  warningService,
  assignmentService
} from './services';
