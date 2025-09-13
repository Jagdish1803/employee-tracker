// src/api/services/assignment.service.ts
import { apiClient } from '../clients/base';

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  employeeId: number;
  assignedBy: number;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface CreateAssignmentData {
  title: string;
  description?: string;
  employeeId: number;
  assignedBy: number;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface BulkAssignmentData {
  title: string;
  description?: string;
  employeeIds: number[];
  assignedBy: number;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export class AssignmentService {
  private readonly basePath = '/assignments';

  // Get all assignments
  async getAll(): Promise<Assignment[]> {
    try {
      const response = await apiClient.get(this.basePath);

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      console.error('AssignmentService.getAll error:', error);
      throw error;
    }
  }

  // Get assignment by ID
  async getById(id: number): Promise<Assignment> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('AssignmentService.getById error:', error);
      throw error;
    }
  }

  // Create assignment
  async create(data: CreateAssignmentData): Promise<Assignment> {
    try {
      const response = await apiClient.post(this.basePath, data);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('AssignmentService.create error:', error);
      throw error;
    }
  }

  // Update assignment
  async update(id: number, data: UpdateAssignmentData): Promise<Assignment> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, data);

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
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
  async getByEmployee(employeeId: number): Promise<Assignment[]> {
    try {
      const response = await apiClient.get(this.basePath, {
        params: { employeeId }
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      console.error('AssignmentService.getByEmployee error:', error);
      throw error;
    }
  }

  // Get assignments by status
  async getByStatus(status: Assignment['status']): Promise<Assignment[]> {
    try {
      const response = await apiClient.get(this.basePath, {
        params: { status }
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      console.error('AssignmentService.getByStatus error:', error);
      throw error;
    }
  }

  // Create bulk assignments
  async createBulk(data: BulkAssignmentData): Promise<Assignment[]> {
    try {
      const response = await apiClient.post(`${this.basePath}/bulk`, data);

      if (response.data && response.data.success !== undefined) {
        return response.data.data || [];
      }

      return response.data || [];
    } catch (error) {
      console.error('AssignmentService.createBulk error:', error);
      throw error;
    }
  }

  // Mark assignment as completed
  async complete(id: number): Promise<Assignment> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('AssignmentService.complete error:', error);
      throw error;
    }
  }

  // Mark assignment as in progress
  async startProgress(id: number): Promise<Assignment> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, {
        status: 'in_progress'
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('AssignmentService.startProgress error:', error);
      throw error;
    }
  }

  // Cancel assignment
  async cancel(id: number): Promise<Assignment> {
    try {
      const response = await apiClient.patch(`${this.basePath}/${id}`, {
        status: 'cancelled'
      });

      if (response.data && response.data.success !== undefined) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('AssignmentService.cancel error:', error);
      throw error;
    }
  }
}

export const assignmentService = new AssignmentService();