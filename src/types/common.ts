// Common types used across the application

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  from: string;
  to: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface FileUploadResult {
  success: boolean;
  filename?: string;
  url?: string;
  size?: number;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface TableColumn<T = unknown> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number';
  options?: SelectOption[];
  placeholder?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onBreak: number;
  totalHours: number;
  avgProductivity: number;
  issuesOpen: number;
  warningsActive: number;
  attendanceRate: number;
}