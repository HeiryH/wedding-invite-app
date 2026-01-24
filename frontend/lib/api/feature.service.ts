import { apiClient } from './client';
import { Feature } from './types';

export const featureService = {
  // Get all features
  getAll: async (): Promise<Feature[]> => {
    const response = await apiClient.get<Feature[]>('/feature');
    return response.data;
  },

  // Get active features only
  getActive: async (): Promise<Feature[]> => {
    const response = await apiClient.get<Feature[]>('/feature/active');
    return response.data;
  },

  // Get feature by ID
  getById: async (id: number): Promise<Feature> => {
    const response = await apiClient.get<Feature>(`/feature/${id}`);
    return response.data;
  },

  // Get feature by code
  getByCode: async (code: string): Promise<Feature> => {
    const response = await apiClient.get<Feature>(`/feature/code/${code}`);
    return response.data;
  },
};