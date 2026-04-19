import { apiClient } from './client';

export const templateConfigService = {
  getByWeddingId: async (weddingId: number): Promise<Record<string, string>> => {
    const response = await apiClient.get<Record<string, string>>(
      `/template-config/wedding/${weddingId}`
    );
    return response.data;
  },

  save: async (weddingId: number, config: Record<string, string>): Promise<void> => {
    await apiClient.put(`/template-config/wedding/${weddingId}`, config);
  },
};
