// src/hooks/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/api';
import { CreateEmployeeRequest } from '@/types';
import { toast } from 'react-hot-toast';

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const response = await employeeService.getAll();
        if (!response.data.success) {
          throw new Error((response.data as { error?: string }).error || 'Failed to fetch employees');
        }
        return response.data.data;
      } catch (error) {
        console.error('API error in useEmployees:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await employeeService.getById(id);
      if (!response.data.success) {
        throw new Error((response.data as { error?: string }).error || 'Failed to fetch employee');
      }
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEmployeeRequest) => {
      const response = await employeeService.create(data);
      if (!response.data.success) {
        throw new Error((response.data as { error?: string }).error || 'Failed to create employee');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateEmployeeRequest> }) => {
      const response = await employeeService.update(id, data);
      if (!response.data.success) {
        throw new Error((response.data as { error?: string }).error || 'Failed to update employee');
      }
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await employeeService.delete(id);
      if (!response.data.success) {
        throw new Error((response.data as { error?: string }).error || 'Failed to delete employee');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
