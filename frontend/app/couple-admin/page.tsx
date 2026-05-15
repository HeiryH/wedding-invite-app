'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getUser } from '@/lib/auth';
import {
  weddingService,
  guestService,
  photoService,
  wishService,
  weddingFeatureService,
  tableService,
  Wedding,
  Guest,
  Photo,
  Wish,
  WeddingFeature,
  SeatingTable,
} from '@/lib/api';
import SeatingTab from '@/app/super-admin/wedding/[weddingId]/components/SeatingTab';
import GuestsTab from '@/app/super-admin/wedding/[weddingId]/components/GuestsTab';
import WishesTab from '@/app/super-admin/wedding/[weddingId]/components/WishesTab';

// ── Types ─────────────────────────────────────────────────────────────────────
type ActiveTab = 'guests' | 'wishes' | 'photos' | 'seating';

// ── Add / Edit Guest Modal ────────────────────────────────────────────────────
function GuestModal({
  guest,
  onClose,
  onSave,
}: {
  guest: Guest | null;
  onClose: () => void;
  onSave: (data: Partial<Guest>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    guestName: guest?.guestName ?? '',
    email: guest?.email ?? '',
    phoneNumber: guest?.phoneNumber ?? '',
    brideOrGroomSide: guest?.brideOrGroomSide ?? 'Bride',
    songRequest: guest?.songRequest ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      alert('Failed to save guest. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {guest?.guestId ? 'Edit Guest' : 'Add Guest'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Side</label>
            <select
              value={form.brideOrGroomSide}
              onChange={(e) => setForm({ ...form, brideOrGroomSide: e.target.value as 'Bride' | 'Groom' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:outline-none"
            >
              <option value="Bride">Bride's Side</option>
              <option value="Groom">Groom's Side</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Song Request</label>
            <input
              type="text"
              value={form.songRequest}
              onChange={(e) => setForm({ ...form, songRequest: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-rose-500 text-white rounded-lg font-medium text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Upload Photo Modal ────────────────────────────────────────────────────────
function UploadPhotoModal({
  weddingId,
  onClose,
  onUploaded,
}: {
  weddingId: number;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [guestName, setGuestName] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !guestName.trim()) return;
    setUploading(true);
    try {
      await photoService.upload(weddingId, guestName.trim(), caption, file, 'GUEST');
      onUploaded();
      onClose();
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Upload Photo</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
              required
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 py-2.5 bg-rose-500 text-white rounded-lg font-medium text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Photos Panel ──────────────────────────────────────────────────────────────
function PhotosPanel({
  photos,
  weddingId,
  onRefresh,
}: {
  photos: Photo[];
  weddingId: number;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [showUpload, setShowUpload] = useState(false);

  const pending = photos.filter((p) => !p.isApproved).length;
  const approved = photos.filter((p) => p.isApproved).length;

  const filtered = photos.filter((p) => {
    if (filter === 'pending') return !p.isApproved;
    if (filter === 'approved') return p.isApproved;
    return true;
  });

  const handleApprove = async (photoId: number) => {
    try { await photoService.approve(photoId, { isApproved: true }); onRefresh(); }
    catch { alert('Failed to approve photo'); }
  };

  const handleUnapprove = async (photoId: number) => {
    const reason = prompt('Reason (optional):') ?? '';
    try { await photoService.approve(photoId, { isApproved: false, rejectionReason: reason || undefined }); onRefresh(); }
    catch { alert('Failed to update photo'); }
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('Delete this photo?')) return;
    try { await photoService.delete(photoId); onRefresh(); }
    catch { alert('Failed to delete photo'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Filter + Upload bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map((f) => {
            const count = f === 'all' ? photos.length : f === 'pending' ? pending : approved;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === f
                    ? f === 'pending' ? 'bg-yellow-500 text-white'
                    : f === 'approved' ? 'bg-green-500 text-white'
                    : 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f} ({count})
                {f === 'pending' && pending > 0 && filter !== 'pending' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          + Upload Photo
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No photos in this category</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.photoId}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow relative group"
              >
                <div className="absolute top-2 right-2 z-10">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold text-white ${photo.isApproved ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {photo.isApproved ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
                <div className="relative aspect-square">
                  <img src={photo.photoUrl} alt={photo.caption || 'Photo'} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col gap-1.5 p-3 w-full">
                      {!photo.isApproved ? (
                        <button onClick={() => handleApprove(photo.photoId)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                          ✓ Approve
                        </button>
                      ) : (
                        <button onClick={() => handleUnapprove(photo.photoId)} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600">
                          Unapprove
                        </button>
                      )}
                      <button onClick={() => handleDelete(photo.photoId)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 truncate">{photo.guestName}</p>
                  {photo.caption && <p className="text-xs text-gray-500 italic truncate">"{photo.caption}"</p>}
                  <p className="text-xs text-gray-400">{new Date(photo.createdDate).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showUpload && (
        <UploadPhotoModal weddingId={weddingId} onClose={() => setShowUpload(false)} onUploaded={onRefresh} />
      )}
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function CoupleAdminDashboard() {
  const router = useRouter();
  const user = getUser();
  const weddingId = user?.weddingId;

  // Data
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [features, setFeatures] = useState<WeddingFeature[]>([]);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Header edit
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ brideName: '', groomName: '', weddingDate: '', weddingTime: '', venue: '', venueAddress: '' });
  const [saving, setSaving] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);

  // Guest filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
  const [filterAttending, setFilterAttending] = useState<'All' | 'Yes' | 'No'>('All');

  // Guest modal
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
        weddingService.getById(weddingId),
        guestService.getByWeddingId(weddingId),
        photoService.getByWeddingId(weddingId),
        wishService.getByWeddingId(weddingId),
        weddingFeatureService.getByWeddingId(weddingId),
        tableService.getByWeddingId(weddingId),
      ]);
      setWedding(w);
      setGuests(g);
      setPhotos(p);
      setWishes(wi);
      setFeatures(f);
      setTables(t);

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

  const filteredGuests = guests.filter((g) => {
    const s = g.guestName.toLowerCase().includes(searchTerm.toLowerCase());
    const si = filterSide === 'All' || g.brideOrGroomSide === filterSide;
    const at = filterAttending === 'All' || (filterAttending === 'Yes' ? g.isAttending : !g.isAttending);
    return s && si && at;
  });

  const startEdit = () => {
    if (!wedding) return;
    const dt = new Date(wedding.weddingDate);
    setEditData({
      brideName: wedding.brideName,
      groomName: wedding.groomName,
      weddingDate: dt.toISOString().split('T')[0],
      weddingTime: dt.toTimeString().slice(0, 5),
      venue: wedding.venue,
      venueAddress: wedding.venueAddress,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!weddingId) return;
    setSaving(true);
    try {
      const combined = `${editData.weddingDate}T${editData.weddingTime || '00:00'}:00`;
      const updated = await weddingService.update(weddingId, {
        brideName: editData.brideName,
        groomName: editData.groomName,
        weddingDate: combined as any,
        venue: editData.venue,
        venueAddress: editData.venueAddress,
      });
      setWedding(updated);
      setIsEditing(false);
    } catch { alert('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleDeleteGuest = async (id: number) => {
    if (!confirm('Remove this guest?')) return;
    await guestService.delete(id);
    setGuests(prev => prev.filter(g => g.guestId !== id));
  };

  const handleSaveGuest = async (data: Partial<Guest>) => {
    if (!weddingId) return;
    if (editingGuest?.guestId) {
      const updated = await guestService.update(editingGuest.guestId, data as any);
      setGuests(prev => prev.map(g => g.guestId === editingGuest.guestId ? updated : g));
    } else {
      const created = await guestService.create(weddingId, data as any);
      setGuests(prev => [...prev, created]);
    }
  };

  const handleDeleteWish = async (id: number) => {
    if (!confirm('Delete this wish?')) return;
    await wishService.delete(id);
    setWishes(prev => prev.filter(w => w.wishId !== id));
  };

  const exportGuestsCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Side', 'Attending', 'Guests', 'Song Request'];
    const rows = guests.map(g => [g.guestName, g.email ?? '', g.phoneNumber ?? '', g.brideOrGroomSide, g.isAttending ? 'Yes' : 'No', g.numberOfAttendees, g.songRequest ?? '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `guests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportWishesCSV = () => {
    const headers = ['Guest Name', 'Message', 'Date'];
    const rows = wishes.map(w => [w.guestName, w.message, new Date(w.createdDate).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `wishes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your wedding…</p>
        </div>
      </div>
    );
  }

  if (!wedding) return null;

  const daysUntil = Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / 86400000);
  const attending = guests.filter(g => g.isAttending).reduce((s, g) => s + g.numberOfAttendees, 0);
  const pendingPhotos = photos.filter(p => !p.isApproved).length;

  const tabs: { key: ActiveTab; label: string; code: string }[] = [
    { key: 'guests', label: '👥 Guests', code: 'RSVP' },
    { key: 'wishes', label: '💝 Wishes', code: 'WISHES' },
    { key: 'photos', label: '📸 Photos', code: 'PHOTO_BOOTH' },
    { key: 'seating', label: '🪑 Seating', code: 'SEATING' },
  ].filter(t => isEnabled(t.code)) as { key: ActiveTab; label: string; code: string }[];

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-8 text-white">
          {isEditing ? (
            <div className="space-y-3 max-w-lg">
              <div className="flex gap-2">
                <input value={editData.brideName} onChange={e => setEditData({ ...editData, brideName: e.target.value })}
                  placeholder="Bride's Name"
                  className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white"
                />
                <span className="self-center font-bold text-xl">&</span>
                <input value={editData.groomName} onChange={e => setEditData({ ...editData, groomName: e.target.value })}
                  placeholder="Groom's Name"
                  className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <div className="flex gap-2">
                <input type="date" value={editData.weddingDate} onChange={e => setEditData({ ...editData, weddingDate: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                />
                <input type="time" value={editData.weddingTime} onChange={e => setEditData({ ...editData, weddingTime: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <input value={editData.venue} onChange={e => setEditData({ ...editData, venue: e.target.value })}
                placeholder="Venue" className="w-full px-3 py-2 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white" />
              <input value={editData.venueAddress} onChange={e => setEditData({ ...editData, venueAddress: e.target.value })}
                placeholder="Venue Address" className="w-full px-3 py-2 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white" />
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="px-5 py-2 bg-white text-rose-600 rounded-lg font-semibold text-sm hover:bg-rose-50 disabled:opacity-60 transition-colors">
                  {saving ? 'Saving…' : '✓ Save'}
                </button>
                <button onClick={() => setIsEditing(false)}
                  className="px-5 py-2 bg-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{wedding.brideName} & {wedding.groomName}</h1>
                <p className="text-lg opacity-90">
                  📅 {new Date(wedding.weddingDate).toLocaleString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  📍 {wedding.venue}{wedding.venueAddress ? `, ${wedding.venueAddress}` : ''}
                </p>
                <div className="mt-4 inline-block bg-white/20 px-4 py-2 rounded-full">
                  <span className="text-2xl font-bold">{daysUntil}</span>
                  <span className="ml-2">days to go! 🎉</span>
                </div>
              </div>
              <button onClick={startEdit}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
                ✏️ Edit
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isEnabled('RSVP') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setActiveTab('guests')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Guests</p>
                <p className="text-3xl font-bold">{attending}</p>
                <p className="text-xs opacity-75">attending / {guests.length} total</p>
              </div>
              <span className="text-4xl opacity-80">👥</span>
            </div>
          </motion.div>
        )}
        {isEnabled('WISHES') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            onClick={() => setActiveTab('wishes')}
            className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Wishes</p>
                <p className="text-3xl font-bold">{wishes.length}</p>
                <p className="text-xs opacity-75">messages received</p>
              </div>
              <span className="text-4xl opacity-80">💝</span>
            </div>
          </motion.div>
        )}
        {isEnabled('PHOTO_BOOTH') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setActiveTab('photos')}
            className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow"
          >
            {pendingPhotos > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse flex items-center justify-center text-xs font-bold">
                {pendingPhotos}
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Photos</p>
                <p className="text-3xl font-bold">{photos.length}</p>
                <p className="text-xs opacity-75">{pendingPhotos > 0 ? `${pendingPhotos} pending` : 'all approved'}</p>
              </div>
              <span className="text-4xl opacity-80">📸</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Tabs + content ────────────────────────────────────────────────── */}
      {tabs.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6">
            <div className="flex">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'photos' && pendingPhotos > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                      {pendingPhotos}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {activeTab === 'guests' && (
              <button
                onClick={() => { setEditingGuest(null); setShowGuestModal(true); }}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                + Add Guest
              </button>
            )}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'guests' && (
                <GuestsTab key="guests"
                  guests={filteredGuests} allGuests={guests}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  filterSide={filterSide} setFilterSide={setFilterSide}
                  filterAttending={filterAttending} setFilterAttending={setFilterAttending}
                  onDelete={handleDeleteGuest} onExport={exportGuestsCSV}
                />
              )}
              {activeTab === 'wishes' && (
                <WishesTab key="wishes" wishes={wishes} onDelete={handleDeleteWish} onExport={exportWishesCSV} />
              )}
              {activeTab === 'photos' && weddingId && (
                <PhotosPanel key="photos" photos={photos} weddingId={weddingId} onRefresh={fetchData} />
              )}
              {activeTab === 'seating' && weddingId && (
                <SeatingTab key="seating" weddingId={weddingId} tables={tables} guests={guests} onRefresh={fetchData} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <p className="text-gray-500 text-lg mb-2">No features are enabled yet</p>
          <p className="text-gray-400 text-sm">Contact your administrator to enable RSVP, Wishes, or Photos.</p>
        </div>
      )}

      {/* ── Bottom actions ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button onClick={() => router.push('/couple-admin/customize')}
          className="px-8 py-4 bg-white text-rose-600 rounded-xl font-semibold text-lg border-2 border-rose-200 hover:border-rose-400 hover:shadow-lg transition-all"
        >
          🎨 Customize Template
        </button>
        <button onClick={() => window.open(`/wedding/${wedding.coupleName}`, '_blank')}
          className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
        >
          🎊 View Your Wedding Invitation
        </button>
      </motion.div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showGuestModal && (
        <GuestModal
          guest={editingGuest}
          onClose={() => { setShowGuestModal(false); setEditingGuest(null); }}
          onSave={handleSaveGuest}
        />
      )}
    </div>
  );
}
