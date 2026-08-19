import { apiClient } from './client';
import { Wish, CreateWish } from './types';

export const wishService = {
  // Get all wishes for an event
  getByWeddingId: async (eventId: number): Promise<Wish[]> => {
    const response = await apiClient.get<Wish[]>(`/wish/event/${eventId}`);
    return response.data;
  },

  // Create wish
  create: async (eventId: number, data: CreateWish): Promise<Wish> => {
    const response = await apiClient.post<Wish>(`/wish/event/${eventId}`, data);
    return response.data;
  },

  // Delete wish
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/wish/${id}`);
  },
};
