// src/lib/api/attendanceApi.ts
import { attendanceService } from '@/api/services/attendance.service';
import type { AttendanceRecord, UploadHistory } from '@/types';

interface AttendanceFilters {
  month?: string;
  year?: string;
  status?: string;
  search?: string;
}

interface UpdateAttendanceData {
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  lunchOutTime?: string;
  lunchInTime?: string;
  hoursWorked?: number;
  shift?: string;
  shiftStart?: string;
}

export const attendanceApi = {
  // Upload SRP file
  uploadSrpFile: async (formData: FormData) => {
    try {
      const response = await attendanceService.uploadSrpFile(formData);
      return response;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload file');
    }
  },

  // Get all attendance records with filters
  getAllAttendance: async (filters: AttendanceFilters = {}): Promise<AttendanceRecord[]> => {
    try {
      console.log('Fetching attendance with filters:', filters);

      // Use the unified endpoint that queries both tables
      const response: any = await attendanceService.getAll(filters);
      
      // Handle the response structure
      if (response && response.success) {
        const records = response.data || [];
        console.log('Unified endpoint returned:', records.length, 'records');
        return records;
      } else if (Array.isArray(response)) {
        console.log('Direct array response:', response.length, 'records');
        return response;
      } else {
        console.log('Unexpected response format, returning empty array');
        return [];
      }
    } catch (error: any) {
      console.error('Error in getAllAttendance:', error);
      // Return empty array to prevent crashes
      return [];
    }
  },

  // Get upload history
  getUploadHistory: async (): Promise<UploadHistory[]> => {
    try {
      console.log('Fetching upload history...');
      const response: any = await attendanceService.getUploadHistory();
      
      // Handle the response structure
      if (response && response.success) {
        const history = response.data || [];
        console.log('Upload history returned:', history.length, 'items');
        return history;
      } else if (Array.isArray(response)) {
        console.log('Direct array response:', response.length, 'items');
        return response;
      } else {
        console.log('Unexpected response format, returning empty array');
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching upload history:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Update attendance record
  updateAttendance: async (id: number, data: UpdateAttendanceData) => {
    try {
      const response = await attendanceService.updateRecord(id, data);
      return response;
    } catch (error: any) {
      console.error('Update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update attendance record');
    }
  },

  // Delete attendance record
  deleteAttendance: async (id: string | number) => {
    try {
      const response = await attendanceService.deleteRecord(id);
      return response;
    } catch (error: any) {
      console.error('Delete error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete attendance record');
    }
  },

  // Delete upload history
  deleteUploadHistory: async (id: number) => {
    try {
      const response = await attendanceService.deleteUploadHistory(id);
      return response;
    } catch (error: any) {
      console.error('Delete upload history error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete upload history');
    }
  },

  // Delete batch (whole file)
  deleteBatch: async (batchId: string) => {
    try {
      const response = await attendanceService.deleteBatch(batchId);
      return response;
    } catch (error: any) {
      console.error('Delete batch error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete batch');
    }
  },

  // Get employee attendance (for employee view)
  getEmployeeAttendance: async (employeeId: number, month?: string, year?: string) => {
    try {
      const params: any = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await attendanceService.getByEmployee(employeeId, params);
      return response;
    } catch (error: any) {
      console.error('Error fetching employee attendance:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch employee attendance');
    }
  },

  // Get employee attendance calendar
  getEmployeeCalendar: async (employeeId: number, month: string, year: string) => {
    try {
      const response = await attendanceService.getEmployeeCalendar(employeeId, month, year);
      return response;
    } catch (error: any) {
      console.error('Error fetching employee calendar:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch employee calendar');
    }
  },

  // Get employee attendance summary
  getEmployeeSummary: async (employeeId: number, month: string, year: string) => {
    try {
      const response = await attendanceService.getEmployeeSummary(employeeId, month, year);
      return response;
    } catch (error: any) {
      console.error('Error fetching employee summary:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch employee summary');
    }
  },
};

