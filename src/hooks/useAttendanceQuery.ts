// src/hooks/useAttendanceQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { attendanceApi } from '@/lib/api/attendanceApi';
import type { AttendanceRecord, UploadHistory } from '@/types';

// Query Keys
export const attendanceKeys = {
  all: ['attendance'] as const,
  records: (params?: Record<string, unknown>) => ['attendance', 'records', params] as const,
  uploadHistory: () => ['attendance', 'upload-history'] as const,
  record: (id: number) => ['attendance', 'record', id] as const,
};

// Get all attendance records with enhanced caching and background updates
export function useAttendanceRecords(params?: {
  month?: string;
  year?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: attendanceKeys.records(params),
    queryFn: async () => {
      try {
        const response = await attendanceApi.getAllAttendance({
          month: params?.month,
          year: params?.year,
          status: params?.status === 'ALL' ? undefined : params?.status,
          search: params?.search
        });
        return response;
      } catch {
        // Return empty array instead of throwing to prevent infinite loading
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Disable automatic refetching
    refetchOnReconnect: false, // Disable automatic refetching
    refetchInterval: false, // Disable background refetch
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      // Only retry on network errors, not on data errors
      if (failureCount < 2 && error.message.includes('network')) {
        return true;
      }
      return false;
    }, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

// Get upload history with enhanced caching
export function useUploadHistory() {
  return useQuery({
    queryKey: attendanceKeys.uploadHistory(),
    queryFn: async () => {
      try {
        const response = await attendanceApi.getUploadHistory();
        return response;
      } catch {
        // Return empty array instead of throwing
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - upload history changes less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });
}


// Update attendance record mutation
export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Record<string, unknown> }) => {
      return attendanceApi.updateAttendance(id, data);
    },
    onSuccess: (result, variables) => {
      toast.success('Attendance record updated successfully');
      
      // Update the specific record in cache if it's a number
      if (typeof variables.id === 'number') {
        queryClient.setQueryData(
          attendanceKeys.record(variables.id),
          result
        );
      }
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: () => {
      toast.error('Failed to update attendance record');
    },
  });
}

// Delete attendance record mutation with optimistic updates
export function useDeleteAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => attendanceApi.deleteAttendance(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: attendanceKeys.records() });
      
      // Snapshot the previous value
      const previousRecords = queryClient.getQueryData(attendanceKeys.records());
      
      // Optimistically remove the record
      queryClient.setQueryData(
        attendanceKeys.records(),
        (old: AttendanceRecord[]) => {
          if (!old) return [];
          // Convert both IDs to strings for comparison to handle mixed types
          return old.filter((record: AttendanceRecord) => String(record.id) !== String(deletedId));
        }
      );
      
      return { previousRecords };
    },
    onSuccess: (_, deletedId) => {
      toast.success('Attendance record deleted successfully');

      // Remove specific record from cache and ensure fresh data
      queryClient.removeQueries({ queryKey: attendanceKeys.record(deletedId) });

      // Invalidate and refetch the records list to ensure UI is up to date
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
    },
    onError: (error, deletedId, context) => {
      // Rollback optimistic update
      if (context?.previousRecords) {
        queryClient.setQueryData(attendanceKeys.records(), context.previousRecords);
      }
      
      toast.error('Failed to delete attendance record');
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
    },
  });
}

// Delete upload history mutation
export function useDeleteUploadHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => attendanceApi.deleteUploadHistory(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: attendanceKeys.uploadHistory() });

      // Snapshot the previous value
      const previousUploadHistory = queryClient.getQueryData(attendanceKeys.uploadHistory());

      // Optimistically remove the upload history entry
      queryClient.setQueryData(
        attendanceKeys.uploadHistory(),
        (old: UploadHistory[]) => {
          if (!old) return [];
          return old.filter((upload: UploadHistory) => upload.id !== deletedId);
        }
      );

      return { previousUploadHistory };
    },
    onSuccess: () => {
      toast.success('Upload history deleted successfully');

      // Force refresh both upload history and attendance records
      queryClient.invalidateQueries({ queryKey: attendanceKeys.uploadHistory() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });

      // Remove all cached data to force fresh fetch
      queryClient.removeQueries({ queryKey: attendanceKeys.uploadHistory() });
      queryClient.removeQueries({ queryKey: attendanceKeys.records() });
    },
    onError: (error, deletedId, context) => {
      // Rollback optimistic update
      if (context?.previousUploadHistory) {
        queryClient.setQueryData(attendanceKeys.uploadHistory(), context.previousUploadHistory);
      }

      toast.error('Failed to delete upload history');
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: attendanceKeys.uploadHistory() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
    },
  });
}

