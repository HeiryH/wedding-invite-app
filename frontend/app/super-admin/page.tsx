'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { weddingService, Wedding } from '@/lib/api';
import WeddingCard from '@/components/admin/WeddingCard';
import Icon from '@/components/admin/Icon';

type Filter = 'all' | 'upcoming' | 'active' | 'inactive';

// ── Inline stat card ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon, tint, delta }: { label: string; value: number; icon: string; tint?: 1 | 2 | 3; delta?: string }) {
  const tintStyle: React.CSSProperties = tint === 1
    ? { background: 'linear-gradient(170deg, var(--lavender) 0%, white 90%)', borderColor: 'var(--lavender-deep)' }
    : tint === 2
    ? { background: 'linear-gradient(170deg, var(--veil) 0%, white 90%)', borderColor: 'var(--veil-deep)' }
    : tint === 3
    ? { background: 'linear-gradient(170deg, var(--thistle-soft) 0%, white 90%)', borderColor: 'var(--thistle)' }
    : {};

  return (
    <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 16, position: 'relative', overflow: 'hidden', ...tintStyle }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        <Icon name={icon} size={13} /> {label}
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 38, lineHeight: 1, marginTop: 10, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
        {value}
      </div>
      {delta && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--lavender-grey-deep)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="arrow-up" size={12} /> {delta}
        </div>
      )}
      <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 10, background: 'rgba(255,255,255,.7)', display: 'grid', placeItems: 'center', color: 'var(--lavender-grey-deep)', border: '1px solid rgba(255,255,255,.9)' }}>
        <Icon name={icon} size={15} />
      </div>
    </div>
  );
}

// ── Chip filter ────────────────────────────────────────────────────────────────
function Chip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: 999,
        background: active ? 'var(--lavender-grey-ink)' : 'white',
        border: `1px solid ${active ? 'var(--lavender-grey-ink)' : 'var(--line-2)'}`,
        color: active ? 'white' : 'var(--ink-2)',
        fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      {children}
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 11,
        background: active ? 'rgba(255,255,255,.15)' : 'var(--floral-deep)',
        color: active ? 'white' : 'var(--muted)',
        padding: '2px 6px', borderRadius: 999,
      }}>{count}</span>
    </button>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const router = useRouter();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchWeddings(); }, []);

  const fetchWeddings = async () => {
    try {
      setLoading(true);
      setWeddings(await weddingService.getAll());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load weddings');
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => ({
    all: weddings.length,
    upcoming: weddings.filter(w => w.isActive && new Date(w.weddingDate) > new Date()).length,
    active: weddings.filter(w => w.isActive && new Date(w.weddingDate) <= new Date()).length,
    inactive: weddings.filter(w => !w.isActive).length,
  }), [weddings]);

  const filtered = useMemo(() => weddings.filter(w => {
    if (filter === 'upcoming' && !(w.isActive && new Date(w.weddingDate) > new Date())) return false;
    if (filter === 'active' && !(w.isActive && new Date(w.weddingDate) <= new Date())) return false;
    if (filter === 'inactive' && w.isActive) return false;
    if (searchTerm) {
      const s = `${w.brideName} ${w.groomName} ${w.coupleName} ${w.venue}`.toLowerCase();
      if (!s.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }), [weddings, filter, searchTerm]);

  const handleToggleActive = async (id: number, current: boolean) => {
    try { await weddingService.toggleActive(id, !current); await fetchWeddings(); }
    catch { alert('Failed to update wedding status'); }
  };

  const handleDelete = async (id: number, coupleName: string) => {
    if (!confirm(`Delete ${coupleName}? This cannot be undone.`)) return;
    try { await weddingService.delete(id); await fetchWeddings(); }
    catch { alert('Failed to delete wedding'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--lavender-grey-ink)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
      <button onClick={fetchWeddings} style={{ color: 'var(--lavender-grey-ink)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>Try again</button>
    </div>
  );

  const totalRsvps = weddings.reduce((s, w) => s + w.totalGuests, 0);

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
            All <em style={{ fontStyle: 'italic', color: 'var(--lavender-grey-deep)' }}>weddings</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>Manage every invitation in one place.</p>
        </div>
        <button
          onClick={() => router.push('/super-admin/wedding/create')}
          className="hidden lg:inline-flex"
          style={{ display: 'none', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, boxShadow: '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(0,0,0,.08)' }}
        >
          <Icon name="plus" size={16} /> New wedding
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }} className="sm:grid-cols-4">
        <StatCard label="Total" value={counts.all} icon="heart" tint={1} delta="+2 this month" />
        <StatCard label="Live now" value={counts.active} icon="cast-out" tint={2} />
        <StatCard label="Upcoming" value={counts.upcoming} icon="calendar" tint={3} />
        <StatCard label="RSVPs" value={totalRsvps} icon="user-plus" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }} className="md:flex-row md:items-center">
        <div style={{ position: 'relative', flex: '1 1 auto' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
            <Icon name="search" size={17} />
          </div>
          <input
            placeholder="Search couple, slug or venue…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 12, background: 'white', border: '1px solid var(--line-2)', outline: 'none', fontSize: 14, color: 'var(--ink)', boxSizing: 'border-box' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>All</Chip>
          <Chip active={filter === 'upcoming'} onClick={() => setFilter('upcoming')} count={counts.upcoming}>Upcoming</Chip>
          <Chip active={filter === 'active'} onClick={() => setFilter('active')} count={counts.active}>Live</Chip>
          <Chip active={filter === 'inactive'} onClick={() => setFilter('inactive')} count={counts.inactive}>Drafts</Chip>
        </div>
      </div>

      {/* Section heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, margin: '22px 0 12px' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '-0.01em', fontWeight: 400, color: 'var(--ink)' }}>
          {filter === 'all' ? 'Every couple' : filter === 'upcoming' ? 'Coming soon' : filter === 'active' ? 'Live invitations' : 'In draft'}
        </h2>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {filtered.length} of {weddings.length}
        </span>
      </div>

      {/* Wedding cards grid */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }} className="md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(w => (
            <WeddingCard
              key={w.weddingId}
              wedding={w}
              onManage={id => router.push(`/super-admin/wedding/${id}`)}
              onPreview={name => window.open(`/wedding/${name}`, '_blank')}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '1px dashed var(--line-2)', borderRadius: 12, background: 'var(--floral)' }}>
          <Icon name="search" size={28} style={{ color: 'var(--thistle)', display: 'block', margin: '0 auto 8px' }} />
          {searchTerm ? 'No weddings match those filters.' : 'No weddings yet. Create one to get started!'}
        </div>
      )}
    </div>
  );
}
