import { apiClient } from './client';
import { SeatingTable, CreateSeatingTable, UpdateSeatingTable } from './types';

export const tableService = {
  getByWeddingId: async (weddingId: number): Promise<SeatingTable[]> => {
    const res = await apiClient.get<SeatingTable[]>(`/table/wedding/${weddingId}`);
    return res.data;
  },

  create: async (data: CreateSeatingTable): Promise<SeatingTable> => {
    const res = await apiClient.post<SeatingTable>('/table', data);
    return res.data;
  },

  update: async (id: number, data: UpdateSeatingTable): Promise<SeatingTable> => {
    const res = await apiClient.put<SeatingTable>(`/table/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/table/${id}`);
  },

  assignGuest: async (tableId: number, guestId: number): Promise<void> => {
    await apiClient.put(`/table/${tableId}/assign/${guestId}`);
  },

  unassignGuest: async (guestId: number): Promise<void> => {
    await apiClient.delete(`/table/assign/${guestId}`);
  },
};
