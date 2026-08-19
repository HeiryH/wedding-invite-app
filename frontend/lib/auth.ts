export interface User {
  email: string;
  role: string;
  weddingId?: number;
  tier?: string;
}

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isSuperAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'SUPER_ADMIN';
};

export const isHostAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'HOST_ADMIN';
};

export const isOrganizerAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'ORGANIZER_ADMIN';
};

export const isAuthenticated = (): boolean => {
  return getUser() !== null;
};

export const logout = () => {
  localStorage.removeItem('user');
};