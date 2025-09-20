// src/api/services/break.service.ts
import { apiClient } from '../clients/base';

export interface BreakRecord {
  id: number;
  employeeId: number;
  type: 'in' | 'out';
  timestamp: string;
  created_at?: string;
  updated_at?: string;
}

export interface BreakSummary {
  employeeId: number;
  totalBreakTime: number;
  breakCount: number;
  longestBreak: number;
  averageBreakTime: number;
}

export class BreakService {
  private readonly basePath = '/breaks';

  // Get all breaks
  async getAll(): Promise<BreakRecord[]> {
    try {
      const response = await apiClient.get(this.basePath);

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      console.error('BreakService.getAll error:', error);
      throw error;
    }
  }

  // Create break record
  async create(data: Omit<BreakRecord, 'id' | 'created_at' | 'updated_at'>): Promise<BreakRecord> {
    try {
      const response = await apiClient.post(this.basePath, data);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('BreakService.create error:', error);
      throw error;
    }
  }

  // Break in
  async breakIn(employeeId: number): Promise<BreakRecord> {
    try {
      const response = await apiClient.post(`${this.basePath}/in`, { employeeId });

      if (response.data && response.data.success !== undefined) {
        // Convert database break record to BreakRecord format
        const breakData = response.data.data;
        return {
          id: breakData.id,
          employeeId: breakData.employeeId,
          type: 'in' as const,
          timestamp: breakData.breakInTime,
          created_at: breakData.created_at
        };
      }

      return response.data;
    } catch (error) {
      console.error('BreakService.breakIn error:', error);
      throw error;
    }
  }

  // Break out
  async breakOut(employeeId: number): Promise<BreakRecord> {
    try {
      const response = await apiClient.post(`${this.basePath}/out`, { employeeId });

      if (response.data && response.data.success !== undefined) {
        // Convert database break record to BreakRecord format
        const breakData = response.data.data;
        return {
          id: breakData.id,
          employeeId: breakData.employeeId,
          type: 'out' as const,
          timestamp: breakData.breakOutTime,
          created_at: breakData.created_at
        };
      }

      return response.data;
    } catch (error) {
      console.error('BreakService.breakOut error:', error);
      throw error;
    }
  }

  // Get break status
  async getStatus(employeeId?: number): Promise<unknown> {
    try {
      const url = employeeId ? `${this.basePath}/status?employeeId=${employeeId}` : `${this.basePath}/status`;
      const response = await apiClient.get(url);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('BreakService.getStatus error:', error);
      throw error;
    }
  }

  // Get break history for employee
  async getHistory(employeeId: number, date?: string): Promise<BreakRecord[]> {
    try {
      const currentDate = date || new Date().toISOString().split('T')[0];
      const response = await apiClient.get(`${this.basePath}/history/${employeeId}?date=${currentDate}`);

      if (response.data && response.data.success !== undefined) {
        const breaks = response.data.data || [];
        // Convert database format to BreakRecord format
        return breaks.map((breakItem: Record<string, unknown>) => ({
          id: breakItem.id,
          employeeId: breakItem.employeeId,
          type: breakItem.breakOutTime ? 'out' : 'in',
          timestamp: breakItem.breakOutTime || breakItem.breakInTime,
          created_at: breakItem.createdAt
        }));
      }

      return response.data || [];
    } catch (error) {
      console.error('BreakService.getHistory error:', error);
      throw error;
    }
  }

  // Get break summary for employee
  async getSummary(employeeId: number): Promise<BreakSummary> {
    try {
      const response = await apiClient.get(`${this.basePath}/summary/${employeeId}`);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('BreakService.getSummary error:', error);
      throw error;
    }
  }

  // Get break warning
  async getWarning(): Promise<unknown> {
    try {
      const response = await apiClient.get(`${this.basePath}/warning`);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('BreakService.getWarning error:', error);
      throw error;
    }
  }
}

export const breakService = new BreakService();