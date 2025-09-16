// src/hooks/useAttendanceManagement.ts
import { useState, useMemo } from 'react';
import {
  useAttendanceRecords,
  useUploadHistory,
  useUpdateAttendanceRecord,
  useDeleteAttendanceRecord,
  useDeleteUploadHistory,
  useDeleteBatch,
  useUploadAttendanceFile
} from './useAttendanceQuery';
import type { AttendanceRecord } from '@/types';

export const useAttendanceManagement = () => {
  // Filter states
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editing states
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AttendanceRecord>>({});

  // Stabilize React Query parameters to prevent infinite loops
  const queryParams = useMemo(() => ({
    status: filterStatus === 'ALL' ? undefined : filterStatus,
    search: searchTerm
  }), [filterStatus, searchTerm]);

  // React Query hooks
  const {
    data: attendanceRecords = [],
    isLoading: loading,
    error: loadError,
    refetch: refetchAttendance
  } = useAttendanceRecords(queryParams);

  const {
    data: uploadHistory = [],
    isLoading: uploadHistoryLoading,
    refetch: refetchUploadHistory
  } = useUploadHistory();

  const updateMutation = useUpdateAttendanceRecord();
  const deleteMutation = useDeleteAttendanceRecord();
  const deleteUploadMutation = useDeleteUploadHistory();
  const deleteBatchMutation = useDeleteBatch();
  const uploadMutation = useUploadAttendanceFile();

  // Memoized filtered records (React Query already handles the filtering at API level, but this provides additional client-side filtering if needed)
  const filteredRecords = useMemo(() => {
    let filtered = attendanceRecords;

    // Additional client-side filtering if needed
    if (filterStatus && filterStatus !== 'ALL') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(record =>
        record.employeeName?.toLowerCase().includes(searchLower) ||
        record.employeeCode?.toLowerCase().includes(searchLower) ||
        record.department?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [attendanceRecords, filterStatus, searchTerm]);

  // Simplified load functions using React Query
  const loadAttendanceRecords = (forceRefresh = false) => {
    console.log('Refetching attendance records...');
    if (forceRefresh) {
      refetchAttendance();
    }
  };

  const loadUploadHistory = () => {
    console.log('Refetching upload history...');
    refetchUploadHistory();
  };

  // Upload file using React Query mutation
  const uploadFile = async (file: File, uploadDate?: string) => {
    return new Promise<boolean>((resolve, reject) => {
      uploadMutation.mutate({
        file,
        uploadDate: uploadDate || '',
      }, {
        onSuccess: (data) => {
          console.log('Upload successful:', data);
          resolve(true);
        },
        onError: (error) => {
          console.error('Upload failed:', error);
          reject(error);
        }
      });
    });
  };

  // Edit record functions
  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(typeof record.id === 'string' ? parseInt(record.id, 10) : record.id);
    setEditForm({
      status: record.status,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      lunchOutTime: record.lunchOutTime,
      lunchInTime: record.lunchInTime,
      hoursWorked: record.hoursWorked,
      shift: record.shift,
      shiftStart: record.shiftStart,
    });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    // Convert editForm to proper UpdateAttendanceData format
    const updateData = {
      status: editForm.status,
      checkInTime: editForm.checkInTime || undefined,
      checkOutTime: editForm.checkOutTime || undefined,
      lunchOutTime: editForm.lunchOutTime || undefined,
      lunchInTime: editForm.lunchInTime || undefined,
      hoursWorked: editForm.hoursWorked,
      shift: editForm.shift || undefined,
      shiftStart: editForm.shiftStart || undefined,
    };

    updateMutation.mutate({ id: editingRecord, data: updateData }, {
      onSuccess: () => {
        setEditingRecord(null);
        setEditForm({});
      }
    });
  };

  const handleFieldChange = (field: keyof AttendanceRecord, value: unknown) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Delete functions using React Query mutations
  const deleteRecord = (recordId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) {
      return;
    }

    const numericId = typeof recordId === 'string' ? parseInt(recordId) : recordId;
    deleteMutation.mutate(numericId);
  };

  const deleteUploadHistoryRecord = (uploadId: number) => {
    deleteUploadMutation.mutate(uploadId);
  };

  const deleteBatch = (batchId: string) => {
    if (!window.confirm('Are you sure you want to delete this entire batch? This will remove all attendance records from this upload. This action cannot be undone.')) {
      return;
    }
    deleteBatchMutation.mutate(batchId);
  };

  return {
    // Data
    attendanceRecords,
    filteredRecords,
    uploadHistory,

    // Loading states
    loading,
    uploadHistoryLoading,
    uploading: uploadMutation.isPending,
    saving: updateMutation.isPending,
    deleting: deleteMutation.isPending ? 'deleting' : null,

    // Edit states
    editingRecord,
    editForm,

    // Filter states
    filterStatus,
    searchTerm,
    setFilterStatus,
    setSearchTerm,

    // Functions
    loadAttendanceRecords,
    loadUploadHistory,
    uploadFile,
    handleEditRecord,
    handleCancelEdit,
    handleSaveEdit,
    handleFieldChange,
    deleteRecord,
    deleteUploadHistory: deleteUploadHistoryRecord,
    deleteBatch,

    // React Query states for advanced usage
    mutations: {
      upload: uploadMutation,
      update: updateMutation,
      delete: deleteMutation,
      deleteUpload: deleteUploadMutation,
      deleteBatch: deleteBatchMutation,
    },

    // Error states
    loadError,
    uploadError: uploadMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};