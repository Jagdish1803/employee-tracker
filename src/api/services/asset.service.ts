// src/api/services/asset.service.ts
import { apiClient } from '../clients/base';

export interface Asset {
  id: number;
  assetName: string;
  assetType: string;
  assetTag?: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  condition: string;
  status: string;
}

export interface AssetAssignment {
  id: number;
  assetId: number;
  employeeId: number;
  assignedDate: string;
  returnDate?: string;
  status: 'ACTIVE' | 'RETURNED' | 'LOST' | 'DAMAGED_RETURN';
  assignmentNotes?: string;
  returnNotes?: string;
  returnCondition?: string;
  asset: Asset;
}

export class AssetService {
  private readonly basePath = '/assets';

  // Get all assets
  async getAll(): Promise<Asset[]> {
    try {
      const response = await apiClient.get(this.basePath);

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  // Get asset assignments for a specific employee
  async getEmployeeAssignments(employeeId: number): Promise<AssetAssignment[]> {
    try {
      const response = await apiClient.get(`${this.basePath}/history?employeeId=${employeeId}`);

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  // Get asset history
  async getHistory(): Promise<AssetAssignment[]> {
    try {
      const response = await apiClient.get(`${this.basePath}/history`);

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  // Assign asset to employee
  async assign(data: { assetId: number; employeeId: number; assignmentNotes?: string }): Promise<AssetAssignment> {
    try {
      const response = await apiClient.post(`${this.basePath}/assign`, data);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get asset by id
  async getById(id: number): Promise<Asset> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const assetService = new AssetService();