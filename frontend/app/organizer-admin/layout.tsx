'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, type User } from '@/lib/auth';
import { authService } from '@/lib/api';
import { useStoredValue, useBrowserReady } from '@/lib/useStoredValue';
import AdminShell from '@/components/admin/AdminShell';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: 'home',      href: '/organizer-admin' },
  { id: 'customize',  label: 'Customise',  icon: 'pen-tool',  href: '/organizer-admin/customize' },
];

export default function OrganizerAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useBrowserReady();
  const storedUser = useStoredValue('user');
  const user = useMemo<User | null>(() => {
    try { return storedUser ? JSON.parse(storedUser) : null; } catch { return null; }
  }, [storedUser]);
  const isAuthenticated = !!user && ['ORGANIZER_ADMIN', 'SUPER_ADMIN'].includes(user.role);

  // The customize page is a full-screen editor (its own toolbar + 3-pane shell) —
  // render it without the AdminShell chrome.
  const fullScreen = pathname?.startsWith('/organizer-admin/customize');

  useEffect(() => {
    if (ready && !isAuthenticated) router.push('/login');
  }, [ready, isAuthenticated, router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    router.push('/login');
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'CA';

  if (!ready || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-50)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--gold-700)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Checking authentication…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (fullScreen) return <>{children}</>;

  return (
    <AdminShell
      navItems={NAV_ITEMS}
      onLogout={handleLogout}
      userInitials={initials}
      role="Event Organizer"
      fabHref="/organizer-admin/customize"
      sidePillLinks={[
        { label: 'View invitation', href: '/wedding' },
        { label: 'Customise', href: '/organizer-admin/customize' },
      ]}
    >
      {children}
    </AdminShell>
  );
}
