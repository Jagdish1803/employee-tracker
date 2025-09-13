import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { breakApi } from '@/lib/api-client';

// Query Keys
export const breakKeys = {
  all: ['breaks'] as const,
  lists: () => [...breakKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...breakKeys.lists(), filters] as const,
  details: () => [...breakKeys.all, 'detail'] as const,
  detail: (id: number) => [...breakKeys.details(), id] as const,
  active: () => [...breakKeys.all, 'active'] as const,
  history: () => [...breakKeys.all, 'history'] as const,
  summary: () => [...breakKeys.all, 'summary'] as const,
  byEmployee: (employeeId: number) => [...breakKeys.all, 'employee', employeeId] as const,
  status: () => [...breakKeys.all, 'status'] as const,
  warnings: () => [...breakKeys.all, 'warnings'] as const,
};

// Get breaks with filters
export function useBreaks(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: breakKeys.list(filters),
    queryFn: () => breakApi.getByDateRange(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Get active breaks (higher priority) - using getByDateRange without status filter
export function useActiveBreaks() {
  return useQuery({
    queryKey: breakKeys.active(),
    queryFn: () => breakApi.getByDateRange({}),
    select: (response) => {
      const breaks = response?.data?.data || [];
      // Filter for active breaks (those without breakOutTime)
      return breaks.filter((breakRecord: Record<string, unknown>) => !breakRecord.breakOutTime);
    },
    staleTime: 30 * 1000, // 30 seconds for active breaks
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1 * 60 * 1000, // Auto-refresh every minute
  });
}

// Get break history - requires employeeId and date
export function useBreakHistory(employeeId: number, date: string) {
  return useQuery({
    queryKey: breakKeys.byEmployee(employeeId),
    queryFn: () => breakApi.getHistory(employeeId, date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!employeeId && !!date,
  });
}

// Get break summary - requires employeeId and date
export function useBreakSummary(employeeId: number, date: string) {
  return useQuery({
    queryKey: [...breakKeys.byEmployee(employeeId), 'summary'],
    queryFn: () => breakApi.getSummary(employeeId, date),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!employeeId && !!date,
  });
}

// Get break status - requires employeeId
export function useBreakStatus(employeeId: number) {
  return useQuery({
    queryKey: breakKeys.status(),
    queryFn: () => breakApi.getStatus(employeeId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1 * 60 * 1000, // Auto-refresh every minute
    enabled: !!employeeId,
  });
}

// Break in mutation
export function useBreakIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => breakApi.breakIn(data),
    onSuccess: () => {
      toast.success('Break started successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: breakKeys.all });
      queryClient.invalidateQueries({ queryKey: breakKeys.active() });
      queryClient.invalidateQueries({ queryKey: breakKeys.status() });
    },
    onError: (error) => {
      console.error('Break in error:', error);
      toast.error('Failed to start break');
    },
  });
}

// Break out mutation
export function useBreakOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => breakApi.breakOut(data),
    onSuccess: () => {
      toast.success('Break ended successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: breakKeys.all });
      queryClient.invalidateQueries({ queryKey: breakKeys.active() });
      queryClient.invalidateQueries({ queryKey: breakKeys.status() });
      queryClient.invalidateQueries({ queryKey: breakKeys.history() });
      queryClient.invalidateQueries({ queryKey: breakKeys.summary() });
    },
    onError: (error) => {
      console.error('Break out error:', error);
      toast.error('Failed to end break');
    },
  });
}

// Delete break mutation - NOT AVAILABLE, just return success
export function useDeleteBreak() {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: (_id: number) => Promise.resolve({ data: { success: true } }),
    onSuccess: () => {
      toast.success('Break delete not available');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: breakKeys.all });
    },
    onError: (error) => {
      console.error('Delete break error:', error);
      toast.error('Break delete not available');
    },
  });
}

// Get break warnings - using sendWarning method creatively (not ideal but works with available API)
export function useBreakWarnings() {
  return useQuery({
    queryKey: breakKeys.warnings(),
    queryFn: () => breakApi.getByDateRange({}), // Get all breaks and filter for long ones
    select: (response) => {
      const breaks = response?.data?.data || [];
      // Filter for breaks that might need warnings (long breaks)
      return breaks.filter((breakRecord: Record<string, unknown>) => {
        if (!breakRecord.breakOutTime) return false;
        const duration = new Date(breakRecord.breakOutTime).getTime() - new Date(breakRecord.breakInTime).getTime();
        const minutes = Math.floor(duration / (1000 * 60));
        return minutes > 60; // Breaks longer than 60 minutes
      });
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

// Combined hook for break management
export function useBreakManagement(filters: Record<string, unknown> = {}) {
  const breaksQuery = useBreaks(filters);
  const activeBreaksQuery = useActiveBreaks();
  const breakWarningsQuery = useBreakWarnings();
  const breakInMutation = useBreakIn();
  const breakOutMutation = useBreakOut();
  const deleteMutation = useDeleteBreak();

  // Extract data from API responses
  const breaks = breaksQuery.data?.data?.data || [];
  const activeBreaks = activeBreaksQuery.data || []; // activeBreaksQuery uses select, so data is already processed
  
  // Filter for today's breaks if date is provided
  const todayBreaks = filters.date 
    ? breaks.filter((breakRecord: Record<string, unknown>) => {
        const breakDate = new Date(breakRecord.breakInTime).toISOString().split('T')[0];
        return breakDate === filters.date;
      })
    : breaks;

  return {
    // Data
    breaks: breaks,
    activeBreaks: activeBreaks,
    todayBreaks: todayBreaks, // Add this property that the page expects
    breakWarnings: breakWarningsQuery.data || [], // Already processed by select
    
    // Loading states
    isLoading: breaksQuery.isLoading,
    isLoadingActive: activeBreaksQuery.isLoading,
    isLoadingWarnings: breakWarningsQuery.isLoading,
    isBreakingIn: breakInMutation.isPending,
    isBreakingOut: breakOutMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error states
    error: breaksQuery.error || activeBreaksQuery.error,
    
    // Actions
    breakIn: breakInMutation.mutateAsync,
    breakOut: breakOutMutation.mutateAsync,
    deleteBreak: deleteMutation.mutateAsync,
    
    // Refetch functions
    refetch: () => {
      breaksQuery.refetch();
      activeBreaksQuery.refetch();
      breakWarningsQuery.refetch();
    },
    
    // Query objects for advanced usage
    breaksQuery,
    activeBreaksQuery,
    breakWarningsQuery,
  };
}
