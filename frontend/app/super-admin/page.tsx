'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventService, Event } from '@/lib/api';
import { downloadBlob } from '@/lib/utils';
import WeddingCard from '@/components/admin/WeddingCard';
import { urlSegmentForEventType, EVENT_TYPES, EventTypeKey } from '@/lib/eventTypes';
import { tierLabel } from '@/lib/tierRank';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type Filter = 'all' | 'upcoming' | 'active' | 'inactive';
type TierFilter = 'ALL' | 'BASIC' | 'PREMIUM' | 'PRO';
const TIER_FILTERS: TierFilter[] = ['BASIC', 'PREMIUM', 'PRO'];

function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 13px', borderRadius: 'var(--radius-full)',
        background: active ? 'var(--brand)' : 'var(--surface-card)',
        border: `1px solid ${active ? 'var(--brand)' : 'var(--border-default)'}`,
        color: active ? 'var(--brand-on)' : 'var(--text-body)',
        fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)',
        fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', cursor: 'pointer',
        transition: 'var(--transition-control)',
      }}
    >
      {children}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        background: active ? 'rgba(255,255,255,.18)' : 'var(--surface-sunken)',
        color: active ? '#fff' : 'var(--text-subtle)',
        padding: '1px 6px', borderRadius: 'var(--radius-full)',
      }}>{count}</span>
    </button>
  );
}

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 12px',
    }}>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)',
        fontWeight: 600, letterSpacing: 'var(--tracking-caps)',
        textTransform: 'uppercase', color: 'var(--text-muted)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)',
        background: 'var(--surface-sunken)', padding: '1px 7px',
        borderRadius: 'var(--radius-full)',
      }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [weddings, setWeddings] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'ALL' | EventTypeKey>('ALL');
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(() => { fetchWeddings(); }, []);

  const fetchWeddings = async () => {
    try {
      setLoading(true);
      setWeddings(await eventService.getAll());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => ({
    all: weddings.length,
    upcoming: weddings.filter(w => w.isActive && new Date(w.eventDate) > new Date()).length,
    active: weddings.filter(w => w.isActive && new Date(w.eventDate) <= new Date()).length,
    inactive: weddings.filter(w => !w.isActive).length,
  }), [weddings]);

  const eventTypeCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: weddings.length };
    for (const t of EVENT_TYPES) c[t.key] = weddings.filter(w => w.eventType === t.key).length;
    return c;
  }, [weddings]);

  const tierCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: weddings.length };
    for (const t of TIER_FILTERS) c[t] = weddings.filter(w => (w.ownerTier ?? 'BASIC').toUpperCase() === t).length;
    return c;
  }, [weddings]);

  const filtered = useMemo(() => weddings.filter(w => {
    if (filter === 'upcoming' && !(w.isActive && new Date(w.eventDate) > new Date())) return false;
    if (filter === 'active' && !(w.isActive && new Date(w.eventDate) <= new Date())) return false;
    if (filter === 'inactive' && w.isActive) return false;
    if (eventTypeFilter !== 'ALL' && w.eventType !== eventTypeFilter) return false;
    if (tierFilter !== 'ALL' && (w.ownerTier ?? 'BASIC').toUpperCase() !== tierFilter) return false;
    if (searchTerm) {
      const s = `${w.name1} ${w.name2} ${w.slug} ${w.venue}`.toLowerCase();
      if (!s.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }), [weddings, filter, eventTypeFilter, tierFilter, searchTerm]);

  // Group weddings: Platform/Direct (no creator) + one group per host
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; email: string | null; weddings: Event[] }>();
    for (const w of filtered) {
      const key = w.createdByUserId != null ? `host:${w.createdByEmail}` : 'platform';
      if (!map.has(key)) {
        map.set(key, {
          label: w.createdByEmail ?? 'Platform / Direct',
          email: w.createdByEmail ?? null,
          weddings: [],
        });
      }
      map.get(key)!.weddings.push(w);
    }
    // Sort: platform first, then hosts alphabetically
    return Array.from(map.values()).sort((a, b) => {
      if (a.email === null) return -1;
      if (b.email === null) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [filtered]);

  const handleToggleActive = async (id: number, current: boolean) => {
    try { await eventService.toggleActive(id, !current); await fetchWeddings(); }
    catch { alert('Failed to update event status'); }
  };

  const handleDelete = async (id: number, coupleName: string) => {
    if (!confirm(`Delete ${coupleName}? This cannot be undone.`)) return;
    try { await eventService.delete(id); await fetchWeddings(); }
    catch { alert('Failed to delete event'); }
  };

  const handleExport = async (id: number, coupleName: string) => {
    try {
      const blob = await eventService.export(id);
      downloadBlob(`${coupleName}-export-${new Date().toISOString().split('T')[0]}.zip`, blob);
    } catch { alert('Failed to export event data'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <EmptyState
        icon="alert-triangle"
        title="Something went wrong"
        description={error ?? undefined}
        action={<Button variant="secondary" tone="neutral" onClick={fetchWeddings}>Try again</Button>}
      />
    </div>
  );

  const totalRsvps = weddings.reduce((s, w) => s + w.totalGuests, 0);
  const multiGroup = groups.length > 1 || (groups.length === 1 && groups[0].email !== null);

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, letterSpacing: 'var(--tracking-tight)', lineHeight: 1, color: 'var(--text-strong)' }}>
            All <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>events</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>
            Manage every invitation in one place.
          </p>
        </div>
        <div className="hidden lg:block">
          <Button
            variant="primary"
            tone="brand"
            iconLeft={<Icon name="plus" size={15} />}
            onClick={() => router.push('/super-admin/wedding/create')}
          >
            New event
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }} className="sm:grid-cols-4">
        <StatCard label="Total events" value={counts.all} icon={<Icon name="heart" size={16} />} tone="brand" trend={{ dir: 'up', label: '+2 this month' }} />
        <StatCard label="Live now" value={counts.active} icon={<Icon name="radio" size={16} />} tone="success" />
        <StatCard label="Upcoming" value={counts.upcoming} icon={<Icon name="calendar" size={16} />} tone="gold" />
        <StatCard label="Total RSVPs" value={totalRsvps} icon={<Icon name="users" size={16} />} tone="neutral" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }} className="md:flex-row md:items-center">
        <div style={{ position: 'relative', flex: '1 1 auto' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
            <Icon name="search" size={16} />
          </div>
          <input
            placeholder="Search name, slug or venue…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            style={{
              width: '100%', padding: '10px 14px 10px 38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: `1px solid ${searchFocus ? 'var(--brand)' : 'var(--border-default)'}`,
              boxShadow: searchFocus ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
              outline: 'none', fontSize: 'var(--text-md)',
              fontFamily: 'var(--font-ui)', color: 'var(--text-body)',
              boxSizing: 'border-box', transition: 'var(--transition-control)',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2, flexShrink: 0 }}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>All</FilterChip>
          <FilterChip active={filter === 'upcoming'} onClick={() => setFilter('upcoming')} count={counts.upcoming}>Upcoming</FilterChip>
          <FilterChip active={filter === 'active'} onClick={() => setFilter('active')} count={counts.active}>Live</FilterChip>
          <FilterChip active={filter === 'inactive'} onClick={() => setFilter('inactive')} count={counts.inactive}>Drafts</FilterChip>
        </div>
      </div>

      {/* Event type filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2, marginBottom: 10 }}>
        <FilterChip active={eventTypeFilter === 'ALL'} onClick={() => setEventTypeFilter('ALL')} count={eventTypeCounts.ALL}>All types</FilterChip>
        {EVENT_TYPES.map(t => (
          <FilterChip key={t.key} active={eventTypeFilter === t.key} onClick={() => setEventTypeFilter(t.key)} count={eventTypeCounts[t.key] ?? 0}>{t.label}</FilterChip>
        ))}
      </div>

      {/* Tier filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2, marginBottom: 14 }}>
        <FilterChip active={tierFilter === 'ALL'} onClick={() => setTierFilter('ALL')} count={tierCounts.ALL}>All tiers</FilterChip>
        {TIER_FILTERS.map(t => (
          <FilterChip key={t} active={tierFilter === t} onClick={() => setTierFilter(t)} count={tierCounts[t] ?? 0}>{tierLabel[t]}</FilterChip>
        ))}
      </div>

      {/* Grouped wedding cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={searchTerm ? 'No results' : 'No events yet'}
          description={searchTerm ? 'No events match those filters.' : 'Create your first invitation to get started.'}
          action={!searchTerm ? (
            <Button variant="primary" tone="brand" iconLeft={<Icon name="plus" size={15} />} onClick={() => router.push('/super-admin/wedding/create')}>
              New event
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {groups.map(group => (
            <div key={group.label}>
              {multiGroup && (
                <GroupHeader
                  label={group.email === null ? 'Platform / Direct' : group.label}
                  count={group.weddings.length}
                />
              )}
              {!multiGroup && (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, margin: '20px 0 12px' }}>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 'var(--tracking-tight)', fontWeight: 400, color: 'var(--text-strong)' }}>
                    {filter === 'all' ? 'Every event' : filter === 'upcoming' ? 'Coming soon' : filter === 'active' ? 'Live invitations' : 'In draft'}
                  </h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {filtered.length} of {weddings.length}
                  </span>
                </div>
              )}
              <div style={{ display: 'grid', gap: 12 }} className="md:grid-cols-2 xl:grid-cols-3">
                {group.weddings.map(w => (
                  <WeddingCard
                    key={w.eventId}
                    wedding={w}
                    onManage={id => router.push(`/super-admin/wedding/${id}`)}
                    onPreview={(slug, eventType) => window.open(`/${urlSegmentForEventType(eventType)}/${slug}`, '_blank')}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    onExport={handleExport}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
