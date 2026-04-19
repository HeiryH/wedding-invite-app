import { apiClient } from './client';
import { Photo, ApprovePhotoRequest } from './types';

export const photoService = {
  // Get all photos for a wedding (admin only)
  getByWeddingId: async (weddingId: number): Promise<Photo[]> => {
    const response = await apiClient.get<Photo[]>(`/photo/wedding/${weddingId}`);
    return response.data;
  },

  // Get approved photos (public)
  getApprovedByWeddingId: async (weddingId: number): Promise<Photo[]> => {
    const response = await apiClient.get<Photo[]>(`/photo/wedding/${weddingId}/approved`);
    return response.data;
  },

  // Get pending photos (admin only)
  getPendingByWeddingId: async (weddingId: number): Promise<Photo[]> => {
    const response = await apiClient.get<Photo[]>(`/photo/wedding/${weddingId}/pending`);
    return response.data;
  },

  // Get visible photos (currently used by invitation)
  getVisibleByWeddingId: async (weddingId: number): Promise<Photo[]> => {
    const response = await apiClient.get<Photo[]>(`/photo/wedding/${weddingId}/visible`);
    return response.data;
  },

  // Get couple media (public - for template rendering)
  getCoupleMediaByWeddingId: async (weddingId: number): Promise<Photo[]> => {
    const response = await apiClient.get<Photo[]>(`/photo/wedding/${weddingId}/couple-media`);
    return response.data;
  },

  // Upload photo (guest or couple)
  upload: async (
    weddingId: number,
    guestName: string,
    caption: string,
    file: File,
    uploadedBy?: string,
    templateSlot?: number
  ): Promise<Photo> => {
    const formData = new FormData();
    if (guestName) formData.append('GuestName', guestName);
    if (caption) formData.append('Caption', caption);
    formData.append('File', file);
    if (uploadedBy) formData.append('UploadedBy', uploadedBy);
    if (templateSlot !== undefined) formData.append('TemplateSlot', templateSlot.toString());

    const response = await apiClient.post<Photo>(
      `/photo/wedding/${weddingId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Approve/Reject photo
  approve: async (photoId: number, data: ApprovePhotoRequest): Promise<Photo> => {
    const response = await apiClient.put<Photo>(`/photo/${photoId}/approve`, data);
    return response.data;
  },

  // Set featured
  setFeatured: async (photoId: number, isFeatured: boolean): Promise<Photo> => {
    const response = await apiClient.put<Photo>(`/photo/${photoId}/featured`, {
      isFeatured,
    });
    return response.data;
  },

  // Delete photo
  delete: async (photoId: number): Promise<void> => {
    await apiClient.delete(`/photo/${photoId}`);
  },
};