'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { logout, type User } from '@/lib/auth';
import { authService } from '@/lib/api';
import { useStoredValue, useBrowserReady } from '@/lib/useStoredValue';
import AdminShell from '@/components/admin/AdminShell';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', href: '/host-admin' },
];

export default function HostAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useBrowserReady();
  const storedUser = useStoredValue('user');
  const user = useMemo<User | null>(() => {
    try { return storedUser ? JSON.parse(storedUser) : null; } catch { return null; }
  }, [storedUser]);
  const isAuthenticated = user?.role === 'HOST_ADMIN';

  useEffect(() => {
    if (ready && !isAuthenticated) router.push('/login');
  }, [ready, isAuthenticated, router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    router.push('/login');
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'HA';

  if (!ready || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-ui)' }}>Checking authentication…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AdminShell
      navItems={NAV_ITEMS}
      onLogout={handleLogout}
      userInitials={initials}
      role="Host Admin"
      fabHref="/host-admin/wedding/create"
      sidePillLinks={[
        { label: 'New event', href: '/host-admin/wedding/create' },
      ]}
    >
      {children}
    </AdminShell>
  );
}
