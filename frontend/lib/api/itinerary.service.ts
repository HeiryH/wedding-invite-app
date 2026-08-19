import { apiClient } from './client';
import { ItineraryItem, CreateItineraryItem, UpdateItineraryItem, ReorderItinerary } from './types';

export const itineraryService = {
  getByWeddingId: async (eventId: number): Promise<ItineraryItem[]> => {
    const res = await apiClient.get<ItineraryItem[]>(`/itinerary/event/${eventId}`);
    return res.data;
  },

  create: async (eventId: number, dto: CreateItineraryItem): Promise<ItineraryItem> => {
    const res = await apiClient.post<ItineraryItem>(`/itinerary/event/${eventId}`, dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateItineraryItem): Promise<ItineraryItem> => {
    const res = await apiClient.put<ItineraryItem>(`/itinerary/${id}`, dto);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/itinerary/${id}`);
  },

  reorder: async (eventId: number, dto: ReorderItinerary): Promise<void> => {
    await apiClient.put(`/itinerary/event/${eventId}/reorder`, dto);
  },
};
