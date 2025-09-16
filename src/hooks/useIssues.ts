import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { issueApi } from '@/lib/api-client';
import type { Issue, CreateIssueRequest } from '@/types';

// Query Keys
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...issueKeys.lists(), filters] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: number) => [...issueKeys.details(), id] as const,
  pending: () => [...issueKeys.all, 'pending'] as const,
  resolved: () => [...issueKeys.all, 'resolved'] as const,
  byEmployee: (employeeId: number) => [...issueKeys.all, 'employee', employeeId] as const,
  byStatus: (status: string) => [...issueKeys.all, 'status', status] as const,
  byPriority: (priority: string) => [...issueKeys.all, 'priority', priority] as const,
};

// Get issues with filters
export function useIssues(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => issueApi.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Get pending issues (higher priority)
export function usePendingIssues() {
  return useQuery({
    queryKey: issueKeys.pending(),
    queryFn: () => issueApi.getAll(),
    select: (response) => {
      const issues = response?.data?.data || [];
      return issues.filter((issue: Issue) => issue.issueStatus === 'pending');
    },
    staleTime: 1 * 60 * 1000, // 1 minute for pending
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

// Get resolved issues
export function useResolvedIssues() {
  return useQuery({
    queryKey: issueKeys.resolved(),
    queryFn: () => issueApi.getAll(),
    select: (response) => {
      const issues = response?.data?.data || [];
      return issues.filter((issue: Issue) => issue.issueStatus === 'resolved');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

// Get single issue
export function useIssue(id: number) {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: () => issueApi.getAll(),
    select: (response) => {
      const issues = response?.data?.data || [];
      return issues.find((issue: Issue) => issue.id === id);
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

// Get issues by employee
export function useEmployeeIssues(employeeId: number) {
  return useQuery({
    queryKey: issueKeys.byEmployee(employeeId),
    queryFn: () => issueApi.getAll(),
    select: (response) => {
      const issues = response?.data?.data || [];
      return issues.filter((issue: Issue) => issue.employeeId === employeeId);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!employeeId,
  });
}

// Create issue mutation
export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIssueRequest) => issueApi.create(data),
    onSuccess: (newIssue, variables) => {
      toast.success('Issue created successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.pending() });
      
      // If employee-specific, invalidate that cache
      if (variables.employeeId) {
        queryClient.invalidateQueries({ 
          queryKey: issueKeys.byEmployee(variables.employeeId) 
        });
      }
    },
    onError: (error) => {
      console.error('Create issue error:', error);
      toast.error('Failed to create issue');
    },
  });
}

// Update issue mutation
export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => 
      issueApi.update(id, data),
    onSuccess: (updatedIssue, variables) => {
      toast.success('Issue updated successfully');
      
      // Update specific issue in cache
      queryClient.setQueryData(
        issueKeys.detail(variables.id),
        updatedIssue
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.pending() });
      queryClient.invalidateQueries({ queryKey: issueKeys.resolved() });
    },
    onError: (error) => {
      console.error('Update issue error:', error);
      toast.error('Failed to update issue');
    },
  });
}

// Resolve issue mutation
export function useResolveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resolution }: { id: number; resolution?: string }) => 
      issueApi.update(id, { 
        issueStatus: 'resolved',
        adminResponse: resolution || 'Issue resolved'
      }),
    onSuccess: (resolvedIssue, variables) => {
      toast.success('Issue resolved successfully');
      
      // Update specific issue in cache
      queryClient.setQueryData(
        issueKeys.detail(variables.id),
        resolvedIssue
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.pending() });
      queryClient.invalidateQueries({ queryKey: issueKeys.resolved() });
    },
    onError: (error) => {
      console.error('Resolve issue error:', error);
      toast.error('Failed to resolve issue');
    },
  });
}

// Delete issue mutation - NOT AVAILABLE IN API
export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: (_id: number) => {
      // Since delete is not available, we'll just invalidate queries
      return Promise.resolve({ data: { success: true } });
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (_, _deletedId) => {
      toast.success('Issue delete not available - update status instead');
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.pending() });
      queryClient.invalidateQueries({ queryKey: issueKeys.resolved() });
    },
    onError: (error) => {
      console.error('Delete issue error:', error);
      toast.error('Issue delete not available - update status instead');
    },
  });
}

// Combined hook for issue management
export function useIssueManagement(defaultFilters: Record<string, unknown> = {}) {
  const issuesQuery = useIssues(defaultFilters);
  const pendingIssuesQuery = usePendingIssues();
  const resolvedIssuesQuery = useResolvedIssues();
  const createMutation = useCreateIssue();
  const updateMutation = useUpdateIssue();
  const resolveMutation = useResolveIssue();
  const deleteMutation = useDeleteIssue();

  return {
    // Data - extract from API response
    issues: issuesQuery.data?.data?.data || [],
    pendingIssues: pendingIssuesQuery.data || [],
    resolvedIssues: resolvedIssuesQuery.data || [],
    
    // Loading states
    isLoading: issuesQuery.isLoading,
    isLoadingPending: pendingIssuesQuery.isLoading,
    isLoadingResolved: resolvedIssuesQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isResolving: resolveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error states
    error: issuesQuery.error || pendingIssuesQuery.error || resolvedIssuesQuery.error,
    
    // Actions
    createIssue: createMutation.mutateAsync,
    updateIssue: updateMutation.mutateAsync,
    resolveIssue: resolveMutation.mutateAsync,
    deleteIssue: deleteMutation.mutateAsync,
    
    // Refetch functions
    refetch: () => {
      issuesQuery.refetch();
      pendingIssuesQuery.refetch();
      resolvedIssuesQuery.refetch();
    },
    
    // Query objects for advanced usage
    issuesQuery,
    pendingIssuesQuery,
    resolvedIssuesQuery,
  };
}
