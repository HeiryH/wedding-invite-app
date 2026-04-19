import { apiClient } from './client';
import { Guest, CreateGuest } from './types';

export const guestService = {
  // Get guest by ID
  getById: async (id: number): Promise<Guest> => {
    const response = await apiClient.get<Guest>(`/guest/${id}`);
    return response.data;
  },

  // Get all guests for a wedding
  getByWeddingId: async (weddingId: number): Promise<Guest[]> => {
    const response = await apiClient.get<Guest[]>(`/guest/wedding/${weddingId}`);
    return response.data;
  },

  // Get attending count
  getAttendingCount: async (weddingId: number): Promise<number> => {
    const response = await apiClient.get<{ weddingId: number; attendingCount: number }>(
      `/guest/wedding/${weddingId}/count`
    );
    return response.data.attendingCount;
  },

  // Create guest (RSVP — public endpoint)
  create: async (weddingId: number, data: CreateGuest): Promise<Guest> => {
    const response = await apiClient.post<Guest>('/guest/rsvp', { ...data, weddingId });
    return response.data;
  },

  // Update guest
  update: async (id: number, data: CreateGuest): Promise<Guest> => {
    const response = await apiClient.put<Guest>(`/guest/${id}`, data);
    return response.data;
  },

  // Delete guest
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/guest/${id}`);
  },
};
