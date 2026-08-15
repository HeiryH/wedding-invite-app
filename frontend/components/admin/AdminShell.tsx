'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';

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
  role?: 'Super Admin' | 'Host Admin' | 'Event Organizer';
  fabHref?: string;
  sidePillLinks?: { label: string; href: string }[];
  homeHref?: string;
}

const isSuperAdmin = (role: string) => role === 'Super Admin';

export default function AdminShell({
  children,
  navItems,
  onLogout,
  userInitials = 'SA',
  role = 'Super Admin',
  fabHref,
  sidePillLinks,
  homeHref,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const dark = isSuperAdmin(role);

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

  // ── Topbar ───────────────────────────────────────────────────────────────
  const topbar = (
    <header style={{
      position: 'sticky', top: 0, zIndex: 'var(--z-sticky)' as unknown as number,
      height: 'var(--topbar-h)',
      display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px',
      background: 'color-mix(in srgb, var(--surface-card) 88%, transparent)',
      backdropFilter: 'saturate(140%) blur(14px)',
      WebkitBackdropFilter: 'saturate(140%) blur(14px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      {/* Hamburger — desktop only */}
      <button
        className="hidden lg:flex items-center justify-center"
        onClick={() => setSidebarOpen(p => !p)}
        style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)', background: 'transparent',
          border: 'none', cursor: 'pointer', flexShrink: 0,
          display: 'none',
        }}
      >
        <Icon name="menu" size={19} />
      </button>

      {/* Brand — the yellow "e" logo mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 0 }}>
        <span
          aria-label="The Invit_e"
          style={{
            width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-vibes), cursive', color: '#e2a23c', fontSize: 34, lineHeight: 1,
          }}
        >
          e
        </span>
        <span style={{
          fontSize: 10, color: 'var(--text-subtle)',
          letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase',
          fontFamily: 'var(--font-ui)', minWidth: 0,
        }}>
          {role}
        </span>
      </div>

      {/* Bell */}
      <IconButton name="bell" label="Notifications" variant="outline" />

      {/* Avatar dropdown */}
      <div ref={avatarRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Account menu"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: menuOpen ? 'var(--brand)' : 'var(--brand-subtle)',
            display: 'grid', placeItems: 'center',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-ui)',
            color: menuOpen ? 'var(--brand-on)' : 'var(--brand)',
            border: '1.5px solid var(--brand-border)',
            cursor: 'pointer',
            transition: 'var(--transition-control)',
          }}
        >
          {userInitials}
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 6, minWidth: 172,
            boxShadow: 'var(--shadow-lg)', zIndex: 60,
          }}>
            <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', fontFamily: 'var(--font-ui)' }}>
                {role}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-strong)', margin: '2px 0 0', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
                {userInitials}
              </p>
            </div>
            <MenuBtn icon="log-out" danger onClick={() => { setMenuOpen(false); onLogout(); }}>
              Log out
            </MenuBtn>
          </div>
        )}
      </div>
    </header>
  );

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <aside
      className={sidebarOpen ? 'hidden lg:flex' : 'hidden'}
      style={{
        flexDirection: 'column', gap: 3, padding: '24px 14px',
        position: 'sticky', top: 0, alignSelf: 'start',
        height: '100vh', overflowY: 'auto',
        background: dark ? 'var(--espresso)' : 'var(--surface-card)',
        borderRight: dark ? 'none' : '1px solid var(--border-subtle)',
        width: 240, flexShrink: 0,
      }}
    >
      {/* Nav items */}
      {navItems.map(item => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 11px', borderRadius: 'var(--radius-md)',
              color: dark
                ? (isActive ? '#fff' : 'rgba(255,255,255,.62)')
                : (isActive ? 'var(--brand)' : 'var(--text-muted)'),
              background: dark
                ? (isActive ? 'rgba(255,255,255,.10)' : 'transparent')
                : (isActive ? 'var(--brand-subtle)' : 'transparent'),
              border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-md)', fontFamily: 'var(--font-ui)',
              fontWeight: isActive ? 600 : 500,
              transition: 'var(--transition-control)',
              textAlign: 'left', width: '100%',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background =
                dark ? 'rgba(255,255,255,.07)' : 'var(--surface-sunken)';
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <Icon name={item.icon} size={18} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count !== undefined && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: dark ? 'rgba(255,255,255,.45)' : 'var(--text-subtle)',
                background: dark ? 'rgba(255,255,255,.08)' : 'var(--surface-sunken)',
                padding: '1px 6px', borderRadius: 'var(--radius-full)',
              }}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Quick access pill (organizer-admin only) */}
      {!dark && sidePillLinks && sidePillLinks.length > 0 && (
        <div style={{
          marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
          padding: 14, borderRadius: 'var(--radius-lg)',
          background: 'var(--brand-gradient)',
          border: '1px solid var(--brand-border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, letterSpacing: 'var(--tracking-caps)',
            textTransform: 'uppercase', color: 'rgba(255,255,255,.75)',
            fontFamily: 'var(--font-ui)',
          }}>
            <Icon name="sparkles" size={13} /> Quick access
          </div>
          {sidePillLinks.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)',
                color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 500,
                fontFamily: 'var(--font-ui)', cursor: 'pointer',
                transition: 'background var(--dur-fast) var(--ease-standard)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.22)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.14)'; }}
            >
              {link.label}
              <Icon name="arrow-right" size={14} />
            </button>
          ))}
        </div>
      )}

      {/* Bottom section (dark rail): home link + user pill */}
      {dark && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {homeHref && (
            <HomeLink href={homeHref} />
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,.12)',
          }}>
            <span style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--brand)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-ui)',
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}>
              {userInitials}
            </span>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}>
              <div style={{ fontWeight: 600, color: '#fff' }}>{userInitials}</div>
              <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>{role}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-app)', fontFamily: 'var(--font-ui)' }}>
      {/* Full-height left rail */}
      {sidebar}

      {/* Content column — topbar lives here, so it only spans the area right of the rail */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {topbar}
        <main className="px-4 pt-5 pb-28 lg:py-7 lg:px-8" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav
        className="flex items-center lg:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'color-mix(in srgb, var(--surface-card) 92%, transparent)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderTop: '1px solid var(--border-subtle)',
          padding: 'calc(6px + env(safe-area-inset-bottom)) 12px 6px',
          gap: 4, zIndex: 50,
        }}
      >
        {navItems.map((item, idx) => {
          const isActive = item.id === activeId;
          const isMid = fabHref !== undefined && idx === Math.floor(navItems.length / 2);
          return (
            <div key={item.id} style={{ display: 'contents' }}>
              {isMid && (
                <button
                  onClick={() => router.push(fabHref!)}
                  style={{
                    flex: '0 0 auto', width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: 'var(--brand)', color: '#fff',
                    display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  aria-label="Create"
                >
                  <Icon name="plus" size={16} />
                </button>
              )}
              <button
                onClick={() => router.push(item.href)}
                style={{
                  flex: 1, height: 40, borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                  background: isActive ? 'var(--brand-subtle)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'var(--transition-control)',
                }}
              >
                <Icon name={item.icon} size={19} />
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function HomeLink({ href }: { href: string }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 11px', borderRadius: 'var(--radius-md)',
        color: hover ? '#fff' : 'rgba(255,255,255,.55)',
        background: hover ? 'rgba(255,255,255,.08)' : 'transparent',
        fontSize: 'var(--text-md)', fontFamily: 'var(--font-ui)', fontWeight: 500,
        textDecoration: 'none',
        transition: 'var(--transition-control)',
      }}
    >
      <Icon name="home" size={18} />
      <span>View website</span>
    </a>
  );
}

function MenuBtn({ icon, danger, onClick, children }: { icon: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
        background: hover ? 'var(--surface-sunken)' : 'transparent',
        border: 'none', cursor: 'pointer',
        color: danger ? 'var(--danger)' : 'var(--text-body)',
        fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'left',
        fontFamily: 'var(--font-ui)',
        transition: 'var(--transition-control)',
      }}
    >
      <Icon name={icon} size={14} /> {children}
    </button>
  );
}
