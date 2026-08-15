'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getUser } from '@/lib/auth';
import {
  eventService, guestService, photoService, wishService,
  eventFeatureService, tableService,
  Event, Guest, Photo, Wish, EventFeature, SeatingTable,
} from '@/lib/api';
import { urlSegmentForEventType } from '@/lib/eventTypes';

// Map a guest's wire-format `guestSide` to the UI's Bride/Groom label.
const guestSideLabel = (guest: Guest): 'Bride' | 'Groom' | null =>
  guest.guestSide === 'PRIMARY' ? 'Bride' : guest.guestSide === 'SECONDARY' ? 'Groom' : null;
import SeatingTab from '@/app/super-admin/wedding/[weddingId]/components/SeatingTab';
import GuestsTab from '@/app/super-admin/wedding/[weddingId]/components/GuestsTab';
import WishesTab from '@/app/super-admin/wedding/[weddingId]/components/WishesTab';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Card, StatCard } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { UpgradeDialog } from '@/components/templates/UpgradeDialog';
import { CustomDomainCard } from '@/components/couple/CustomDomainCard';
import { GettingStartedChecklist } from '@/components/couple/GettingStartedChecklist';
import { tierRank } from '@/lib/tierRank';

type ActiveTab = 'guests' | 'wishes' | 'photos' | 'seating';

