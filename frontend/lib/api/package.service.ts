import { apiClient } from './client';
import { Package, CreatePackage, UpdatePackage } from './types';

export const packageService = {
  getAll: async (): Promise<Package[]> => {
    const response = await apiClient.get<Package[]>('/package');
    return response.data;
  },

  getActive: async (): Promise<Package[]> => {
    const response = await apiClient.get<Package[]>('/package/active');
    return response.data;
  },

  getById: async (id: number): Promise<Package> => {
    const response = await apiClient.get<Package>(`/package/${id}`);
    return response.data;
  },

  getByCode: async (code: string): Promise<Package> => {
    const response = await apiClient.get<Package>(`/package/code/${code}`);
    return response.data;
  },

  create: async (data: CreatePackage): Promise<Package> => {
    const response = await apiClient.post<Package>('/package', data);
    return response.data;
  },

  update: async (id: number, data: UpdatePackage): Promise<Package> => {
    const response = await apiClient.put<Package>(`/package/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/package/${id}`);
  },
};
