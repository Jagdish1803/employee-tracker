// src/api/services/flowace.service.ts
import { apiClient } from '../clients/base';

export interface FlowaceRecord {
  id: string;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  memberEmail?: string;
  teams?: string;
  date: string;
  workStartTime?: string;
  workEndTime?: string;
  loggedHours?: number;
  activeHours?: number;
  idleHours?: number;
  classifiedHours?: number;
  unclassifiedHours?: number;
  productiveHours?: number;
  unproductiveHours?: number;
  neutralHours?: number;
  availableHours?: number;
  missingHours?: number;
  activityPercentage?: number;
  classifiedPercentage?: number;
  productivityPercentage?: number;
  classifiedBillableDuration?: number;
  classifiedNonBillableDuration?: number;
  batchId: string;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  totalHours?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'BREAK' | 'MEETING';
  productivityScore?: number;
  screenshotCount?: number;
  activityLevel?: number;
  // Employee relation
  employee?: {
    id: number;
    name: string;
    employeeCode: string;
    department?: string;
  };
  // Raw CSV data
  rawData?: string[];
}

export interface FlowaceUploadHistory {
  id: string;
  batchId: string;
  filename: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  uploadedAt: string;
  errors?: Array<{ row: number; error: string }>;
  summary?: Record<string, unknown>;
}

export interface CreateFlowaceRequest {
  employeeCode: string;
  employeeName: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BREAK' | 'MEETING';
  productivityScore?: number;
  screenshotCount?: number;
  activityLevel?: number;
}

export class FlowaceService {
  private readonly basePath = '/flowace';

  // Get all flowace records
  async getAll(): Promise<{ success: boolean; records: FlowaceRecord[] }> {
    try {
      const response = await apiClient.get(this.basePath);
      const apiData = response.data;

      // Handle the API response structure: { success: true, data: [...], meta: {...} }
      if (apiData.success && Array.isArray(apiData.data)) {
        return { success: true, records: apiData.data };
      } else {
        console.warn('Unexpected API response structure:', apiData);
        return { success: false, records: [] };
      }
    } catch (error) {
      console.error('Error fetching flowace records:', error);
      return { success: false, records: [] };
    }
  }

  // Get flowace records by date range
  async getByDateRange(dateFrom: string, dateTo: string): Promise<{ success: boolean; records: FlowaceRecord[] }> {
    try {
      const response = await apiClient.get(`${this.basePath}?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching flowace records by date range:', error);
      return { success: false, records: [] };
    }
  }

  // Get flowace records by employee
  async getByEmployee(employeeId: number): Promise<{ success: boolean; records: FlowaceRecord[] }> {
    try {
      const response = await apiClient.get(`${this.basePath}?employeeId=${employeeId}`);
      const apiData = response.data;

      // Handle the API response structure: { success: true, data: [...], meta: {...} }
      if (apiData.success && Array.isArray(apiData.data)) {
        return { success: true, records: apiData.data };
      } else {
        console.warn('Unexpected API response structure:', apiData);
        return { success: false, records: [] };
      }
    } catch (error) {
      console.error('Error fetching flowace records by employee:', error);
      return { success: false, records: [] };
    }
  }

  // Create flowace record
  async create(data: CreateFlowaceRequest): Promise<{ success: boolean; data?: FlowaceRecord; error?: string }> {
    try {
      const response = await apiClient.post(this.basePath, data);
      return response.data;
    } catch (error) {
      console.error('Error creating flowace record:', error);
      return { success: false, error: 'Failed to create flowace record' };
    }
  }

  // Upload CSV file
  async uploadCSV(file: File, uploadDate?: string): Promise<{
    success: boolean;
    data?: {
      batchId: string;
      processedRecords: number;
      totalRecords: number;
      errorRecords: number;
      status: string;
      errors?: Array<{ row: number; error: string }>;
      filename: string;
    };
    error?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add upload date if provided
      if (uploadDate) {
        formData.append('uploadDate', uploadDate);
      }

      // Use native fetch instead of apiClient to avoid Content-Type header issues
      const response = await fetch('/api/flowace/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it automatically
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading flowace CSV:', error);
      return { success: false, error: 'Failed to upload CSV file' };
    }
  }

  // Get upload history
  async getUploadHistory(): Promise<{ success: boolean; history: FlowaceUploadHistory[] }> {
    try {
      const response = await apiClient.get(`${this.basePath}/upload-history`);
      const apiData = response.data;

      // Handle the API response structure
      if (apiData.success && Array.isArray(apiData.history)) {
        return { success: true, history: apiData.history };
      } else {
        console.warn('Unexpected upload history API response structure:', apiData);
        return { success: false, history: [] };
      }
    } catch (error) {
      console.error('Error fetching upload history:', error);
      return { success: false, history: [] };
    }
  }

  // Delete upload history entry
  async deleteUploadHistory(batchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/upload-history/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting upload history:', error);
      return { success: false, error: 'Failed to delete upload history' };
    }
  }

  // Delete flowace records by batch
  async deleteByBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/batch/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting flowace records by batch:', error);
      return { success: false, error: 'Failed to delete flowace records' };
    }
  }

  // Delete individual flowace record
  async deleteRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}?id=${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting flowace record:', error);
      return { success: false, error: 'Failed to delete flowace record' };
    }
  }
}

export const flowaceService = new FlowaceService();