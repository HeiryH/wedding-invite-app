import { apiClient } from './client';
import { Template } from './types';

export const templateService = {
  // Get all templates
  getAll: async (): Promise<Template[]> => {
    const response = await apiClient.get<Template[]>('/template');
    return response.data;
  },

  // Get active templates only
  getActive: async (): Promise<Template[]> => {
    const response = await apiClient.get<Template[]>('/template/active');
    return response.data;
  },

  // Get template by ID
  getById: async (id: number): Promise<Template> => {
    const response = await apiClient.get<Template>(`/template/${id}`);
    return response.data;
  },

  // Get template by code
  getByCode: async (code: string): Promise<Template> => {
    const response = await apiClient.get<Template>(`/template/code/${code}`);
    return response.data;
  },
};