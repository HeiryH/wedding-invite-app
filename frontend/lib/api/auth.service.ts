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

// The backend's actual LoginResponseDto wire shape (camelCased) — `eventId`, not `weddingId`.
interface LoginResponseWire {
  token: string;
  email: string;
  role: string;
  eventId?: number;
  tier: string;
}

const toLoginResponse = (wire: LoginResponseWire): LoginResponse => ({
  token: wire.token,
  email: wire.email,
  role: wire.role,
  weddingId: wire.eventId,
  tier: wire.tier,
});

export interface RegisterCoupleRequest {
  email: string;
  password: string;
  weddingId: number;
}

export interface SelfRegisterRequest {
  email: string;
  password: string;
  /** WEDDING: both required. PARTY: name1 only. CEREMONY: neither (use eventTitle). */
  name1?: string;
  name2?: string;
  /** Required for CEREMONY; the event's title (e.g. "Ali's Aqiqah"). */
  eventTitle?: string;
  /** 'WEDDING' | 'PARTY' | 'CEREMONY' — defaults to 'WEDDING' server-side if omitted. */
  eventType?: string;
  eventDate: string;
  venue: string;
  venueAddress: string;
  templateId: number;
  /** Optional guest-personalised template config bag (carried through from the draft). */
  config?: Record<string, string>;
  /** Optional guest-personalised itinerary rows (carried through from the draft). */
  itinerary?: { label: string; detail: string; sortOrder: number }[];
}

export interface OrganizerAdminUser {
  userId: number;
  email: string;
  role: string;
  weddingId?: number;
  isActive: boolean;
  tier: string;
  createdDate: string;
}

// The backend's actual UserDto wire shape (camelCased) — `eventId`, not `weddingId`.
interface UserDtoWire {
  userId: number;
  email: string;
  role: string;
  eventId?: number;
  isActive: boolean;
  tier: string;
  createdDate: string;
}

const toOrganizerAdminUser = (wire: UserDtoWire): OrganizerAdminUser => ({
  userId: wire.userId,
  email: wire.email,
  role: wire.role,
  weddingId: wire.eventId,
  isActive: wire.isActive,
  tier: wire.tier,
  createdDate: wire.createdDate,
});

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
    const response = await apiClient.post<LoginResponseWire>('/auth/self-register', data);
    return toLoginResponse(response.data);
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponseWire>('/auth/login', data);
    return toLoginResponse(response.data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getOrganizerAdmin: async (weddingId: number): Promise<OrganizerAdminUser | null> => {
    try {
      const response = await apiClient.get<UserDtoWire>(`/auth/organizer-admin/${weddingId}`);
      return toOrganizerAdminUser(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  createOrganizerAdmin: async (weddingId: number, email: string, password: string): Promise<OrganizerAdminUser> => {
    const response = await apiClient.post<UserDtoWire>('/auth/create-organizer-admin', {
      eventId: weddingId,
      email,
      password,
    });
    return toOrganizerAdminUser(response.data);
  },

  setActive: async (userId: number, isActive: boolean): Promise<OrganizerAdminUser> => {
    const response = await apiClient.patch<UserDtoWire>(`/auth/organizer-admin/${userId}/active`, { isActive });
    return toOrganizerAdminUser(response.data);
  },

  setTier: async (userId: number, tier: string): Promise<OrganizerAdminUser> => {
    const response = await apiClient.patch<UserDtoWire>(`/auth/organizer-admin/${userId}/tier`, { tier });
    return toOrganizerAdminUser(response.data);
  },

  resetPassword: async (userId: number, newPassword: string): Promise<void> => {
    await apiClient.put(`/auth/organizer-admin/${userId}/reset-password`, { newPassword });
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/auth/organizer-admin/${userId}`);
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
