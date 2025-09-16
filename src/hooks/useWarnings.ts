import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { warningApi } from '@/lib/api-client';
import type { CreateWarningRequest } from '@/types';

// Query Keys
export const warningKeys = {
  all: ['warnings'] as const,
  lists: () => [...warningKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...warningKeys.lists(), filters] as const,
  details: () => [...warningKeys.all, 'detail'] as const,
  detail: (id: number) => [...warningKeys.details(), id] as const,
  active: () => [...warningKeys.all, 'active'] as const,
  dismissed: () => [...warningKeys.all, 'dismissed'] as const,
  byEmployee: (employeeId: number) => [...warningKeys.all, 'employee', employeeId] as const,
};

// Get all warnings with optional filters
export function useWarnings(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: warningKeys.list(filters),
    queryFn: () => warningApi.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Get warnings by employee
export function useEmployeeWarnings(employeeId: number) {
  return useQuery({
    queryKey: warningKeys.byEmployee(employeeId),
    queryFn: () => warningApi.getByEmployee(employeeId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!employeeId,
    refetchOnWindowFocus: false,
  });
}

// Get active warnings (higher priority)
export function useActiveWarnings() {
  return useQuery({
    queryKey: warningKeys.active(),
    queryFn: () => warningApi.getActive(),
    staleTime: 30 * 1000, // 30 seconds for active warnings
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1 * 60 * 1000, // Auto-refresh every minute
  });
}

// Create warning mutation
export function useCreateWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarningRequest) => warningApi.create(data),
    onSuccess: (newWarning, variables) => {
      toast.success('Warning created successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
      queryClient.invalidateQueries({ queryKey: warningKeys.active() });
      
      // If employee-specific, invalidate that cache
      if (variables.employeeId) {
        queryClient.invalidateQueries({ 
          queryKey: warningKeys.byEmployee(variables.employeeId) 
        });
      }
    },
    onError: (error) => {
      console.error('Create warning error:', error);
      toast.error('Failed to create warning');
    },
  });
}

// Dismiss warning mutation
export function useDismissWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => warningApi.dismiss(id),
    onSuccess: (_, dismissedId) => {
      toast.success('Warning dismissed successfully');
      
      // Update specific warning in cache
      queryClient.setQueryData(
        warningKeys.detail(dismissedId),
        (old: Record<string, unknown>) => old ? { ...old, isActive: false } : old
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: warningKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warningKeys.active() });
      queryClient.invalidateQueries({ queryKey: warningKeys.dismissed() });
    },
    onError: (error) => {
      console.error('Dismiss warning error:', error);
      toast.error('Failed to dismiss warning');
    },
  });
}

// Combined hook for warning management
export function useWarningManagement(defaultFilters: Record<string, unknown> = {}) {
  const warningsQuery = useWarnings(defaultFilters);
  const activeWarningsQuery = useActiveWarnings();
  const createMutation = useCreateWarning();
  const dismissMutation = useDismissWarning();

  return {
    // Data - extract from API response  
    warnings: warningsQuery.data?.data?.data || [],
    activeWarnings: activeWarningsQuery.data?.data?.data || [],
    
    // Loading states
    isLoading: warningsQuery.isLoading,
    isLoadingActive: activeWarningsQuery.isLoading,
    isCreating: createMutation.isPending,
    isDismissing: dismissMutation.isPending,
    
    // Error states
    error: warningsQuery.error || activeWarningsQuery.error,
    
    // Actions
    createWarning: createMutation.mutateAsync,
    dismissWarning: dismissMutation.mutateAsync,
    
    // Refetch functions
    refetch: () => {
      warningsQuery.refetch();
      activeWarningsQuery.refetch();
    },
    
    // Query objects for advanced usage
    warningsQuery,
    activeWarningsQuery,
  };
}
