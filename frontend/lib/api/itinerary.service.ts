import { apiClient } from './client';
import { ItineraryItem, CreateItineraryItem, UpdateItineraryItem, ReorderItinerary } from './types';

export const itineraryService = {
  getByWeddingId: async (weddingId: number): Promise<ItineraryItem[]> => {
    const res = await apiClient.get<ItineraryItem[]>(`/itinerary/wedding/${weddingId}`);
    return res.data;
  },

  create: async (weddingId: number, dto: CreateItineraryItem): Promise<ItineraryItem> => {
    const res = await apiClient.post<ItineraryItem>(`/itinerary/wedding/${weddingId}`, dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateItineraryItem): Promise<ItineraryItem> => {
    const res = await apiClient.put<ItineraryItem>(`/itinerary/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/itinerary/${id}`);
  },

  reorder: async (weddingId: number, dto: ReorderItinerary): Promise<void> => {
    await apiClient.put(`/itinerary/wedding/${weddingId}/reorder`, dto);
  },
};