// Delete batch (whole file) mutation with optimistic updates
export function useDeleteBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => attendanceApi.deleteBatch(batchId),
    onMutate: async (batchId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: attendanceKeys.uploadHistory() });
      await queryClient.cancelQueries({ queryKey: attendanceKeys.records() });
      
      // Snapshot the previous values
      const previousUploadHistory = queryClient.getQueryData(attendanceKeys.uploadHistory());
      const previousRecords = queryClient.getQueryData(attendanceKeys.records());
      
      // Optimistically remove the upload history entry
      queryClient.setQueryData(
        attendanceKeys.uploadHistory(),
        (old: UploadHistory[]) => old?.filter((upload: UploadHistory) => upload.batchId !== batchId) || []
      );
      
      return { previousUploadHistory, previousRecords };
    },
    onSuccess: () => {
      toast.success('File and all related records deleted successfully');

      // Ensure both upload history and records are refreshed
      queryClient.invalidateQueries({ queryKey: attendanceKeys.uploadHistory() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
    },
    onError: (error, batchId, context) => {
      // Rollback optimistic updates
      if (context?.previousUploadHistory) {
        queryClient.setQueryData(attendanceKeys.uploadHistory(), context.previousUploadHistory);
      }
      if (context?.previousRecords) {
        queryClient.setQueryData(attendanceKeys.records(), context.previousRecords);
      }
      
      toast.error('Failed to delete file');
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: attendanceKeys.uploadHistory() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
    },
  });
}

// Employee-specific attendance queries
export function useEmployeeCalendar(employeeId: number, month: string, year: string) {
  return useQuery({
    queryKey: ['attendance', 'employee-calendar', employeeId, month, year],
    queryFn: () => attendanceApi.getEmployeeCalendar(employeeId, month, year),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!employeeId && !!month && !!year,
  });
}

export function useEmployeeSummary(employeeId: number, month: string, year: string) {
  return useQuery({
    queryKey: ['attendance', 'employee-summary', employeeId, month, year],
    queryFn: () => attendanceApi.getEmployeeSummary(employeeId, month, year),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!employeeId && !!month && !!year,
  });
}

// Optimized file upload mutation with progress tracking
export function useUploadAttendanceFile() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({
      file,
      uploadDate,
      onProgress
    }: {
      file: File;
      uploadDate: string;
      onProgress?: (progress: number) => void;
    }) => {

      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadDate', uploadDate);

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            onProgress?.(progress);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || `HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        // Handle network errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout'));
        });

        // Configure request
        xhr.open('POST', '/api/attendance/upload');
        xhr.timeout = 300000; // 5 minutes timeout

        // Send request
        xhr.send(formData);
      });
    },
    onMutate: () => {
      // Reset progress at start
      setUploadProgress(0);
    },
    onSuccess: (data) => {
      setUploadProgress(100);

      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.uploadHistory() });

      // Show success message
      toast.success(`File uploaded successfully! Processed ${(data as { data?: { processedRecords?: number } })?.data?.processedRecords || 0} records`);
    },
    onError: (error) => {
      setUploadProgress(0);

      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
    },
    onSettled: () => {
      // Reset progress after completion (success or error)
      setTimeout(() => setUploadProgress(0), 2000);
    }
  });

  return {
    ...mutation,
    uploadProgress,
    setUploadProgress
  };
}

