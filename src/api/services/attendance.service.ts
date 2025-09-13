// src/api/services/attendance.service.ts
import { apiClient } from '../clients/base';
import {
  AttendanceRecord,
  Attendance,
  AttendanceUploadRequest,
  UploadHistory
} from '@/types';

interface AttendanceFilters {
  month?: string;
  year?: string;
  status?: string;
  search?: string;
  employeeId?: number;
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

export class AttendanceService {
  private readonly basePath = '/attendance';

  // Get all attendance records with optional filters
  async getAll(params?: AttendanceFilters): Promise<AttendanceRecord[]> {
    try {
      console.log('AttendanceService.getAll called with params:', params);
      const response = await apiClient.get(this.basePath, { params });

      console.log('AttendanceService.getAll response status:', response.status);
      console.log('AttendanceService.getAll response data type:', typeof response.data);

      // Handle new consistent response structure
      if (response.data && response.data.success !== undefined) {
        const records = response.data.data || [];
        console.log('AttendanceService.getAll extracted records:', records.length);
        return records;
      }

      // Handle direct array response (legacy support)
      if (Array.isArray(response.data)) {
        console.log('AttendanceService.getAll direct array response:', response.data.length);
        return response.data;
      }

      console.warn('AttendanceService.getAll unexpected response format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching attendance in service:', error);
      throw error;
    }
  }

  // Get optimized attendance records
  async getOptimized(params?: AttendanceFilters): Promise<AttendanceRecord[]> {
    try {
      // Use the standard endpoint instead of /optimized
      const response = await apiClient.get(`${this.basePath}`, { params });
      
      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  }

  // Get admin attendance records
  async getAdminRecords(params?: AttendanceFilters): Promise<AttendanceRecord[]> {
    try {
      const response = await apiClient.get(`${this.basePath}/admin/records`, { params });
      
      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching admin records:', error);
      throw error;
    }
  }

  // Get attendance by employee
  async getByEmployee(employeeId: number, params?: { month?: string; year?: string }): Promise<AttendanceRecord[]> {
    try {
      console.log(`AttendanceService.getByEmployee called for employee ${employeeId} with params:`, params);
      const response = await apiClient.get(`${this.basePath}/employee/${employeeId}`, { params });

      console.log('AttendanceService.getByEmployee response status:', response.status);
      console.log('AttendanceService.getByEmployee response data type:', typeof response.data);

      // Handle new consistent response structure
      if (response.data && response.data.success !== undefined) {
        const records = response.data.data || [];
        console.log(`AttendanceService.getByEmployee extracted ${records.length} records for employee ${employeeId}`);
        return records;
      }

      // Handle direct array response (legacy support)
      if (Array.isArray(response.data)) {
        console.log(`AttendanceService.getByEmployee direct array response: ${response.data.length} records for employee ${employeeId}`);
        return response.data;
      }

      console.warn(`AttendanceService.getByEmployee unexpected response format for employee ${employeeId}:`, response.data);
      return [];
    } catch (error) {
      console.error(`Error fetching employee ${employeeId} attendance in service:`, error);
      throw error;
    }
  }

  // Get employee calendar
  async getEmployeeCalendar(employeeId: number, month: string, year: string): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.get(`${this.basePath}/employee/${employeeId}/calendar`, {
        params: { month, year }
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data || {};
      }

      return response.data || {};
    } catch (error) {
      console.error('Error fetching employee calendar:', error);
      throw error;
    }
  }

  // Get employee summary
  async getEmployeeSummary(employeeId: number, month: string, year: string): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.get(`${this.basePath}/employee/${employeeId}/summary`, {
        params: { month, year }
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data || {};
      }

      return response.data || {};
    } catch (error) {
      console.error('Error fetching employee summary:', error);
      throw error;
    }
  }

  // Upload SRP file
  async uploadSrpFile(formData: FormData): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.post(`${this.basePath}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error uploading SRP file:', error);
      throw error;
    }
  }

  // Upload CSV file (legacy)
  async uploadCSV(file: File): Promise<Record<string, unknown>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`${this.basePath}/upload-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error uploading CSV file:', error);
      throw error;
    }
  }

  // Upload Flowace CSV file
  async uploadFlowaceCSV(file: File): Promise<Record<string, unknown>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`${this.basePath}/upload-flowace-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error uploading Flowace CSV file:', error);
      throw error;
    }
  }

  // Get upload history
  async getUploadHistory(): Promise<UploadHistory[]> {
    try {
      const response = await apiClient.get(`${this.basePath}/upload-history`);
      
      // Handle wrapped response
      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }
      
      // Handle direct array response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching upload history:', error);
      throw error;
    }
  }

  // Delete upload history entry
  async deleteUploadHistory(id: number): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.basePath}/upload-history`, { params: { id } });

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error deleting upload history:', error);
      throw error;
    }
  }

  // Delete entire batch/file
  async deleteBatch(batchId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.basePath}/delete-batch`, { params: { batchId } });

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }

  // Update attendance record
  async updateRecord(id: number, data: UpdateAttendanceData): Promise<AttendanceRecord> {
    try {
      const response = await apiClient.put(`${this.basePath}/record/${id}`, data);

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  }

  // Delete attendance record
  async deleteRecord(id: string | number): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.basePath}/record/${id}`);

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  }

  // Generic upload method
  async upload(data: AttendanceUploadRequest): Promise<Record<string, unknown>> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('month', data.month);
      formData.append('year', data.year);

      const response = await apiClient.post(`${this.basePath}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Update attendance (legacy method)
  async update(id: number, data: Partial<Attendance>): Promise<AttendanceRecord> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, data);

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  // Delete attendance (legacy method)
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`);

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return response.data || {};
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  }

  // Download template
  async downloadTemplate(): Promise<void> {
    try {
      window.open(`${apiClient.defaults.baseURL}${this.basePath}/template`, '_blank');
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  }
}

export const attendanceService = new AttendanceService();