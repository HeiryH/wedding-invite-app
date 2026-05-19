import { apiClient } from './client';

export const audioService = {
  upload: async (weddingId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ audioUrl: string }>(
      `/audio/wedding/${weddingId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.audioUrl;
  },
};
