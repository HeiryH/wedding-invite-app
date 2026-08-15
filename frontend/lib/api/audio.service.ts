import { apiClient } from './client';

export const audioService = {
  upload: async (eventId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ audioUrl: string }>(
      `/audio/event/${eventId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.audioUrl;
  },
};
