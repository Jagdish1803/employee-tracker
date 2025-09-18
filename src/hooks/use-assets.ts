import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Asset,
  AssetAssignment,
  CreateAssetRequest,
  UpdateAssetRequest,
  CreateAssetAssignmentRequest,
  ReturnAssetRequest
} from '@/types';

export interface AssetFilters {
  search?: string;
  status?: string;
  assetType?: string;
  employeeName?: string;
  employeeCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AssignmentHistoryFilters {
  assetId?: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  assetName?: string;
  assetType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  error?: string;
}

// Get all assets with filters
export const useAssets = (filters: AssetFilters = {}) => {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async (): Promise<ApiResponse<Asset[]>> => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/assets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      return response.json();
    },
  });
};

// Get single asset with history
export const useAsset = (id: number) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async (): Promise<ApiResponse<Asset>> => {
      const response = await fetch(`/api/assets/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch asset');
      }
      return response.json();
    },
    enabled: !!id,
  });
};

// Get assignment history
export const useAssetHistory = (filters: AssignmentHistoryFilters = {}) => {
  return useQuery({
    queryKey: ['asset-history', filters],
    queryFn: async (): Promise<ApiResponse<AssetAssignment[]>> => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/assets/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch asset history');
      }
      return response.json();
    },
  });
};

// Create asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetRequest): Promise<ApiResponse<Asset>> => {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create asset');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// Update asset
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAssetRequest }): Promise<ApiResponse<Asset>> => {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update asset');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', variables.id] });
    },
  });
};

// Delete asset
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<ApiResponse<null>> => {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete asset');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-history'] });
    },
  });
};

// Assign asset
export const useAssignAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetAssignmentRequest): Promise<ApiResponse<AssetAssignment>> => {
      const response = await fetch('/api/assets/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign asset');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-history'] });
    },
  });
};

// Return asset
export const useReturnAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReturnAssetRequest): Promise<ApiResponse<AssetAssignment>> => {
      const response = await fetch('/api/assets/assign', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to return asset');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-history'] });
    },
  });
};