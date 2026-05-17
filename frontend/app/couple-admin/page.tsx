'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getUser } from '@/lib/auth';
import {
  weddingService, guestService, photoService, wishService,
  weddingFeatureService, tableService,
  Wedding, Guest, Photo, Wish, WeddingFeature, SeatingTable,
} from '@/lib/api';
import SeatingTab from '@/app/super-admin/wedding/[weddingId]/components/SeatingTab';
import GuestsTab from '@/app/super-admin/wedding/[weddingId]/components/GuestsTab';
import WishesTab from '@/app/super-admin/wedding/[weddingId]/components/WishesTab';
import Icon from '@/components/admin/Icon';

type ActiveTab = 'guests' | 'wishes' | 'photos' | 'seating';

// ── Add / Edit Guest Modal ─────────────────────────────────────────────────────
function GuestModal({ guest, onClose, onSave }: { guest: Guest | null; onClose: () => void; onSave: (data: Partial<Guest>) => Promise<void> }) {
  const [form, setForm] = useState({ guestName: guest?.guestName ?? '', email: guest?.email ?? '', phoneNumber: guest?.phoneNumber ?? '', brideOrGroomSide: guest?.brideOrGroomSide ?? 'Bride', songRequest: guest?.songRequest ?? '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch { alert('Failed to save guest. Please try again.'); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--line-2)', borderRadius: 10, fontSize: 14, color: 'var(--ink)', outline: 'none', background: 'white', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,42,53,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'var(--floral)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 440 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          {guest?.guestId ? 'Edit Guest' : 'Add Guest'}
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Name *</label>
            <input style={inp} value={form.guestName} onChange={e => setForm({ ...form, guestName: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Email</label>
              <input style={inp} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Phone</label>
              <input style={inp} type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Side</label>
            <select style={{ ...inp }} value={form.brideOrGroomSide} onChange={e => setForm({ ...form, brideOrGroomSide: e.target.value as any })}>
              <option value="Bride">Bride's Side</option>
              <option value="Groom">Groom's Side</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Song Request</label>
            <input style={inp} value={form.songRequest} onChange={e => setForm({ ...form, songRequest: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px 14px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 14px', background: 'white', color: 'var(--ink)', border: '1px solid var(--line-2)', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
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

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--line-2)', borderRadius: 10, fontSize: 14, color: 'var(--ink)', outline: 'none', background: 'white', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,42,53,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'var(--floral)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 380 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Upload Photo</div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Guest Name *</label>
            <input style={inp} value={guestName} onChange={e => setGuestName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Caption</label>
            <input style={inp} value={caption} onChange={e => setCaption(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Photo *</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} required className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-rose-50 file:text-rose-700" />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="submit" disabled={uploading || !file} style={{ flex: 1, padding: '10px 14px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', opacity: uploading || !file ? 0.6 : 1 }}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 14px', background: 'white', color: 'var(--ink)', border: '1px solid var(--line-2)', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
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
  const handleUnapprove = async (id: number) => { const reason = prompt('Reason (optional):') ?? ''; try { await photoService.approve(id, { isApproved: false, rejectionReason: reason || undefined }); onRefresh(); } catch { alert('Failed'); } };
  const handleDelete = async (id: number) => { if (!confirm('Delete this photo?')) return; try { await photoService.delete(id); onRefresh(); } catch { alert('Failed'); } };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999,
    background: active ? 'var(--lavender-grey-ink)' : 'white', color: active ? 'white' : 'var(--ink-2)',
    border: `1px solid ${active ? 'var(--lavender-grey-ink)' : 'var(--line-2)'}`,
    fontSize: 12.5, cursor: 'pointer', fontWeight: 500,
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'pending', 'approved'] as const).map(f => {
            const count = f === 'all' ? photos.length : f === 'pending' ? pending : approved;
            return (
              <button key={f} onClick={() => setFilter(f)} style={chipStyle(filter === f)}>
                {f} <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.75 }}>{count}</span>
                {f === 'pending' && pending > 0 && filter !== 'pending' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowUpload(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <Icon name="plus" size={14} /> Upload Photo
        </button>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)', border: '1px dashed var(--line-2)', borderRadius: 12, background: 'var(--floral)' }}>No photos in this category</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div key={photo.photoId} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'white', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--line)', position: 'relative' }}
                className="group">
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                  <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, fontWeight: 600, background: photo.isApproved ? '#e5f1ea' : 'var(--floral-deep)', color: photo.isApproved ? 'var(--success)' : 'var(--warn)', letterSpacing: '0.04em' }}>
                    {photo.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div style={{ position: 'relative', aspectRatio: '1' }}>
                  <img src={photo.photoUrl} alt={photo.caption || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,42,53,0)', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className="group-hover:bg-[rgba(42,42,53,0.7)]">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 p-3 w-full">
                      {!photo.isApproved ? (
                        <button onClick={() => handleApprove(photo.photoId)} style={{ padding: '6px 10px', background: '#e5f1ea', color: 'var(--success)', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Approve</button>
                      ) : (
                        <button onClick={() => handleUnapprove(photo.photoId)} style={{ padding: '6px 10px', background: 'var(--floral-deep)', color: 'var(--warn)', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Unapprove</button>
                      )}
                      <button onClick={() => handleDelete(photo.photoId)} style={{ padding: '6px 10px', background: '#f5e6e6', color: 'var(--danger)', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{photo.guestName}</p>
                  {photo.caption && <p style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>"{photo.caption}"</p>}
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
export default function CoupleAdminDashboard() {
  const router = useRouter();
  const user = getUser();
  const weddingId = user?.weddingId;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [features, setFeatures] = useState<WeddingFeature[]>([]);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ brideName: '', groomName: '', weddingDate: '', weddingTime: '', venue: '', venueAddress: '' });
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
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
        weddingService.getById(weddingId), guestService.getByWeddingId(weddingId),
        photoService.getByWeddingId(weddingId), wishService.getByWeddingId(weddingId),
        weddingFeatureService.getByWeddingId(weddingId), tableService.getByWeddingId(weddingId),
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
    const si = filterSide === 'All' || g.brideOrGroomSide === filterSide;
    const at = filterAttending === 'All' || (filterAttending === 'Yes' ? g.isAttending : !g.isAttending);
    return s && si && at;
  });

  const startEdit = () => {
    if (!wedding) return;
    const dt = new Date(wedding.weddingDate);
    setEditData({ brideName: wedding.brideName, groomName: wedding.groomName, weddingDate: dt.toISOString().split('T')[0], weddingTime: dt.toTimeString().slice(0, 5), venue: wedding.venue, venueAddress: wedding.venueAddress });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!weddingId) return;
    setSaving(true);
    try {
      const updated = await weddingService.update(weddingId, { brideName: editData.brideName, groomName: editData.groomName, weddingDate: `${editData.weddingDate}T${editData.weddingTime || '00:00'}:00` as any, venue: editData.venue, venueAddress: editData.venueAddress });
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

  const handleDeleteWish = async (id: number) => { if (!confirm('Delete?')) return; await wishService.delete(id); setWishes(prev => prev.filter(w => w.wishId !== id)); };

  const exportGuestsCSV = () => {
    const rows = guests.map(g => [g.guestName, g.email ?? '', g.phoneNumber ?? '', g.brideOrGroomSide, g.isAttending ? 'Yes' : 'No', g.numberOfAttendees, g.songRequest ?? '']);
    const csv = [['Name','Email','Phone','Side','Attending','Guests','Song Request'], ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `guests-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const exportWishesCSV = () => {
    const rows = wishes.map(w => [w.guestName, w.message, new Date(w.createdDate).toLocaleDateString()]);
    const csv = [['Guest Name','Message','Date'], ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `wishes-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--lavender-grey-ink)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading your wedding…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!wedding) return null;

  const daysUntil = Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / 86400000);
  const attending = guests.filter(g => g.isAttending).reduce((s, g) => s + g.numberOfAttendees, 0);
  const pendingPhotos = photos.filter(p => !p.isApproved).length;

  const weddingDate = new Date(wedding.weddingDate);
  const dateStr = weddingDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = weddingDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const tabs: { key: ActiveTab; label: string; icon: string; code: string }[] = [
    { key: 'guests',  label: 'Guests',   icon: 'group',      code: 'RSVP' },
    { key: 'wishes',  label: 'Wishes',   icon: 'heart',      code: 'WISHES' },
    { key: 'photos',  label: 'Photos',   icon: 'eye',        code: 'PHOTO_BOOTH' },
    { key: 'seating', label: 'Seating',  icon: 'puzzle',     code: 'SEATING' },
  ].filter(t => isEnabled(t.code)) as { key: ActiveTab; label: string; icon: string; code: string }[];

  // Stat card style helpers
  const statTint = (n: 1 | 2 | 3): React.CSSProperties => n === 1
    ? { background: 'linear-gradient(170deg, var(--lavender) 0%, white 90%)', borderColor: 'var(--lavender-deep)' }
    : n === 2
    ? { background: 'linear-gradient(170deg, var(--veil) 0%, white 90%)', borderColor: 'var(--veil-deep)' }
    : { background: 'linear-gradient(170deg, var(--thistle-soft) 0%, white 90%)', borderColor: 'var(--thistle)' };

  const inp: React.CSSProperties = { padding: '8px 12px', border: '1px solid rgba(255,255,255,.5)', borderRadius: 10, background: 'rgba(255,255,255,.85)', color: 'var(--ink)', fontSize: 14, outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Detail Hero ───────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(150deg, var(--veil) 0%, var(--lavender) 100%)', borderRadius: 'var(--radius-lg)', padding: '22px 22px 26px', position: 'relative', overflow: 'hidden', border: '1px solid var(--veil-deep)' }}>
        {/* decorative circle */}
        <div style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.6), transparent 70%)', pointerEvents: 'none' }} />

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={editData.brideName} onChange={e => setEditData({ ...editData, brideName: e.target.value })} placeholder="Bride's Name" style={{ ...inp, flex: 1, fontSize: 16 }} />
              <span style={{ color: 'var(--lavender-grey-deep)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20 }}>&amp;</span>
              <input value={editData.groomName} onChange={e => setEditData({ ...editData, groomName: e.target.value })} placeholder="Groom's Name" style={{ ...inp, flex: 1, fontSize: 16 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="date" value={editData.weddingDate} onChange={e => setEditData({ ...editData, weddingDate: e.target.value })} style={inp} />
              <input type="time" value={editData.weddingTime} onChange={e => setEditData({ ...editData, weddingTime: e.target.value })} style={inp} />
            </div>
            <input value={editData.venue} onChange={e => setEditData({ ...editData, venue: e.target.value })} placeholder="Venue" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            <input value={editData.venueAddress} onChange={e => setEditData({ ...editData, venueAddress: e.target.value })} placeholder="Venue Address" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '9px 18px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,.5)', color: 'var(--ink)', border: '1px solid rgba(255,255,255,.6)', borderRadius: 10, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Top row: days pill + edit button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', padding: '6px 10px', borderRadius: 999, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lavender-grey-ink)' }}>
                <b style={{ fontFamily: 'var(--serif)', fontSize: 16, letterSpacing: '-0.01em', textTransform: 'none', fontWeight: 400 }}>{daysUntil > 0 ? daysUntil : 0}</b> days to go
              </div>
              <button onClick={startEdit} style={{ padding: '7px 12px', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'var(--lavender-grey-ink)', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="settings" size={13} /> Edit
              </button>
            </div>
            {/* Names */}
            <h1 style={{ margin: '0 0 12px', fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 6vw, 48px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              {wedding.brideName}{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--lavender-grey-deep)', margin: '0 4px' }}>&amp;</em>
              {wedding.groomName}
            </h1>
            {/* Meta: stacked on mobile for legibility */}
            <div style={{ color: 'var(--ink-2)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={13} style={{ color: 'var(--lavender-grey-deep)', flexShrink: 0 }} /> {dateStr}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={13} style={{ color: 'var(--lavender-grey-deep)', flexShrink: 0 }} /> {timeStr}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="map-pin" size={13} style={{ color: 'var(--lavender-grey-deep)', flexShrink: 0 }} /> {wedding.venue}{wedding.venueAddress ? `, ${wedding.venueAddress}` : ''}</span>
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => router.push('/couple-admin/customize')} style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                <Icon name="design-nib" size={14} /> Customise
              </button>
              <button onClick={() => window.open(`/wedding/${wedding.coupleName}`, '_blank')} style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'var(--lavender-grey-ink)', cursor: 'pointer' }}>
                <Icon name="eye" size={14} /> View
              </button>
              <button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/wedding/${wedding.coupleName}`)} style={{ flex: '1 1 100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'var(--lavender-grey-ink)', cursor: 'pointer' }}>
                <Icon name="share-android" size={14} /> Share link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {isEnabled('RSVP') && (
          <div onClick={() => setActiveTab('guests')} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', ...statTint(1) }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="group" size={13} /> Guests</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 38, lineHeight: 1, marginTop: 10, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{attending}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--lavender-grey-deep)' }}>attending / {guests.length} total</div>
            <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 10, background: 'rgba(255,255,255,.7)', display: 'grid', placeItems: 'center', color: 'var(--lavender-grey-deep)', border: '1px solid rgba(255,255,255,.9)' }}>
              <Icon name="group" size={15} />
            </div>
          </div>
        )}
        {isEnabled('WISHES') && (
          <div onClick={() => setActiveTab('wishes')} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', ...statTint(2) }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="heart" size={13} /> Wishes</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 38, lineHeight: 1, marginTop: 10, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{wishes.length}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--lavender-grey-deep)' }}>messages received</div>
            <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 10, background: 'rgba(255,255,255,.7)', display: 'grid', placeItems: 'center', color: 'var(--lavender-grey-deep)', border: '1px solid rgba(255,255,255,.9)' }}>
              <Icon name="heart" size={15} />
            </div>
          </div>
        )}
        {isEnabled('PHOTO_BOOTH') && (
          <div onClick={() => setActiveTab('photos')} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', ...statTint(3) }}>
            {pendingPhotos > 0 && (
              <div style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, background: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', border: '2px solid var(--floral)' }}>
                {pendingPhotos}
              </div>
            )}
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="eye" size={13} /> Photos</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 38, lineHeight: 1, marginTop: 10, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{photos.length}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: pendingPhotos > 0 ? 'var(--warn)' : 'var(--lavender-grey-deep)' }}>{pendingPhotos > 0 ? `${pendingPhotos} pending` : 'all approved'}</div>
            <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 10, background: 'rgba(255,255,255,.7)', display: 'grid', placeItems: 'center', color: 'var(--lavender-grey-deep)', border: '1px solid rgba(255,255,255,.9)' }}>
              <Icon name="eye" size={15} />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs + content ────────────────────────────────────────────────── */}
      {tabs.length > 0 ? (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingLeft: 4, paddingRight: 16 }}>
            <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '12px 14px', fontSize: 13.5, color: activeTab === tab.key ? 'var(--ink)' : 'var(--muted)', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--lavender-grey-ink)' : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', transition: 'color .15s ease' }}>
                  <Icon name={tab.icon} size={16} /> {tab.label}
                  {tab.key === 'photos' && pendingPhotos > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, fontSize: 10, fontWeight: 700, background: 'var(--danger)', color: 'white', borderRadius: '50%' }}>{pendingPhotos}</span>
                  )}
                </button>
              ))}
            </div>
            {activeTab === 'guests' && (
              <button onClick={() => { setEditingGuest(null); setShowGuestModal(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 10, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>
                <Icon name="plus" size={13} /> Add Guest
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: 20 }}>
            <AnimatePresence mode="wait">
              {activeTab === 'guests' && <GuestsTab key="guests" guests={filteredGuests} allGuests={guests} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterSide={filterSide} setFilterSide={setFilterSide} filterAttending={filterAttending} setFilterAttending={setFilterAttending} onDelete={handleDeleteGuest} onEdit={g => { setEditingGuest(g); setShowGuestModal(true); }} onExport={exportGuestsCSV} />}
              {activeTab === 'wishes' && <WishesTab key="wishes" wishes={wishes} onDelete={handleDeleteWish} onExport={exportWishesCSV} />}
              {activeTab === 'photos' && weddingId && <PhotosPanel key="photos" photos={photos} weddingId={weddingId} onRefresh={fetchData} />}
              {activeTab === 'seating' && weddingId && <SeatingTab key="seating" weddingId={weddingId} tables={tables} guests={guests} onRefresh={fetchData} />}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, marginBottom: 6 }}>No features enabled yet</p>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Contact your administrator to enable RSVP, Wishes, or Photos.</p>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showGuestModal && <GuestModal guest={editingGuest} onClose={() => { setShowGuestModal(false); setEditingGuest(null); }} onSave={handleSaveGuest} />}
    </div>
  );
}
