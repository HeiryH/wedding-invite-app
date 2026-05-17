'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { authService } from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: 'home-simple',  href: '/couple-admin' },
  { id: 'customize',  label: 'Customise',  icon: 'design-nib',   href: '/couple-admin/customize' },
];

export default function CoupleAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user || !['COUPLE_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    router.push('/login');
  };

  const user = getUser();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'CA';

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--floral)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--lavender-grey-ink)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Checking authentication…</p>
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
      role="Couple Admin"
      fabHref="/couple-admin/customize"
      sidePillLinks={[
        { label: 'View invitation', href: '/wedding' },
        { label: 'Customise', href: '/couple-admin/customize' },
      ]}
    >
      {children}
    </AdminShell>
  );
}
