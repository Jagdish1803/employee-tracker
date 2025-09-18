import { useQuery } from '@tanstack/react-query';
import { Employee } from '@/types';

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  error?: string;
}

// Get all employees with filters
export const useEmployees = (filters: EmployeeFilters = {}) => {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async (): Promise<ApiResponse<Employee[]>> => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/employees?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    },
  });
};

// Get single employee
export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async (): Promise<ApiResponse<Employee>> => {
      const response = await fetch(`/api/employees/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee');
      }
      return response.json();
    },
    enabled: !!id,
  });
};