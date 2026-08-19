import { apiClient } from './client';
import { Event, EventFeature, ToggleFeature } from './types';

export const superAdminService = {
  // Get all registered weddings across the platform
  listAllWeddings: async (): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/admin/events');
    return response.data;
  },

  // Remote kill-switch for a wedding (e.g., if payment fails)
  updateStatus: async (eventId: number, active: boolean) => {
    return await apiClient.post(`/admin/events/${eventId}/status`, active);
  },

  // Manually override features for a specific client
  syncFeatures: async (eventId: number, features: ToggleFeature[]) => {
    return await apiClient.post(`/admin/events/${eventId}/apply-tier`, features);
  },

  // Upload a new UI layout/theme
  uploadTemplate: async (formData: FormData) => {
    return await apiClient.post('/admin/templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
