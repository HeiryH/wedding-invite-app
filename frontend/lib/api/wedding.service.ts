import { apiClient } from './client';
import { Wedding, CreateWedding, UpdateWeddingDto } from './types';

export const weddingService = {
  // Get all weddings
  getAll: async (): Promise<Wedding[]> => {
    const response = await apiClient.get<Wedding[]>('/wedding');
    return response.data;
  },

  // Get wedding by ID
  getById: async (id: number): Promise<Wedding> => {
    const response = await apiClient.get<Wedding>(`/wedding/${id}`);
    return response.data;
  },

  // Get wedding by couple name (main one for invitation page)
  getByCoupleName: async (coupleName: string): Promise<Wedding> => {
    const response = await apiClient.get<Wedding>(`/wedding/couple/${coupleName}`);
    return response.data;
  },

  // Create wedding (for admin later)
  create: async (data: CreateWedding): Promise<Wedding> => {
    const response = await apiClient.post<Wedding>('/wedding', data);
    return response.data;
  },

  // Update wedding
  update: async (id: number, data: Partial<UpdateWeddingDto>): Promise<Wedding> => {
    const response = await apiClient.put<Wedding>(`/wedding/${id}`, data);
    return response.data;
  },

  updateTemplate: async (weddingId: number, templateId: number): Promise<Wedding> => {
    const response = await apiClient.put<Wedding>(`/wedding/${weddingId}/template`, {
      templateId: templateId,
    });
    return response.data;
  },

  updatePackage: async (weddingId: number, packageId: number): Promise<Wedding> => {
    const response = await apiClient.put<Wedding>(`/wedding/${weddingId}/package`, {
      packageId: packageId,
    });
    return response.data;
  },

  toggleActive: async (id: number, isActive: boolean): Promise<Wedding> => {
    const response = await apiClient.put<Wedding>(`/wedding/${id}/toggle-active`, { isActive });
    return response.data;
  },

  // Delete wedding
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/wedding/${id}`);
  },
};