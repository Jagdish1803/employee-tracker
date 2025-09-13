// src/api/services/warning.service.ts
import { apiClient } from '../clients/base';

export interface Warning {
  id: number;
  employeeId: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: number;
}

export interface CreateWarningData {
  employeeId: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface UpdateWarningData {
  type?: string;
  message?: string;
  severity?: 'low' | 'medium' | 'high';
  status?: 'active' | 'resolved' | 'dismissed';
  resolved_by?: number;
}

export class WarningService {
  private readonly basePath = '/warnings';

  // Get all warnings
  async getAll(): Promise<Warning[]> {
    try {
      const response = await apiClient.get(this.basePath);

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      console.error('WarningService.getAll error:', error);
      throw error;
    }
  }

  // Get warning by ID
  async getById(id: number): Promise<Warning> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('WarningService.getById error:', error);
      throw error;
    }
  }

  // Create warning
  async create(data: CreateWarningData): Promise<Warning> {
    try {
      const response = await apiClient.post(this.basePath, data);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('WarningService.create error:', error);
      throw error;
    }
  }

  // Update warning
  async update(id: number, data: UpdateWarningData): Promise<Warning> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, data);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('WarningService.update error:', error);
      throw error;
    }
  }

  // Delete warning
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('WarningService.delete error:', error);
      throw error;
    }
  }

  // Get warnings by employee
  async getByEmployee(employeeId: number): Promise<Warning[]> {
    try {
      const response = await apiClient.get(this.basePath, {
        params: { employeeId }
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      console.error('WarningService.getByEmployee error:', error);
      throw error;
    }
  }

  // Resolve warning
  async resolve(id: number, resolvedBy: number): Promise<Warning> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, {
        status: 'resolved',
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString()
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('WarningService.resolve error:', error);
      throw error;
    }
  }

  // Dismiss warning
  async dismiss(id: number): Promise<Warning> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, {
        status: 'dismissed'
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('WarningService.dismiss error:', error);
      throw error;
    }
  }
}

export const warningService = new WarningService();