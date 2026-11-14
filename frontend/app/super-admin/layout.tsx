'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { authService } from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';

// The desktop rail and mobile tab bar show primary destinations. Secondary tools live in the menus.
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Events',  icon: 'home',        href: '/super-admin' },
  { id: 'themes',    label: 'Themes',  icon: 'palette',     href: '/super-admin/themes' },
  { id: 'landing',   label: 'Landing', icon: 'layout-grid', href: '/super-admin/landing' },
];

const MENU_ITEMS = [
  { id: 'hosts',     label: 'Host admins',      icon: 'users',    href: '/super-admin/hosts' },
  { id: 'packages',  label: 'Manage tiers',     icon: 'gift',     href: '/super-admin/packages' },
  { id: 'features',  label: 'Manage features',  icon: 'sliders',  href: '/super-admin/features' },
  { id: 'authoring', label: 'Template authoring', icon: 'pen-tool', href: '/super-admin/authoring' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Read browser-only session metadata after hydration.
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    router.push('/login');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-50)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderWidth: '3px', borderStyle: 'solid', borderColor: 'transparent var(--gold-700) var(--gold-700) var(--gold-700)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Checking authentication…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pathname.startsWith('/super-admin/template-studio/')) return <>{children}</>;

  return (
    <AdminShell
      navItems={NAV_ITEMS}
      menuItems={MENU_ITEMS}
      onLogout={handleLogout}
      userInitials="SA"
      role="Super Admin"
      fabHref="/super-admin/wedding/create"
      // The landing editor owns that corner with its own Save button.
      fabHiddenOn={['/super-admin/landing']}
      homeHref="/home"
      sidePillLinks={[
        { label: 'New event', href: '/super-admin/wedding/create' },
        { label: 'Packages', href: '/super-admin/packages' },
      ]}
    >
      {children}
    </AdminShell>
  );
}
