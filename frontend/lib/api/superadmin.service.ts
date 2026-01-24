import { apiClient } from './client';
import { Wedding, WeddingFeature, ToggleFeature } from './types';

export const superAdminService = {
  // Get all registered weddings across the platform
  listAllWeddings: async (): Promise<Wedding[]> => {
    const response = await apiClient.get<Wedding[]>('/admin/weddings');
    return response.data;
  },

  // Remote kill-switch for a wedding (e.g., if payment fails)
  updateStatus: async (weddingId: number, active: boolean) => {
    return await apiClient.post(`/admin/weddings/${weddingId}/status`, active);
  },

  // Manually override features for a specific client
  syncFeatures: async (weddingId: number, features: ToggleFeature[]) => {
    return await apiClient.post(`/admin/weddings/${weddingId}/apply-tier`, features);
  },

  // Upload a new UI layout/theme
  uploadTemplate: async (formData: FormData) => {
    return await apiClient.post('/admin/templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};