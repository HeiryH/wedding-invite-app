import { apiClient } from './client';
import { Event, CreateEvent, UpdateEventDto } from './types';

export const eventService = {
  // Get all events (super admin only)
  getAll: async (): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/event');
    return response.data;
  },

  // Get events created by the current host admin
  getMine: async (): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/event/mine');
    return response.data;
  },

  // Get event by ID
  getById: async (id: number): Promise<Event> => {
    const response = await apiClient.get<Event>(`/event/${id}`);
    return response.data;
  },

  // Get event by slug (main one for invitation page)
  getBySlug: async (slug: string): Promise<Event> => {
    const response = await apiClient.get<Event>(`/event/slug/${slug}`);
    return response.data;
  },

  // Create event (for admin later) — always eventType: 'WEDDING' from this frontend today.
  create: async (data: CreateEvent): Promise<Event> => {
    const response = await apiClient.post<Event>('/event', data);
    return response.data;
  },

  // Update event
  update: async (id: number, data: Partial<UpdateEventDto>): Promise<Event> => {
    const response = await apiClient.put<Event>(`/event/${id}`, data);
    return response.data;
  },

  updateTemplate: async (eventId: number, templateId: number): Promise<Event> => {
    const response = await apiClient.put<Event>(`/event/${eventId}/template`, {
      templateId: templateId,
    });
    return response.data;
  },

  toggleActive: async (id: number, isActive: boolean): Promise<Event> => {
    const response = await apiClient.put<Event>(`/event/${id}/toggle-active`, { isActive });
    return response.data;
  },

  toggleRsvp: async (id: number, isRsvpOpen: boolean): Promise<Event> => {
    const response = await apiClient.put<Event>(`/event/${id}/toggle-rsvp`, { isRsvpOpen });
    return response.data;
  },

  // Set (or clear, with an empty string) the event's custom domain. PRO tier only.
  setDomain: async (id: number, domain: string): Promise<Event> => {
    const response = await apiClient.put<Event>(`/event/${id}/domain`, { domain });
    return response.data;
  },

  // Delete event
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/event/${id}`);
  },

  // Download a zip of everything belonging to this event (RSVPs, wishes, seating, itinerary,
  // full customization config, photos, audio).
  export: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/event/${id}/export`, { responseType: 'blob' });
    return response.data;
  },
};
