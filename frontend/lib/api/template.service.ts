import { apiClient } from './client';
import { Template, TemplateWithUsage, UpdateTemplate } from './types';

export const templateService = {
  // Get all templates
  getAll: async (): Promise<Template[]> => {
    const response = await apiClient.get<Template[]>('/template');
    return response.data;
  },

  // Get all templates with usage counts (super admin), ranked active-first by usage
  getUsage: async (): Promise<TemplateWithUsage[]> => {
    const response = await apiClient.get<TemplateWithUsage[]>('/template/usage');
    return response.data;
  },

  // Update a template's metadata / tier / active state (super admin)
  update: async (id: number, data: UpdateTemplate): Promise<Template> => {
    const response = await apiClient.put<Template>(`/template/${id}`, data);
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