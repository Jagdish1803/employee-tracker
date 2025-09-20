// Flowace-related types
export interface FlowaceRecord {
  id: string;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  memberEmail?: string;
  teams?: string;
  date: string;
  workStartTime?: string;
  workEndTime?: string;
  loggedHours?: number;
  activeHours?: number;
  idleHours?: number;
  classifiedHours?: number;
  unclassifiedHours?: number;
  productiveHours?: number;
  unproductiveHours?: number;
  neutralHours?: number;
  availableHours?: number;
  missingHours?: number;
  activityPercentage?: number;
  classifiedPercentage?: number;
  productivityPercentage?: number;
  classifiedBillableDuration?: number;
  classifiedNonBillableDuration?: number;
  batchId: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    name: string;
    employeeCode: string;
    department?: string;
  };
  rawData?: string[];
}

export interface FlowaceUploadHistory {
  id: string;
  batchId: string;
  filename: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  uploadedAt: string;
  errors?: Array<{ row: number; error: string }>;
  summary?: Record<string, unknown>;
}

export interface FlowaceCreateRequest {
  employeeCode: string;
  employeeName: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BREAK' | 'MEETING';
  productivityScore?: number;
  screenshotCount?: number;
  activityLevel?: number;
}

export interface FlowaceSummary {
  totalActiveHours: number;
  avgProductivity: number;
  totalWorkingDays: number;
  avgActiveHours: number;
  highProductivityDays: number;
  mediumProductivityDays: number;
  lowProductivityDays: number;
}