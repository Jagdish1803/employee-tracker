// src/api/services/employee.service.ts
import { apiClient } from '../clients/base';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '@/types';

export class EmployeeService {
  private readonly basePath = '/employees';

  // Get all employees
  async getAll(): Promise<{ data: { success: boolean; data: Employee[] } }> {
    try {
      const response = await apiClient.get(this.basePath);
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  }

  // Get employee by ID
  async getById(id: number): Promise<{ data: { success: boolean; data: Employee } }> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`);
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  }

  // Create employee
  async create(data: CreateEmployeeRequest): Promise<{ data: { success: boolean; data: Employee } }> {
    try {
      const response = await apiClient.post(this.basePath, data);
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  }

  // Update employee
  async update(id: number, data: UpdateEmployeeRequest): Promise<{ data: { success: boolean; data: Employee } }> {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, data);
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  }

  // Delete employee
  async delete(id: number): Promise<{ data: { success: boolean; message: string } }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`);
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  }

  // Employee login
  async login(employeeCode: string): Promise<{ data: { success: boolean; data?: Employee } }> {
    try {
      const response = await apiClient.post(`${this.basePath}/login`, { employeeCode });
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  }

  // Get employee by code
  async getByCode(employeeCode: string): Promise<{ data: { success: boolean; data?: Employee } }> {
    try {
      const response = await apiClient.get(`${this.basePath}/code/${employeeCode}`);
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  }
}

export const employeeService = new EmployeeService();