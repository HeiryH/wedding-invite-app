import { apiClient } from './client';
import { Photo } from './types';

export const photoService = {
  // Get photo by ID
  getById: async (id: number): Promise<Photo> => {
    const response = await apiClient.get<Photo>(`/photo/${id}`);
    return response.data;
  },

  // Get all photos for a wedding
  getByWeddingId: async (weddingId: number): Promise<Photo[]> => {
    const response = await apiClient.get<Photo[]>(`/photo/wedding/${weddingId}`);
    return response.data;
  },

  // Get visible photos only
  getVisibleByWeddingId: async (weddingId: number): Promise<Photo[]> => {
    const response = await apiClient.get<Photo[]>(
      `/photo/wedding/${weddingId}/visible`
    );
    return response.data;
  },

  // Get photo count
  getPhotoCount: async (weddingId: number): Promise<number> => {
    const response = await apiClient.get<{ weddingId: number; photoCount: number }>(
      `/photo/wedding/${weddingId}/count`
    );
    return response.data.photoCount;
  },

  // Upload photo (multipart/form-data)
  upload: async (
    weddingId: number,
    guestName: string,
    caption: string,
    file: File
  ): Promise<Photo> => {
    const formData = new FormData();
    formData.append('guestName', guestName);
    formData.append('caption', caption);
    formData.append('file', file);

    const response = await apiClient.post<Photo>(
      `/photo/wedding/${weddingId}/upload-simple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Update photo
  update: async (
    id: number,
    data: { caption: string; isApproved: boolean; isVisible: boolean }
  ): Promise<Photo> => {
    const response = await apiClient.put<Photo>(`/photo/${id}`, data);
    return response.data;
  },

  // Delete photo
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/photo/${id}`);
  },
};