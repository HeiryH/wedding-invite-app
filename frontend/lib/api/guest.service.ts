import { apiClient } from './client';
import { Guest, CreateGuest } from './types';

export const guestService = {
  // Get guest by ID
  getById: async (id: number): Promise<Guest> => {
    const response = await apiClient.get<Guest>(`/guest/${id}`);
    return response.data;
  },

  // Get all guests for an event
  getByWeddingId: async (eventId: number): Promise<Guest[]> => {
    const response = await apiClient.get<Guest[]>(`/guest/event/${eventId}`);
    return response.data;
  },

  // Get attending count
  getAttendingCount: async (eventId: number): Promise<number> => {
    const response = await apiClient.get<{ eventId: number; attendingCount: number }>(
      `/guest/event/${eventId}/count`
    );
    return response.data.attendingCount;
  },

  // Admin-side guest creation — authorized endpoint, bypasses the RSVP open/public gates
  create: async (eventId: number, data: CreateGuest): Promise<Guest> => {
    const response = await apiClient.post<Guest>('/guest', { ...data, eventId });
    return response.data;
  },

  // Public RSVP submission from the invitation page — enforces RSVP open + public gates
  rsvp: async (eventId: number, data: CreateGuest): Promise<Guest> => {
    const response = await apiClient.post<Guest>('/guest/rsvp', { ...data, eventId });
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
