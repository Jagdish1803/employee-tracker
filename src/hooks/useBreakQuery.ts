import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { breakService, BreakRecord } from '@/api/services/break.service';
import { toast } from 'sonner';

// Enhanced types for break status
export interface BreakStatus {
  id: number;
  employeeId: number;
  breakDate: string;
  breakInTime: string;
  breakOutTime?: string;
  breakDuration: number;
  isActive: boolean;
  warningSent: boolean;
  createdAt: string;
}

export interface EnhancedBreakRecord extends BreakRecord {
  breakInTime?: string;
  breakOutTime?: string;
}

// Query keys
export const breakKeys = {
  all: ['breaks'] as const,
  status: (employeeId: number) => [...breakKeys.all, 'status', employeeId] as const,
  history: (employeeId: number, date: string) => [...breakKeys.all, 'history', employeeId, date] as const,
  summary: (employeeId: number) => [...breakKeys.all, 'summary', employeeId] as const,
};

// Break status query
export function useBreakStatus(employeeId: number | null) {
  return useQuery<BreakStatus | null>({
    queryKey: breakKeys.status(employeeId || 0),
    queryFn: async () => {
      const result = await breakService.getStatus(employeeId!);
      // Transform API response to BreakStatus
      if (result && typeof result === 'object' && 'isActive' in result && result.isActive) {
        return result as BreakStatus;
      }
      return null;
    },
    enabled: !!employeeId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: (query) => {
      // Refetch every 5 seconds if there's an active break
      const data = query.state.data;
      return data && data.isActive ? 5 * 1000 : false;
    },
    retry: 2,
  });
}

// Break history query
export function useBreakHistory(employeeId: number | null, date: string) {
  return useQuery<EnhancedBreakRecord[]>({
    queryKey: breakKeys.history(employeeId || 0, date),
    queryFn: () => breakService.getHistory(employeeId!, date),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Break summary query
export function useBreakSummary(employeeId: number | null) {
  return useQuery({
    queryKey: breakKeys.summary(employeeId || 0),
    queryFn: () => breakService.getSummary(employeeId!),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

// Break in mutation
export function useBreakIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) => breakService.breakIn(employeeId),
    onMutate: async (employeeId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: breakKeys.status(employeeId) });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(breakKeys.status(employeeId));

      // Optimistically update to show break started
      queryClient.setQueryData(breakKeys.status(employeeId), {
        id: Date.now(), // Temporary ID
        employeeId,
        breakDate: new Date().toISOString().split('T')[0],
        breakInTime: new Date().toISOString(),
        isActive: true,
        warningSent: false,
        createdAt: new Date().toISOString(),
      });

      return { previousStatus };
    },
    onSuccess: (data, employeeId) => {
      // Update status with real data from server
      queryClient.setQueryData(breakKeys.status(employeeId), data);

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: breakKeys.history(employeeId, new Date().toISOString().split('T')[0]) });
      queryClient.invalidateQueries({ queryKey: breakKeys.summary(employeeId) });

      toast.success('Break started successfully', {
        description: 'Your break has been logged. Remember to end it when you return.',
      });
    },
    onError: (error, employeeId, context) => {
      // Rollback optimistic update
      if (context?.previousStatus) {
        queryClient.setQueryData(breakKeys.status(employeeId), context.previousStatus);
      }

      toast.error('Failed to start break', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: (_, __, employeeId) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: breakKeys.status(employeeId) });
    },
  });
}

// Break out mutation
export function useBreakOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) => breakService.breakOut(employeeId),
    onMutate: async (employeeId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: breakKeys.status(employeeId) });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(breakKeys.status(employeeId));

      // Optimistically update to show break ended
      queryClient.setQueryData(breakKeys.status(employeeId), null);

      return { previousStatus };
    },
    onSuccess: (data, employeeId) => {
      // Clear break status
      queryClient.setQueryData(breakKeys.status(employeeId), null);

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: breakKeys.history(employeeId, new Date().toISOString().split('T')[0]) });
      queryClient.invalidateQueries({ queryKey: breakKeys.summary(employeeId) });

      // Calculate duration for toast message
      const currentStatus = queryClient.getQueryData(breakKeys.status(employeeId)) as BreakStatus | null;
      let duration = 0;

      if (currentStatus?.breakInTime) {
        const breakInTime = new Date(currentStatus.breakInTime);
        const now = new Date();
        duration = Math.floor((now.getTime() - breakInTime.getTime()) / (1000 * 60));
      }

      if (duration > 20) {
        toast.warning(`Break ended - ${duration} minutes`, {
          description: 'Your break exceeded the recommended 20 minutes. Please be mindful of break duration.',
        });
      } else {
        toast.success(`Break ended successfully`, {
          description: `Total duration: ${duration} minutes. Welcome back!`,
        });
      }
    },
    onError: (error, employeeId, context) => {
      // Rollback optimistic update
      if (context?.previousStatus) {
        queryClient.setQueryData(breakKeys.status(employeeId), context.previousStatus);
      }

      toast.error('Failed to end break', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
    onSettled: (_, __, employeeId) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: breakKeys.status(employeeId) });
    },
  });
}