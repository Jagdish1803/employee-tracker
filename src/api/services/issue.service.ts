// src/api/services/issue.service.ts
import { apiClient } from '../clients/base';
import { Issue, CreateIssueRequest, UpdateIssueRequest } from '@/types';

export class IssueService {
  private readonly basePath = '/issues';

  // Get all issues
  async getAll(): Promise<{ data: { success: boolean; data: Issue[] } }> {
    try {
      const response = await apiClient.get(this.basePath);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  // Get issue by ID
  async getById(id: number): Promise<{ data: { success: boolean; data: Issue } }> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching issue:', error);
      throw error;
    }
  }

  // Create issue
  async create(data: CreateIssueRequest): Promise<{ data: { success: boolean; data: Issue } }> {
    try {
      const response = await apiClient.post(this.basePath, data);
      return { data: response.data };
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  // Update issue
  async update(id: number, data: UpdateIssueRequest): Promise<{ data: { success: boolean; data: Issue } }> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, data);
      return { data: response.data };
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  }

  // Delete issue
  async delete(id: number): Promise<{ data: { success: boolean; message: string } }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw error;
    }
  }

  // Get issues by status
  async getByStatus(status: string): Promise<{ data: { success: boolean; data: Issue[] } }> {
    try {
      const response = await apiClient.get(`${this.basePath}?status=${status}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching issues by status:', error);
      throw error;
    }
  }

  // Get issues by employee
  async getByEmployee(employeeId: number): Promise<{ data: { success: boolean; data: Issue[] } }> {
    try {
      const response = await apiClient.get(`${this.basePath}?employeeId=${employeeId}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching issues by employee:', error);
      throw error;
    }
  }
}

export const issueService = new IssueService();