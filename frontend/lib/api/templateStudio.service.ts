import { apiClient } from './client';
import type { ItineraryItem, Photo } from './types';

export interface StudioSample {
  contentConfig?: Record<string, string>;
  wedding?: { brideName: string; groomName: string; eventTitle: string; weddingDate: string; venue: string; venueAddress: string; maxPax: number };
  eventType?: string;
  itinerary?: ItineraryItem[];
  media?: Photo[];
}
export interface StudioState {
  templateId: number;
  version: number;
  config: Record<string, string>;
  sample: StudioSample;
  updatedDate: string | null;
  revisions: { revision: number; publishedDate: string }[];
  publishedDesignHash: string;
}
export interface TemplateCaptureJob {
  id: string;
  templateId: number;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'cancelled' | 'applied';
  error: string | null;
  expiresAt: string;
  publishedRevision?: number | null;
}
export interface CapturePreviewSnapshot {
  payload: Record<string, unknown>;
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

export class StudioDraftSessionExpired extends Error {
  constructor() {
    super('Your Studio session expired. Sign in in a new tab, then retry Save draft here.');
    this.name = 'StudioDraftSessionExpired';
  }
}

export const templateStudioService = {
  get: async (id: number): Promise<StudioState> => (await apiClient.get(`/template/${id}/studio`)).data,
  save: async (id: number, version: number, config: Record<string, string>, sample: StudioSample): Promise<StudioState> => {
    const response = await apiClient.put<StudioState>(`/template/${id}/studio/draft`, { version, config, sample }, {
      // The global 401 handler navigates away. Keep unsaved Studio changes in memory while signing in.
      validateStatus: (status) => (status >= 200 && status < 300) || status === 401,
    });
    if (response.status === 401) throw new StudioDraftSessionExpired();
    return response.data;
  },
  publish: async (id: number, version: number): Promise<StudioState> =>
    (await apiClient.post(`/template/${id}/studio/publish`, { version })).data,
  restore: async (id: number, version: number, revision: number): Promise<StudioState> =>
    (await apiClient.post(`/template/${id}/studio/restore`, { version, revision })).data,
  export: async (id: number, version: number): Promise<Blob> =>
    (await apiClient.post(`/template/${id}/studio/export`, { version }, { responseType: 'blob' })).data,
  startCapture: async (id: number, signal?: AbortSignal, snapshot?: CapturePreviewSnapshot): Promise<TemplateCaptureJob> =>
    (await apiClient.post(`/template/${id}/studio/captures`, snapshot ?? {}, { signal })).data,
  getCapture: async (id: number, job: string, signal?: AbortSignal): Promise<TemplateCaptureJob> =>
    (await apiClient.get(`/template/${id}/studio/captures/${job}`, { signal })).data,
  captureImage: async (id: number, job: string, signal?: AbortSignal): Promise<Blob> =>
    (await apiClient.get(`/template/${id}/studio/captures/${job}/image`, { signal, responseType: 'blob' })).data,
  cancelCapture: async (id: number, job: string): Promise<void> => {
    await apiClient.delete(`/template/${id}/studio/captures/${job}`);
  },
  applyCapture: async (id: number, job: string): Promise<void> => {
    await apiClient.post(`/template/${id}/studio/captures/${job}/apply`);
  },
};
