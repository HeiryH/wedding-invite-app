import { apiClient } from './client';
import type { LandingDto, LandingSectionDto, LandingItemDto } from './types';

export type UpsertLandingItem = Omit<LandingItemDto, 'id'>;
export type UpsertLandingSection = Omit<LandingSectionDto, 'id'>;

export const landingService = {
  get: async (): Promise<LandingDto> => {
    const res = await apiClient.get<LandingDto>('/landing');
    return res.data;
  },

  saveContent: async (content: Record<string, string>): Promise<void> => {
    await apiClient.put('/landing/content', { content });
  },

  upsertSection: async (section: UpsertLandingSection): Promise<LandingSectionDto> => {
    const res = await apiClient.put<LandingSectionDto>('/landing/section', section);
    return res.data;
  },

  createItem: async (item: UpsertLandingItem): Promise<LandingItemDto> => {
    const res = await apiClient.post<LandingItemDto>('/landing/item', item);
    return res.data;
  },

  updateItem: async (id: number, item: UpsertLandingItem): Promise<LandingItemDto> => {
    const res = await apiClient.put<LandingItemDto>(`/landing/item/${id}`, item);
    return res.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/landing/item/${id}`);
  },

  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<{ url: string }>('/landing/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
