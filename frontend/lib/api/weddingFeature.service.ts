import { apiClient } from './client';
import { WeddingFeature, WeddingWithFeatures, ToggleFeature } from './types';

export const weddingFeatureService = {
  // Get features for a wedding
  getByWeddingId: async (weddingId: number): Promise<WeddingFeature[]> => {
    const response = await apiClient.get<WeddingFeature[]>(
      `/weddingfeature/wedding/${weddingId}`
    );
    return response.data;
  },

  // Get wedding with all features
  getWeddingWithFeatures: async (weddingId: number): Promise<WeddingWithFeatures> => {
    const response = await apiClient.get<WeddingWithFeatures>(
      `/weddingfeature/wedding/${weddingId}/with-features`
    );
    return response.data;
  },

  // Toggle a single feature
  toggleFeature: async (
    weddingId: number,
    toggleData: ToggleFeature
  ): Promise<WeddingFeature> => {
    const response = await apiClient.post<WeddingFeature>(
      `/weddingfeature/wedding/${weddingId}/toggle`,
      toggleData
    );
    return response.data;
  },

  // Bulk toggle features
  bulkToggle: async (
    weddingId: number,
    features: ToggleFeature[]
  ): Promise<void> => {
    await apiClient.post(
      `/weddingfeature/wedding/${weddingId}/bulk-toggle`,
      features
    );
  },

  // Check if feature is enabled
  isFeatureEnabled: async (
    weddingId: number,
    featureCode: string
  ): Promise<boolean> => {
    const response = await apiClient.get<{ featureCode: string; isEnabled: boolean }>(
      `/weddingfeature/wedding/${weddingId}/check/${featureCode}`
    );
    return response.data.isEnabled;
  },
};