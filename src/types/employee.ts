// Employee-related types
export interface Employee {
  id: number;
  name: string;
  employeeCode: string;
  email?: string;
  department?: string;
  position?: string;
  phone?: string;
  joinDate?: string;
  status?: 'active' | 'inactive' | 'terminated';
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeCreateRequest {
  name: string;
  employeeCode: string;
  email?: string;
  department?: string;
  position?: string;
  phone?: string;
  joinDate?: string;
}

export interface EmployeeUpdateRequest extends Partial<EmployeeCreateRequest> {
  id: number;
}

export interface EmployeeLoginRequest {
  employeeCode: string;
  password?: string;
}

export interface EmployeeSession {
  employee: Employee;
  token?: string;
  expiresAt?: string;
}