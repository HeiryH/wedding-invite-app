import { apiClient } from './client';
import { CreateTemplate, Template, TemplateWithUsage, UpdateTemplate } from './types';

export const templateService = {
  // Get all templates
  getAll: async (): Promise<Template[]> => {
    const response = await apiClient.get<Template[]>('/template');
    return response.data;
  },

  // Create a brand-new authored template on a blank canvas (super admin)
  create: async (data: CreateTemplate): Promise<Template> => {
    const response = await apiClient.post<Template>('/template', data);
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

  // Set a template's picker thumbnail (super admin)
  uploadThumbnail: async (id: number, file: File | Blob, filename = 'thumbnail.png'): Promise<Template> => {
    const form = new FormData();
    form.append('file', file, filename);
    const response = await apiClient.post<Template>(`/template/${id}/thumbnail`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ── Per-template "starting design" defaults (super admin) ────────────────────
  // How many keys the template's captured starting design holds (0 = none set).
  getDefaultConfig: async (id: number): Promise<TemplateDefaultConfigStatus> => {
    const response = await apiClient.get<TemplateDefaultConfigStatus>(`/template/${id}/default-config`);
    return response.data;
  },

  // Capture an existing invite's finished design as this template's starting design.
  setDefaultFromWedding: async (id: number, weddingId: number): Promise<TemplateDefaultConfigStatus> => {
    const response = await apiClient.put<TemplateDefaultConfigStatus>(
      `/template/${id}/default-config/from-event/${weddingId}`,
    );
    return response.data;
  },

  // Clear the starting design — new invites fall back to the built-in layout.
  clearDefaultConfig: async (id: number): Promise<TemplateDefaultConfigStatus> => {
    const response = await apiClient.delete<TemplateDefaultConfigStatus>(`/template/${id}/default-config`);
    return response.data;
  },

  // ── Authored templates (data, not code — see _shared/DataTemplate.tsx) ───────
  // Upload an image for a stage background or layer while authoring — not tied to a wedding
  // (PhotoService requires a real one; a template being authored may have none yet).
  uploadAsset: async (id: number, file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<{ url: string }>(`/template/${id}/assets`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },

  // Set the whole stage/layer composition; flips isAuthored=true.
  setStages: async (id: number, stagesJson: string): Promise<Template> => {
    const response = await apiClient.put<Template>(`/template/${id}/stages`, { stagesJson });
    return response.data;
  },

  // Clear it — falls back to the hand-coded component (if any) for that templateId.
  clearStages: async (id: number): Promise<Template> => {
    const response = await apiClient.delete<Template>(`/template/${id}/stages`);
    return response.data;
  },
};

export interface TemplateDefaultConfigStatus {
  templateId: number;
  keyCount: number;
}