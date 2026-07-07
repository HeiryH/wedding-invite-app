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
  tier: string;
}

export interface RegisterCoupleRequest {
  email: string;
  password: string;
  weddingId: number;
}

export interface SelfRegisterRequest {
  email: string;
  password: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  templateId: number;
}

export interface CoupleAdminUser {
  userId: number;
  email: string;
  role: string;
  weddingId?: number;
  isActive: boolean;
  tier: string;
  createdDate: string;
}

export interface HostAdminUser {
  userId: number;
  email: string;
  role: string;
  isActive: boolean;
  tier: 'FREE' | 'PREMIUM' | 'PRO';
  createdDate: string;
}

export const authService = {
  selfRegister: async (data: SelfRegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/self-register', data);
    return response.data;
  },

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

  setTier: async (userId: number, tier: string): Promise<CoupleAdminUser> => {
    const response = await apiClient.patch<CoupleAdminUser>(`/auth/couple-admin/${userId}/tier`, { tier });
    return response.data;
  },

  resetPassword: async (userId: number, newPassword: string): Promise<void> => {
    await apiClient.put(`/auth/couple-admin/${userId}/reset-password`, { newPassword });
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/auth/couple-admin/${userId}`);
  },

  createHostAdmin: async (email: string, password: string): Promise<HostAdminUser> => {
    const response = await apiClient.post<HostAdminUser>('/auth/create-host-admin', { email, password });
    return response.data;
  },

  getHostAdmins: async (): Promise<HostAdminUser[]> => {
    const response = await apiClient.get<HostAdminUser[]>('/auth/host-admins');
    return response.data;
  },

  // Public self-service password reset
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPasswordWithToken: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },
};