// ── Add / Edit Guest Modal ─────────────────────────────────────────────────────
function GuestModal({ guest, eventType, onClose, onSave }: { guest: Guest | null; eventType: string; onClose: () => void; onSave: (data: Partial<Guest>) => Promise<void> }) {
  const showSide = eventType === 'WEDDING';
  const [form, setForm] = useState({
    guestName: guest?.guestName ?? '',
    email: guest?.email ?? '',
    phoneNumber: guest?.phoneNumber ?? '',
    brideOrGroomSide: (guestSideLabel(guest ?? ({} as Guest)) ?? 'Bride') as 'Bride' | 'Groom',
    songRequest: guest?.songRequest ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim()) return;
    setSaving(true);
    try {
      const payload: Partial<Guest> = {
        guestName: form.guestName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        guestSide: showSide ? (form.brideOrGroomSide === 'Bride' ? 'PRIMARY' : 'SECONDARY') : null,
        songRequest: form.songRequest,
      };
      await onSave(payload);
      onClose();
    }
    catch { alert('Failed to save guest. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,32,40,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' as unknown as number, padding: 16, backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 440, border: '1px solid var(--border-subtle)' }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>
            {guest?.guestId ? 'Edit Guest' : 'Add Guest'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Name"
            required
            value={form.guestName}
            onChange={e => setForm({ ...form, guestName: e.target.value })}
            placeholder="Guest name"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
            <Input label="Phone" type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} placeholder="Optional" />
          </div>
          {showSide && (
            <Select
              label="Side"
              value={form.brideOrGroomSide}
              onChange={e => setForm({ ...form, brideOrGroomSide: e.target.value as 'Bride' | 'Groom' })}
              options={[{ value: 'Bride', label: "Bride's Side" }, { value: 'Groom', label: "Groom's Side" }]}
            />
          )}
          <Input label="Song Request" value={form.songRequest} onChange={e => setForm({ ...form, songRequest: e.target.value })} placeholder="Optional" />
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="primary" tone="brand" type="submit" disabled={saving} fullWidth>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" tone="neutral" type="button" onClick={onClose} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Upload Photo Modal ────────────────────────────────────────────────────────
function UploadPhotoModal({ weddingId, onClose, onUploaded }: { weddingId: number; onClose: () => void; onUploaded: () => void }) {
  const [guestName, setGuestName] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !guestName.trim()) return;
    setUploading(true);
    try { await photoService.upload(weddingId, guestName.trim(), caption, file, 'GUEST'); onUploaded(); onClose(); }
    catch { alert('Upload failed. Please try again.'); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,32,40,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' as unknown as number, padding: 16, backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 380, border: '1px solid var(--border-subtle)' }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>Upload Photo</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Guest Name" required value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Who's in the photo?" />
          <Input label="Caption" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Optional" />
          <div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 6px' }}>
              Photo <span style={{ color: 'var(--danger)' }}>*</span>
            </p>
            <input
              type="file" accept="image/*"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              required
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="primary" tone="brand" type="submit" disabled={uploading || !file} fullWidth loading={uploading}>
              Upload
            </Button>
            <Button variant="secondary" tone="neutral" type="button" onClick={onClose} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Photos Panel ──────────────────────────────────────────────────────────────
function PhotosPanel({ photos, weddingId, onRefresh }: { photos: Photo[]; weddingId: number; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [showUpload, setShowUpload] = useState(false);

  const pending = photos.filter(p => !p.isApproved).length;
  const approved = photos.filter(p => p.isApproved).length;
  const filtered = photos.filter(p => filter === 'pending' ? !p.isApproved : filter === 'approved' ? p.isApproved : true);

  const handleApprove = async (id: number) => { try { await photoService.approve(id, { isApproved: true }); onRefresh(); } catch { alert('Failed to approve'); } };
  const handleUnapprove = async (id: number) => {
    const reason = prompt('Reason (optional):') ?? '';
    try { await photoService.approve(id, { isApproved: false, rejectionReason: reason || undefined }); onRefresh(); }
    catch { alert('Failed'); }
  };
  const handleDelete = async (id: number) => { if (!confirm('Delete this photo?')) return; try { await photoService.delete(id); onRefresh(); } catch { alert('Failed'); } };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Tabs
          variant="pill"
          size="sm"
          tabs={[
            { value: 'all', label: 'All', count: photos.length },
            { value: 'pending', label: 'Pending', count: pending },
            { value: 'approved', label: 'Approved', count: approved },
          ]}
          value={filter}
          onChange={v => setFilter(v as typeof filter)}
        />
        <Button variant="soft" tone="brand" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={() => setShowUpload(true)}>
          Upload Photo
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="camera" title="No photos" description="No photos in this category yet." compact />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.photoId}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ delay: i * 0.03 }}
                style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative' }}
                className="group"
              >
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                  <Badge tone={photo.isApproved ? 'success' : 'warning'} size="sm">
                    {photo.isApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div style={{ position: 'relative', aspectRatio: '1' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.photoUrl} alt={photo.caption || 'Photo'} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                    style={{ position: 'absolute', inset: 0, background: 'rgba(28,32,40,0)', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className="group-hover:bg-[rgba(28,32,40,0.7)]"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 p-3 w-full">
                      {!photo.isApproved ? (
                        <button onClick={() => handleApprove(photo.photoId)} style={{ padding: '6px 10px', background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Approve</button>
                      ) : (
                        <button onClick={() => handleUnapprove(photo.photoId)} style={{ padding: '6px 10px', background: 'var(--warning-subtle)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Unapprove</button>
                      )}
                      <button onClick={() => handleDelete(photo.photoId)} style={{ padding: '6px 10px', background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Delete</button>
                    </div>
                  </div>
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{photo.guestName}</p>
                  {photo.caption && <p style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--text-subtle)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>"{photo.caption}"</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {showUpload && <UploadPhotoModal weddingId={weddingId} onClose={() => setShowUpload(false)} onUploaded={onRefresh} />}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function OrganizerAdminDashboard() {
  const router = useRouter();
  const user = getUser();
  const weddingId = user?.weddingId;

  const [wedding, setWedding] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [features, setFeatures] = useState<EventFeature[]>([]);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ brideName: '', groomName: '', eventTitle: '', weddingDate: '', weddingTime: '', venue: '', venueAddress: '', maxCapacity: 0, showCapacityWarning: false });
  const [saving, setSaving] = useState(false);

  const userTier = user?.tier ?? 'FREE';
  const isFree = tierRank(userTier) === 0;

  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
  const [lockedTabDialog, setLockedTabDialog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
  const [filterAttending, setFilterAttending] = useState<'All' | 'Yes' | 'No'>('All');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  useEffect(() => {
    if (!weddingId) { router.push('/login'); return; }
    fetchData();
  }, [weddingId]);

  const fetchData = async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const [w, g, p, wi, f, t] = await Promise.all([
        eventService.getById(weddingId), guestService.getByWeddingId(weddingId),
        photoService.getByWeddingId(weddingId), wishService.getByWeddingId(weddingId),
        eventFeatureService.getByEventId(weddingId), tableService.getByWeddingId(weddingId),
      ]);
      setWedding(w); setGuests(g); setPhotos(p); setWishes(wi); setFeatures(f); setTables(t);
      if (activeTab === null) {
        if (f.some(x => x.featureCode === 'RSVP' && x.isEnabled)) setActiveTab('guests');
        else if (f.some(x => x.featureCode === 'WISHES' && x.isEnabled)) setActiveTab('wishes');
        else if (f.some(x => x.featureCode === 'PHOTO_BOOTH' && x.isEnabled)) setActiveTab('photos');
        else if (f.some(x => x.featureCode === 'SEATING' && x.isEnabled)) setActiveTab('seating');
      }
    } catch { alert('Failed to load wedding data'); }
    finally { setLoading(false); }
  };

  const isEnabled = (code: string) => features.some(f => f.featureCode === code && f.isEnabled);

  const filteredGuests = guests.filter(g => {
    const s = g.guestName.toLowerCase().includes(searchTerm.toLowerCase());
    const si = filterSide === 'All' || guestSideLabel(g) === filterSide;
    const at = filterAttending === 'All' || (filterAttending === 'Yes' ? g.isAttending : !g.isAttending);
    return s && si && at;
  });

  const startEdit = () => {
    if (!wedding) return;
    const dt = new Date(wedding.eventDate);
    setEditData({ brideName: wedding.name1 ?? '', groomName: wedding.name2 ?? '', eventTitle: wedding.eventTitle ?? '', weddingDate: dt.toISOString().split('T')[0], weddingTime: dt.toTimeString().slice(0, 5), venue: wedding.venue, venueAddress: wedding.venueAddress, maxCapacity: wedding.maxCapacity ?? 0, showCapacityWarning: wedding.showCapacityWarning ?? false });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!weddingId) return;
    setSaving(true);
    try {
      const updated = await eventService.update(weddingId, { name1: editData.brideName, name2: editData.groomName, eventTitle: editData.eventTitle, eventDate: `${editData.weddingDate}T${editData.weddingTime || '00:00'}:00` as any, venue: editData.venue, venueAddress: editData.venueAddress, maxCapacity: editData.maxCapacity, showCapacityWarning: editData.showCapacityWarning });
      setWedding(updated); setIsEditing(false);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDeleteGuest = async (id: number) => { if (!confirm('Remove this guest?')) return; await guestService.delete(id); setGuests(prev => prev.filter(g => g.guestId !== id)); };

  const handleSaveGuest = async (data: Partial<Guest>) => {
    if (!weddingId) return;
    if (editingGuest?.guestId) { const updated = await guestService.update(editingGuest.guestId, data as any); setGuests(prev => prev.map(g => g.guestId === editingGuest.guestId ? updated : g)); }
    else { const created = await guestService.create(weddingId, data as any); setGuests(prev => [...prev, created]); }
  };

  const handleToggleRsvp = async (isRsvpOpen: boolean) => {
    if (!weddingId) return;
    try { const updated = await eventService.toggleRsvp(weddingId, isRsvpOpen); setWedding(updated); }
    catch { alert('Failed to update RSVP status'); }
  };

  const handleDeleteWish = async (id: number) => { if (!confirm('Delete?')) return; await wishService.delete(id); setWishes(prev => prev.filter(w => w.wishId !== id)); };

  const exportGuestsCSV = () => {
    const rows = guests.map(g => [g.guestName, g.email ?? '', g.phoneNumber ?? '', guestSideLabel(g) ?? '', g.isAttending ? 'Yes' : 'No', g.numberOfAttendees, g.songRequest ?? '']);
    const csv = [['Name', 'Email', 'Phone', 'Side', 'Attending', 'Guests', 'Song Request'], ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `guests-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const exportWishesCSV = () => {
    const rows = wishes.map(w => [w.guestName, w.message, new Date(w.createdDate).toLocaleDateString()]);
    const csv = [['Guest Name', 'Message', 'Date'], ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `wishes-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading your wedding…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!wedding) return null;

  const daysUntil = Math.max(0, Math.ceil((new Date(wedding.eventDate).getTime() - Date.now()) / 86400000));
  const attending = guests.filter(g => g.isAttending).reduce((s, g) => s + g.numberOfAttendees, 0);
  const pendingPhotos = photos.filter(p => !p.isApproved).length;

  const weddingDate = new Date(wedding.eventDate);
  const dateStr = weddingDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = weddingDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Tabs that are accessible (feature enabled, and tier sufficient for tier-gated ones)
  const tabDefs: { key: ActiveTab; label: string; icon: string; code: string }[] = [
    { key: 'guests',  label: 'Guests',  icon: 'users',        code: 'RSVP' },
    { key: 'wishes',  label: 'Wishes',  icon: 'heart',        code: 'WISHES' },
    { key: 'photos',  label: 'Photos',  icon: 'camera',       code: 'PHOTO_BOOTH' },
    { key: 'seating', label: 'Seating', icon: 'layout-grid',  code: 'SEATING' },
  ].filter(t => isEnabled(t.code) && !(isFree && (t.code === 'PHOTO_BOOTH' || t.code === 'SEATING'))) as { key: ActiveTab; label: string; icon: string; code: string }[];

  // Tabs always shown but locked for free users (appear as greyed entries after the active tabs)
  const lockedTabDefs = isFree ? [
    { key: 'photos' as ActiveTab,  label: 'Photo Booth', icon: 'camera',      requiredTier: 'PREMIUM' },
    { key: 'seating' as ActiveTab, label: 'Seating',     icon: 'layout-grid', requiredTier: 'PREMIUM' },
  ] : [];

  // Fields for the hero's inline edit form (on a dark background, so use translucent inputs)
  const heroInp: React.CSSProperties = { padding: '8px 12px', border: '1px solid rgba(255,255,255,.4)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'var(--font-ui)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--brand-gradient)',
        borderRadius: 'var(--radius-xl)', padding: '24px 24px 28px',
        position: 'relative', overflow: 'hidden',
        boxShadow: 'var(--shadow-foil)',
      }}>
        {/* Decorative glare */}
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.18), transparent 70%)', pointerEvents: 'none' }} />

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520, position: 'relative', zIndex: 1 }}>
            {wedding.eventType === 'WEDDING' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="hero-inp" value={editData.brideName} onChange={e => setEditData({ ...editData, brideName: e.target.value })} placeholder="Bride's Name" style={{ ...heroInp, flex: 1, fontSize: 16 }} />
                <span style={{ color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20 }}>&amp;</span>
                <input className="hero-inp" value={editData.groomName} onChange={e => setEditData({ ...editData, groomName: e.target.value })} placeholder="Groom's Name" style={{ ...heroInp, flex: 1, fontSize: 16 }} />
              </div>
            )}
            {wedding.eventType === 'PARTY' && (
              <input className="hero-inp" value={editData.brideName} onChange={e => setEditData({ ...editData, brideName: e.target.value })} placeholder="Honoree's Name" style={{ ...heroInp, width: '100%', boxSizing: 'border-box', fontSize: 16 }} />
            )}
            {wedding.eventType === 'CEREMONY' && (
              <input className="hero-inp" value={editData.eventTitle} onChange={e => setEditData({ ...editData, eventTitle: e.target.value })} placeholder="Event Title" style={{ ...heroInp, width: '100%', boxSizing: 'border-box', fontSize: 16 }} />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="hero-inp" type="date" value={editData.weddingDate} onChange={e => setEditData({ ...editData, weddingDate: e.target.value })} style={heroInp} />
              <input className="hero-inp" type="time" value={editData.weddingTime} onChange={e => setEditData({ ...editData, weddingTime: e.target.value })} style={heroInp} />
            </div>
            <input className="hero-inp" value={editData.venue} onChange={e => setEditData({ ...editData, venue: e.target.value })} placeholder="Venue" style={{ ...heroInp, width: '100%', boxSizing: 'border-box' }} />
            <input className="hero-inp" value={editData.venueAddress} onChange={e => setEditData({ ...editData, venueAddress: e.target.value })} placeholder="Venue Address" style={{ ...heroInp, width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="hero-inp" type="number" min={0} value={editData.maxCapacity} onChange={e => setEditData({ ...editData, maxCapacity: parseInt(e.target.value) || 0 })} placeholder="0 = unlimited" style={{ ...heroInp, width: 120, textAlign: 'right' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>total capacity (0 = unlimited)</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,.85)', fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editData.showCapacityWarning} onChange={e => setEditData({ ...editData, showCapacityWarning: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--gold-400)', cursor: 'pointer' }} />
              Show spots remaining to guests
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '9px 20px', background: 'rgba(255,255,255,.95)', color: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.35)', borderRadius: 'var(--radius-md)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Days pill + edit */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 11, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'rgba(255,255,255,.85)', fontFamily: 'var(--font-ui)', backdropFilter: 'blur(8px)' }}>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 'var(--tracking-tight)', textTransform: 'none', fontWeight: 400, color: '#fff' }}>{daysUntil}</b>
                days to go
              </div>
              <button onClick={startEdit} style={{ padding: '7px 12px', background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 'var(--radius-md)', fontSize: 12.5, fontWeight: 500, color: '#fff', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', backdropFilter: 'blur(8px)' }}>
                <Icon name="settings" size={12} /> Edit
              </button>
            </div>

            {/* Names */}
            <h1 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 6vw, 48px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: 'var(--tracking-tight)', color: '#fff' }}>
              {wedding.displayName}
            </h1>

            {/* Meta */}
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={13} style={{ color: 'rgba(255,255,255,.6)', flexShrink: 0 }} /> {dateStr}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={13} style={{ color: 'rgba(255,255,255,.6)', flexShrink: 0 }} /> {timeStr}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={13} style={{ color: 'rgba(255,255,255,.6)', flexShrink: 0 }} /> {wedding.venue}{wedding.venueAddress ? `, ${wedding.venueAddress}` : ''}</span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                onClick={() => router.push('/organizer-admin/customize')}
                style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: 'rgba(255,255,255,.96)', color: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
              >
                <Icon name="palette" size={14} /> Customise
              </button>
              <button
                onClick={() => window.open(`/${urlSegmentForEventType(wedding.eventType)}/${wedding.slug}`, '_blank')}
                style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
              >
                <Icon name="eye" size={14} /> {isFree ? 'Preview' : 'View'}
              </button>
              {!isFree && (
                <button
                  onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/${urlSegmentForEventType(wedding.eventType)}/${wedding.slug}`)}
                  style={{ flex: '1 1 100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.85)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
                >
                  <Icon name="share-2" size={14} /> Copy invitation link
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Getting started checklist ─────────────────────────────────────── */}
      {wedding && (
        <GettingStartedChecklist
          coupleName={wedding.slug}
          eventType={wedding.eventType}
          detailsComplete={!!(wedding.name1 && wedding.name2 && wedding.venue && wedding.venue !== 'TBD' && wedding.eventDate)}
          guestCount={guests.length}
          isPublic={wedding.isPublic}
          onEditDetails={startEdit}
          onAddGuests={() => setActiveTab('guests')}
        />
      )}

      {/* ── Private invitation nudge (free tier only) ─────────────────────── */}
      {isFree && (
        <div style={{ borderRadius: 'var(--radius-lg)', padding: '12px 16px', background: 'color-mix(in srgb, var(--gold-400) 10%, transparent)', border: '1px solid var(--gold-200)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="lock" size={16} style={{ color: 'var(--gold-600)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gold-800)' }}>
              Your invitation is private
            </p>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--gold-700)', lineHeight: 1.4 }}>
              Only you can preview it. Upgrade to share with guests and collect real RSVPs.
            </p>
          </div>
          <a href="/templates" style={{ flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--gold-700)', textDecoration: 'none', border: '1px solid var(--gold-400)', borderRadius: 'var(--radius-full)', padding: '5px 12px', whiteSpace: 'nowrap' }}>
            Upgrade
          </a>
        </div>
      )}

      {/* ── Custom domain (PREMIUM sees the PRO upsell, PRO can set it once the admin has
          enabled the Custom Domain feature for this wedding — same two-step gate as
          Photo Booth/Seating) ────────────────────────────────────────────────────── */}
      {!isFree && wedding && weddingId && (
        <CustomDomainCard weddingId={weddingId} domain={wedding.domain} isPro={tierRank(userTier) >= 2 && isEnabled('CUSTOM_DOMAIN')} />
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {isEnabled('RSVP') && (
          <div onClick={() => setActiveTab('guests')} style={{ cursor: 'pointer' }}>
            <StatCard
              label="Guests"
              value={attending}
              sublabel={`/ ${guests.length} total`}
              icon={<Icon name="users" size={16} />}
              tone="brand"
            />
          </div>
        )}
        {isEnabled('WISHES') && (
          <div onClick={() => setActiveTab('wishes')} style={{ cursor: 'pointer' }}>
            <StatCard
              label="Wishes"
              value={wishes.length}
              sublabel="received"
              icon={<Icon name="heart" size={16} />}
              tone="gold"
            />
          </div>
        )}
        {isEnabled('PHOTO_BOOTH') && (
          <div onClick={() => setActiveTab('photos')} style={{ cursor: 'pointer', position: 'relative' }}>
            {pendingPhotos > 0 && (
              <div style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', border: '2px solid var(--surface-app)', zIndex: 1 }}>
                {pendingPhotos}
              </div>
            )}
            <StatCard
              label="Photos"
              value={photos.length}
              sublabel={pendingPhotos > 0 ? `${pendingPhotos} pending` : 'all approved'}
              icon={<Icon name="camera" size={16} />}
              tone={pendingPhotos > 0 ? 'neutral' : 'success'}
            />
          </div>
        )}
      </div>

      {/* ── RSVP Toggle ───────────────────────────────────────────────────── */}
      {isEnabled('RSVP') && (
        <Card padding="14px 18px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-strong)' }}>RSVP Status</p>
              <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
                {wedding.isRsvpOpen !== false ? 'Guests can currently submit RSVPs.' : 'RSVPs are closed — the public form is disabled.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: wedding.isRsvpOpen !== false ? 'var(--success)' : 'var(--danger)' }}>
                {wedding.isRsvpOpen !== false ? 'Open' : 'Closed'}
              </span>
              <Switch
                checked={wedding.isRsvpOpen !== false}
                onChange={e => handleToggleRsvp(e.target.checked)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab panel ─────────────────────────────────────────────────────── */}
      {tabDefs.length > 0 ? (
        <Card padding="0">
          <div style={{ padding: '4px 16px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-end', gap: 0 }}>
            <Tabs
              variant="underline"
              value={activeTab ?? tabDefs[0]?.key}
              onChange={v => setActiveTab(v as ActiveTab)}
              tabs={tabDefs.map(t => ({
                value: t.key,
                label: t.label,
                icon: <Icon name={t.icon} size={15} />,
                count: t.key === 'photos' && pendingPhotos > 0 ? pendingPhotos : undefined,
              }))}
            />
            {/* Locked tabs appended after the real tabs */}
            {lockedTabDefs.map(lt => (
              <button
                key={lt.key}
                onClick={() => setLockedTabDialog(lt.requiredTier)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px 11px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-faint)', opacity: 0.7, whiteSpace: 'nowrap' }}
              >
                <Icon name={lt.icon} size={15} />
                {lt.label}
                <Icon name="lock" size={11} style={{ color: 'var(--text-faint)', marginLeft: 1 }} />
              </button>
            ))}
          </div>
          <div style={{ padding: 20 }}>
            {activeTab === 'guests' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button variant="soft" tone="brand" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={() => { setEditingGuest(null); setShowGuestModal(true); }}>
                  Add Guest
                </Button>
              </div>
            )}
            <AnimatePresence mode="wait">
              {activeTab === 'guests' && <GuestsTab key="guests" guests={filteredGuests} allGuests={guests} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterSide={filterSide} setFilterSide={setFilterSide} filterAttending={filterAttending} setFilterAttending={setFilterAttending} onDelete={handleDeleteGuest} onEdit={g => { setEditingGuest(g); setShowGuestModal(true); }} onExport={exportGuestsCSV} showSide={(wedding?.eventType ?? 'WEDDING') === 'WEDDING'} />}
              {activeTab === 'wishes' && <WishesTab key="wishes" wishes={wishes} onDelete={handleDeleteWish} onExport={exportWishesCSV} />}
              {activeTab === 'photos' && weddingId && <PhotosPanel key="photos" photos={photos} weddingId={weddingId} onRefresh={fetchData} />}
              {activeTab === 'seating' && weddingId && <SeatingTab key="seating" weddingId={weddingId} tables={tables} guests={guests} onRefresh={fetchData} />}
            </AnimatePresence>
          </div>
        </Card>
      ) : isFree ? (
        /* Free users with no features enabled: show the locked tabs as cards */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {lockedTabDefs.map(lt => (
            <button
              key={lt.key}
              onClick={() => setLockedTabDialog(lt.requiredTier)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '32px 16px', background: 'var(--surface-card)', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'var(--transition-control)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-sunken)'; e.currentTarget.style.borderColor = 'var(--brand-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Icon name={lt.icon} size={18} style={{ color: 'var(--text-muted)' }} />
                <div style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, background: 'var(--surface-card)', borderRadius: '50%', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="lock" size={9} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>{lt.label}</p>
                <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>Premium feature</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="sparkles"
          title="No features enabled"
          description="Contact your administrator to enable RSVP, Wishes, or Photos."
        />
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showGuestModal && (
        <GuestModal
          guest={editingGuest}
          eventType={wedding?.eventType ?? 'WEDDING'}
          onClose={() => { setShowGuestModal(false); setEditingGuest(null); }}
          onSave={handleSaveGuest}
        />
      )}

      <UpgradeDialog
        open={!!lockedTabDialog}
        onClose={() => setLockedTabDialog(null)}
        requiredTier={lockedTabDialog ?? 'PREMIUM'}
      />
    </div>
  );
}
