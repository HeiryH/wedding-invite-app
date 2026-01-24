import { apiClient } from './client';
import { Wish, CreateWish } from './types';

export const wishService = {
  // Get all wishes for a wedding
  getByWeddingId: async (weddingId: number): Promise<Wish[]> => {
    const response = await apiClient.get<Wish[]>(`/wish/wedding/${weddingId}`);
    return response.data;
  },

  // Create wish
  create: async (weddingId: number, data: CreateWish): Promise<Wish> => {
    const response = await apiClient.post<Wish>(`/wish/wedding/${weddingId}`, data);
    return response.data;
  },

  // Delete wish
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/wish/${id}`);
  },
};