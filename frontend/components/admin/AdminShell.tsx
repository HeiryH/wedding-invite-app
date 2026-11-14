'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Wordmark } from '@/components/marketing/Wordmark';
import styles from './AdminShell.module.css';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
}

interface AdminShellProps {
  children: React.ReactNode;
  /** Primary destinations: the desktop rail AND the mobile tab bar. Keep this short — the tab bar
   *  gives every item an equal slice, so past ~4 it stops being tappable and starts being a wall
   *  of icons. Everything else belongs in `menuItems`. */
  navItems: NavItem[];
  /** Secondary destinations in the account menu and the mobile More menu. */
  menuItems?: NavItem[];
  onLogout: () => void;
  userInitials?: string;
  role?: 'Super Admin' | 'Host Admin' | 'Event Organizer';
  /** Renders the Create FAB, docked bottom-right over the content (`.admin-fab-dock`). */
  fabHref?: string;
  /** Route prefixes whose own page owns that corner — the FAB hides there rather than stacking
   *  on top of the page's own action (the landing editor's Save). */
  fabHiddenOn?: string[];
  sidePillLinks?: { label: string; href: string }[];
  homeHref?: string;
}

export default function AdminShell({
  children,
  navItems,
  menuItems,
  onLogout,
  userInitials = 'SA',
  role = 'Super Admin',
  fabHref,
  fabHiddenOn,
  sidePillLinks,
  homeHref,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState<'mobileAccount' | 'railAccount' | 'more' | null>(null);
  const mobileAvatarRef = useRef<HTMLDivElement>(null);
  const railAvatarRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      const container = menu === 'mobileAccount' ? mobileAvatarRef.current
        : menu === 'railAccount' ? railAvatarRef.current : moreRef.current;
      if (!container?.contains(event.target as Node)) setMenu(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [menu]);

  const allItems = [...navItems, ...(menuItems ?? [])];
  const activeId = allItems.reduce<string>((best, item) => {
    if (pathname.startsWith(item.href) && item.href.length > (allItems.find(n => n.id === best)?.href.length ?? 0)) {
      return item.id;
    }
    return best;
  }, navItems[0]?.id ?? '');
  const hasPageCreate = role !== 'Event Organizer' && pathname === navItems[0]?.href;
  const showFab = Boolean(fabHref) && !hasPageCreate && pathname !== fabHref
    && !(fabHiddenOn ?? []).some(p => pathname.startsWith(p));

  const renderAccount = (placement: 'mobileAccount' | 'railAccount') => {
    const menuOpen = menu === placement;
    const inRail = placement === 'railAccount';

    return (
      <div ref={inRail ? railAvatarRef : mobileAvatarRef} className={styles.account}>
        <button
          onClick={() => setMenu(menuOpen ? null : placement)}
          aria-expanded={menuOpen}
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
          <div className={`${styles.accountMenu} ${inRail ? styles.railAccountMenu : ''}`}>
            <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', fontFamily: 'var(--font-ui)' }}>
                {role}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-strong)', margin: '2px 0 0', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
                {userInitials}
              </p>
            </div>
            {menuItems?.map(item => (
              <MenuBtn
                key={item.id}
                icon={item.icon}
                active={item.id === activeId}
                onClick={() => { setMenu(null); router.push(item.href); }}
              >
                {item.label}
              </MenuBtn>
            ))}
            {menuItems && menuItems.length > 0 && (
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />
            )}
            <MenuBtn icon="log-out" danger onClick={() => { setMenu(null); onLogout(); }}>
              Log out
            </MenuBtn>
          </div>
        )}
      </div>
    );
  };

  const topbar = (
    <header className={styles.topbar}>
      <div className={styles.mobileBrand}>
        <Wordmark size={21} />
        <div className={styles.role}>{role}</div>
      </div>
      <IconButton name="bell" label="Notifications" variant="outline" />
      {renderAccount('mobileAccount')}
    </header>
  );

  const sidebar = (
    <aside className={styles.rail} aria-label="Admin sidebar">
      <div className={styles.railControls}>
        {renderAccount('railAccount')}
        <IconButton name="bell" label="Notifications" variant="outline" />
      </div>
      <div className={styles.railBrand}>
        <Wordmark size={26} byline />
        <div className={styles.role}>{role}</div>
      </div>
      <div className={styles.railLinks}>
        {navItems.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              aria-current={isActive ? 'page' : undefined}
              data-active={isActive}
              className={styles.navButton}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px',
                borderRadius: 'var(--radius-md)', color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                background: isActive ? 'var(--brand-subtle)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 'var(--text-md)', fontFamily: 'var(--font-ui)',
                fontWeight: isActive ? 600 : 500, transition: 'var(--transition-control)', textAlign: 'left', width: '100%',
              }}
            >
              <Icon name={item.icon} size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count !== undefined && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--text-subtle)',
                  background: 'var(--surface-sunken)',
                  padding: '1px 6px', borderRadius: 'var(--radius-full)',
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick access pill (organizer-admin only) */}
        {role !== 'Super Admin' && sidePillLinks && sidePillLinks.length > 0 && (
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

      </div>
      {homeHref && <div className={styles.railFooter}><HomeLink href={homeHref} /></div>}
    </aside>
  );

  return (
    <div className={styles.shell}>
      {/* Desktop navigation */}
      {sidebar}

      {/* The top bar is only needed when the desktop rail is hidden. */}
      <div className={styles.content}>
        {topbar}
        <main className="px-4 pt-5 pb-28 lg:py-7 lg:px-8" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav
        ref={moreRef}
        aria-label="Admin navigation"
        className={`${styles.tabbar} flex items-center lg:hidden`}
      >
        {navItems.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => { setMenu(null); router.push(item.href); }}
              aria-current={isActive ? 'page' : undefined}
              data-active={isActive}
              className={styles.navButton}
              style={{
                flex: 1, height: 44, borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                background: isActive ? 'var(--brand-subtle)' : 'transparent',
                border: 'none', cursor: 'pointer', minWidth: 0,
                transition: 'var(--transition-control)',
              }}
            >
              <Icon name={item.icon} size={18} />
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: isActive ? 600 : 500,
                maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
        {!!menuItems?.length && (
          <>
            <button
              type="button"
              aria-expanded={menu === 'more'}
              data-active={menu === 'more' || menuItems.some((item) => item.id === activeId)}
              className={styles.navButton}
              onClick={() => setMenu(menu === 'more' ? null : 'more')}
              style={{
                flex: 1, height: 44, border: 0, borderRadius: 'var(--radius-md)', display: 'grid',
                placeContent: 'center', justifyItems: 'center', gap: 2, cursor: 'pointer',
                color: 'var(--text-muted)', background: menu === 'more' ? 'var(--brand-subtle)' : 'transparent', fontSize: 10,
              }}
            >
              <Icon name="more-horizontal" size={18} />
              More
            </button>
            {menu === 'more' && (
              <div className={styles.moreMenu}>
                {menuItems.map((item) => (
                  <MenuBtn key={item.id} icon={item.icon} active={item.id === activeId} onClick={() => { setMenu(null); router.push(item.href); }}>
                    {item.label}
                  </MenuBtn>
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Create — one floating action, same corner on mobile and desktop. It used to be wedged
          into the middle of the mobile tab bar, which cost a nav slot and hid it on desktop. */}
      {showFab && (
        <div className="admin-fab-dock">
          <button
            onClick={() => router.push(fabHref!)}
            aria-label="Create"
            title="Create"
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--brand)', color: 'var(--brand-on)',
              display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,.28)',
              transition: 'var(--transition-control)',
            }}
          >
            <Icon name="plus" size={22} />
          </button>
        </div>
      )}
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
        color: hover ? 'var(--text-strong)' : 'var(--text-muted)',
        background: hover ? 'var(--surface-sunken)' : 'transparent',
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

function MenuBtn({ icon, danger, active, onClick, children }: { icon: string; danger?: boolean; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--brand-subtle)' : hover ? 'var(--surface-sunken)' : 'transparent',
        border: 'none', cursor: 'pointer',
        color: danger ? 'var(--danger)' : active ? 'var(--brand)' : 'var(--text-body)',
        fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 500, textAlign: 'left',
        fontFamily: 'var(--font-ui)',
        transition: 'var(--transition-control)',
      }}
    >
      <Icon name={icon} size={14} /> {children}
    </button>
  );
}
