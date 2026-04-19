import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
  weddingId?: number;
}

export interface RegisterCoupleRequest {
  email: string;
  password: string;
  weddingId: number;
}

export interface CoupleAdminUser {
  userId: number;
  email: string;
  role: string;
  weddingId?: number;
  isActive: boolean;
  createdDate: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCoupleAdmin: async (weddingId: number): Promise<CoupleAdminUser | null> => {
    try {
      const response = await apiClient.get<CoupleAdminUser>(`/auth/couple-admin/${weddingId}`);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  createCoupleAdmin: async (weddingId: number, email: string, password: string): Promise<CoupleAdminUser> => {
    const response = await apiClient.post<CoupleAdminUser>('/auth/create-couple-admin', {
      weddingId,
      email,
      password,
    });
    return response.data;
  },

  setActive: async (userId: number, isActive: boolean): Promise<CoupleAdminUser> => {
    const response = await apiClient.patch<CoupleAdminUser>(`/auth/couple-admin/${userId}/active`, { isActive });
    return response.data;
  },

  resetPassword: async (userId: number, newPassword: string): Promise<void> => {
    await apiClient.put(`/auth/couple-admin/${userId}/reset-password`, { newPassword });
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/auth/couple-admin/${userId}`);
  },
};
