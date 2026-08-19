import { apiClient } from './client';
import { EventFeature, EventWithFeatures, ToggleFeature } from './types';

export const eventFeatureService = {
  // Get features for an event
  getByEventId: async (eventId: number): Promise<EventFeature[]> => {
    const response = await apiClient.get<EventFeature[]>(
      `/eventfeature/event/${eventId}`
    );
    return response.data;
  },

  // Get event with all features
  getEventWithFeatures: async (eventId: number): Promise<EventWithFeatures> => {
    const response = await apiClient.get<EventWithFeatures>(
      `/eventfeature/event/${eventId}/with-features`
    );
    return response.data;
  },

  // Toggle a single feature
  toggleFeature: async (
    eventId: number,
    toggleData: ToggleFeature
  ): Promise<EventFeature> => {
    const response = await apiClient.post<EventFeature>(
      `/eventfeature/event/${eventId}/toggle`,
      toggleData
    );
    return response.data;
  },

  // Bulk toggle features
  bulkToggle: async (
    eventId: number,
    features: ToggleFeature[]
  ): Promise<void> => {
    await apiClient.post(
      `/eventfeature/event/${eventId}/bulk-toggle`,
      features
    );
  },

  // Check if feature is enabled
  isFeatureEnabled: async (
    eventId: number,
    featureCode: string
  ): Promise<boolean> => {
    const response = await apiClient.get<{ featureCode: string; isEnabled: boolean }>(
      `/eventfeature/event/${eventId}/check/${featureCode}`
    );
    return response.data.isEnabled;
  },
};
