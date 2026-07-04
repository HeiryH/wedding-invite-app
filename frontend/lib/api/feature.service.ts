import { apiClient } from './client';
import { Feature, FeatureWithUsage, UpdateFeature } from './types';

export const featureService = {
  // Get all features
  getAll: async (): Promise<Feature[]> => {
    const response = await apiClient.get<Feature[]>('/feature');
    return response.data;
  },

  // Get all features with usage counts (super admin), ranked active-first by usage
  getUsage: async (): Promise<FeatureWithUsage[]> => {
    const response = await apiClient.get<FeatureWithUsage[]>('/feature/usage');
    return response.data;
  },

  // Update a feature's metadata / active state (super admin)
  update: async (id: number, data: UpdateFeature): Promise<Feature> => {
    const response = await apiClient.put<Feature>(`/feature/${id}`, data);
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