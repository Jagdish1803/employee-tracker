// src/api/services/assignment.service.ts
import { apiClient } from '../clients/base';
import { Assignment, Employee, Tag } from '@/types';

export interface AssignmentWithRelations extends Assignment {
  employee?: Employee;
  tag?: Tag;
}

export interface CreateAssignmentData {
  employeeId: number;
  tagId: number;
  isMandatory: boolean;
}

export interface UpdateAssignmentData {
  isMandatory?: boolean;
}

export interface BulkAssignmentData {
  employeeIds: number[];
  tagIds: number[];
  isMandatory: boolean;
}

export class AssignmentService {
  private readonly basePath = '/assignments';

  // Get all assignments
  async getAll(): Promise<AssignmentWithRelations[]> {
    try {
      const response = await apiClient.get(this.basePath);
      return response.data?.data || [];
    } catch (error) {
      console.error('AssignmentService.getAll error:', error);
      throw error;
    }
  }

  // Get assignment by ID
  async getById(id: number): Promise<AssignmentWithRelations> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);
      return response.data?.data;
    } catch (error) {
      console.error('AssignmentService.getById error:', error);
      throw error;
    }
  }

  // Create assignment
  async create(data: CreateAssignmentData): Promise<AssignmentWithRelations> {
    try {
      const response = await apiClient.post(this.basePath, data);
      return response.data?.data;
    } catch (error) {
      console.error('AssignmentService.create error:', error);
      throw error;
    }
  }

  // Update assignment
  async update(id: number, data: UpdateAssignmentData): Promise<AssignmentWithRelations> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, data);
      return response.data?.data;
    } catch (error) {
      console.error('AssignmentService.update error:', error);
      throw error;
    }
  }

  // Delete assignment
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('AssignmentService.delete error:', error);
      throw error;
    }
  }

  // Get assignments by employee
  async getByEmployee(employeeId: number): Promise<AssignmentWithRelations[]> {
    try {
      const response = await apiClient.get(this.basePath, {
        params: { employeeId }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('AssignmentService.getByEmployee error:', error);
      throw error;
    }
  }

  // Create bulk assignments
  async createBulk(data: BulkAssignmentData): Promise<AssignmentWithRelations[]> {
    try {
      const response = await apiClient.post(`${this.basePath}/bulk`, data);
      return response.data?.data || [];
    } catch (error) {
      console.error('AssignmentService.createBulk error:', error);
      throw error;
    }
  }

  // Toggle mandatory status
  async toggleMandatory(id: number, isMandatory: boolean): Promise<AssignmentWithRelations> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, { isMandatory });
      return response.data?.data;
    } catch (error) {
      console.error('AssignmentService.toggleMandatory error:', error);
      throw error;
    }
  }
}

export const assignmentService = new AssignmentService();