import { apiClient } from './client';

export const templateConfigService = {
  getByWeddingId: async (eventId: number): Promise<Record<string, string>> => {
    const response = await apiClient.get<Record<string, string>>(
      `/template-config/event/${eventId}`
    );
    return response.data;
  },

  save: async (eventId: number, config: Record<string, string>): Promise<void> => {
    await apiClient.put(`/template-config/event/${eventId}`, config);
  },

  // The template's captured "starting design" (empty object if none is set) — used by the
  // no-real-wedding sample/thumbnail preview so it reflects the saved design, not raw code defaults.
  getTemplateDefault: async (templateId: number): Promise<Record<string, string>> => {
    const response = await apiClient.get<Record<string, string>>(
      `/template-config/template/${templateId}/default`
    );
    return response.data;
  },
};
