// src/api/services/log.service.ts
import { apiClient } from '../clients/base';

export class LogService {
  private readonly basePath = '/logs';

  async getByDate(employeeId: number, date: string): Promise<unknown[]> {
    try {
      const response = await apiClient.get(`${this.basePath}/by-date`, {
        params: { employeeId, date }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching logs by date:', error);
      return [];
    }
  }

  async getByDateRange(params: Record<string, unknown>): Promise<unknown[]> {
    try {
      const response = await apiClient.get(`${this.basePath}`, { params });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching logs by date range:', error);
      return [];
    }
  }

  async submit(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.post(this.basePath, data);
      return response.data;
    } catch (error) {
      console.error('Error submitting log:', error);
      throw error;
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating log:', error);
      throw error;
    }
  }
}

export const logService = new LogService();