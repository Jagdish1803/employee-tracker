// src/api/services/tag.service.ts
import { apiClient } from '../clients/base';
import { Tag, CreateTagRequest, UpdateTagRequest } from '@/types';

export class TagService {
  private readonly basePath = '/tags';

  // Get all tags
  async getAll(): Promise<{ data: { success: boolean; data: Tag[] } }> {
    try {
      const response = await apiClient.get(this.basePath);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  // Get tag by ID
  async getById(id: number): Promise<{ data: { success: boolean; data: Tag } }> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching tag:', error);
      throw error;
    }
  }

  // Create tag
  async create(data: CreateTagRequest): Promise<{ data: { success: boolean; data: Tag } }> {
    try {
      const response = await apiClient.post(this.basePath, data);
      return { data: response.data };
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  // Update tag
  async update(id: number, data: UpdateTagRequest): Promise<{ data: { success: boolean; data: Tag } }> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, data);
      return { data: response.data };
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  // Delete tag
  async delete(id: number): Promise<{ data: { success: boolean; message: string } }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }
}

export const tagService = new TagService();