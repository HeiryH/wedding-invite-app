'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
}

interface AdminShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  onLogout: () => void;
  userInitials?: string;
  role?: 'Super Admin' | 'Couple Admin';
  fabHref?: string;
  sidePillLinks?: { label: string; href: string }[];
}

export default function AdminShell({
  children,
  navItems,
  onLogout,
  userInitials = 'SA',
  role = 'Super Admin',
  fabHref,
  sidePillLinks,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!avatarRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const activeId = navItems.reduce<string>((best, item) => {
    if (pathname.startsWith(item.href) && item.href.length > (navItems.find(n => n.id === best)?.href.length ?? 0)) {
      return item.id;
    }
    return best;
  }, navItems[0]?.id ?? '');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--floral)', fontFamily: 'var(--sans)' }}>

      {/* ── AppBar ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'color-mix(in srgb, var(--floral) 88%, transparent)',
        backdropFilter: 'saturate(140%) blur(14px)',
        WebkitBackdropFilter: 'saturate(140%) blur(14px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', maxWidth: 1320, margin: '0 auto' }}>

          {/* Hamburger — desktop only, toggles sidebar */}
          <button
            className="hidden lg:flex items-center justify-center"
            onClick={() => setSidebarOpen(p => !p)}
            style={{ width: 36, height: 36, borderRadius: 10, color: 'var(--lavender-grey-ink)', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <Icon name="menu" size={19} />
          </button>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--lavender) 0%, var(--veil) 60%, var(--thistle) 100%)',
              display: 'grid', placeItems: 'center',
              color: 'var(--lavender-grey-ink)',
              fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', lineHeight: 1,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.6), 0 1px 2px rgba(74,68,86,.06)',
            }}>e</div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Eveline</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>{role}</span>
            </div>
          </div>

          {/* Bell */}
          <button style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color: 'var(--lavender-grey-ink)', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="bell" size={18} />
          </button>

          {/* Avatar → dropdown */}
          <div ref={avatarRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(p => !p)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: menuOpen
                  ? 'var(--lavender-grey-ink)'
                  : 'linear-gradient(135deg, var(--lavender), var(--veil))',
                display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 600,
                color: menuOpen ? 'var(--floral)' : 'var(--lavender-grey-ink)',
                border: '1px solid rgba(255,255,255,.6)',
                boxShadow: '0 1px 2px rgba(74,68,86,.08)',
                cursor: 'pointer',
                transition: 'background .15s ease, color .15s ease',
              }}
              aria-label="Account menu"
            >
              {userInitials}
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--floral)', border: '1px solid var(--line)',
                borderRadius: 14, padding: 6, minWidth: 172,
                boxShadow: '0 8px 24px rgba(74,68,86,.12)', zIndex: 60,
              }}>
                <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{role}</p>
                  <p style={{ fontSize: 13, color: 'var(--ink)', margin: '2px 0 0', fontWeight: 500 }}>{userInitials}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', borderRadius: 9, background: 'transparent', border: 'none',
                    cursor: 'pointer', color: 'var(--ink-2)', fontSize: 13, fontWeight: 500, textAlign: 'left',
                    transition: 'background .1s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--thistle-soft)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon name="cast-out" size={14} style={{ color: 'var(--danger)' }} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Layout grid ────────────────────────────────────────────────── */}
      <div className={`grid max-w-[1320px] mx-auto w-full lg:px-7 ${sidebarOpen ? 'lg:grid-cols-[240px_1fr] lg:gap-7' : 'lg:grid-cols-1'}`}>

        {/* Sidebar (desktop only, collapsible) */}
        <aside
          className={sidebarOpen ? 'hidden lg:flex' : 'hidden'}
          style={{
            flexDirection: 'column', gap: 4, padding: '28px 0',
            position: 'sticky', top: 65, alignSelf: 'start',
            height: 'calc(100vh - 65px)', overflowY: 'auto',
          }}
        >
          {navItems.map(item => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 14px', borderRadius: 12,
                  color: isActive ? 'var(--lavender-grey-ink)' : 'var(--ink-2)',
                  background: isActive ? 'var(--lavender)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  transition: 'background .15s ease, color .15s ease',
                  textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--thistle-soft)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Icon name={item.icon} size={19} style={{ color: isActive ? 'var(--lavender-grey-ink)' : 'var(--lavender-grey)', flexShrink: 0 }} />
                {item.label}
                {item.count !== undefined && (
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: isActive ? 'var(--lavender-grey-ink)' : 'var(--muted)', fontWeight: 400 }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick access pill */}
          {sidePillLinks && sidePillLinks.length > 0 && (
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 16, background: 'linear-gradient(160deg, var(--lavender) 0%, var(--veil) 100%)', border: '1px solid var(--lavender-deep)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                <Icon name="sparks" size={13} /> Quick access
              </div>
              {sidePillLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.8)',
                    color: 'var(--lavender-grey-ink)', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', transition: 'background .15s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.85)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.6)'; }}
                >
                  {link.label}
                  <Icon name="nav-arrow-right" size={14} />
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="min-w-0 px-4 pt-5 pb-28 lg:py-7 lg:px-0 lg:pb-14">
          {children}
        </main>
      </div>

      {/* ── TabBar (mobile only) ────────────────────────────────────────── */}
      <nav className="flex items-center lg:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'color-mix(in srgb, var(--floral) 92%, transparent)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderTop: '1px solid var(--line)',
        padding: `10px 16px calc(10px + env(safe-area-inset-bottom))`,
        gap: 6, zIndex: 50,
      }}>
        {navItems.map((item, idx) => {
          const isActive = item.id === activeId;
          const isMid = fabHref !== undefined && idx === Math.floor(navItems.length / 2);

          return (
            <div key={item.id} style={{ display: 'contents' }}>
              {isMid && (
                <button
                  onClick={() => router.push(fabHref!)}
                  style={{
                    flex: '0 0 auto', width: 48, height: 48, borderRadius: 16, marginTop: -20,
                    background: 'var(--lavender-grey-ink)', color: 'var(--floral)',
                    display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(74,68,86,.25), inset 0 1px 0 rgba(255,255,255,.12)',
                  }}
                  aria-label="Create"
                >
                  <Icon name="plus" size={20} />
                </button>
              )}
              <button
                onClick={() => router.push(item.href)}
                style={{
                  flex: 1, height: 44, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? 'var(--lavender-grey-ink)' : 'var(--muted)',
                  background: isActive ? 'var(--lavender)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'background .15s ease, color .15s ease',
                }}
              >
                <Icon name={item.icon} size={22} />
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
