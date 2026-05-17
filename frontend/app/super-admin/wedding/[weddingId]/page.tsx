'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  weddingService,
  guestService,
  wishService,
  photoService,
  weddingFeatureService,
  templateService,
  packageService,
  authService,
  tableService,
  Wedding,
  Guest,
  Wish,
  Photo,
  WeddingFeature,
  Template,
  Package,
  CoupleAdminUser,
  SeatingTable,
} from '@/lib/api';

import OverviewTab from './components/OverviewTab';
import GuestsTab from './components/GuestsTab';
import WishesTab from './components/WishesTab';
import PhotosTab from './components/PhotosTab';
import FeaturesTab from './components/FeaturesTab';
import TemplatesTab from './components/TemplatesTab';
import PackagesTab from './components/PackagesTab';
import AccessTab from './components/AccessTab';
import SeatingTab from './components/SeatingTab';
import Icon from '@/components/admin/Icon';

type Tab = 'overview' | 'guests' | 'wishes' | 'photos' | 'features' | 'templates' | 'packages' | 'access' | 'seating';

export default function WeddingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const weddingId = parseInt(params.weddingId as string);

  // State
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [features, setFeatures] = useState<WeddingFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [coupleAdmin, setCoupleAdmin] = useState<CoupleAdminUser | null>(null);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<number | null>(null);


  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
  const [filterAttending, setFilterAttending] = useState<'All' | 'Yes' | 'No'>('All');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

  // Edit mode
  const [isEditingWedding, setIsEditingWedding] = useState(false);
  const [editWeddingData, setEditWeddingData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    venueAddress: '',
  });

  useEffect(() => {
    fetchData();
  }, [weddingId]);

  useEffect(() => {
    if (wedding) {
      setEditWeddingData({
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        weddingDate: new Date(wedding.weddingDate).toISOString().split('T')[0],
        venue: wedding.venue,
        venueAddress: wedding.venueAddress,
      });
    }
  }, [wedding]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weddingData, guestsData, wishesData, photosData, featuresData, templatesData, packagesData, coupleAdminData, tablesData] = await Promise.all([
        weddingService.getById(weddingId),
        guestService.getByWeddingId(weddingId),
        wishService.getByWeddingId(weddingId),
        photoService.getByWeddingId(weddingId),
        weddingFeatureService.getWeddingWithFeatures(weddingId).then(r => r.features),
        templateService.getActive(),
        packageService.getActive(),
        authService.getCoupleAdmin(weddingId),
        tableService.getByWeddingId(weddingId),
      ]);

      setWedding(weddingData);
      setGuests(guestsData);
      setWishes(wishesData);
      setTemplates(templatesData);
      setPackages(packagesData);
      setPhotos(photosData);
      setFeatures(featuresData);
      setCoupleAdmin(coupleAdminData);
      setTables(tablesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wedding data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWedding = async () => {
    if (!wedding) return;
    try {
      const updated = await weddingService.update(wedding.weddingId, editWeddingData);
      setWedding(updated);
      setIsEditingWedding(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update wedding');
    }
  };

  const isFeatureEnabled = (featureCode: string): boolean => {
    return features.some(f => f.featureCode === featureCode && f.isEnabled);
  };

  const availableTabs: { key: Tab; label: string; feature?: string }[] = [
    { key: 'overview', label: 'Overview' },
    ...(isFeatureEnabled('RSVP') ? [{ key: 'guests' as Tab, label: 'Guests', feature: 'RSVP' }] : []),
    ...(isFeatureEnabled('WISHES') ? [{ key: 'wishes' as Tab, label: 'Wishes', feature: 'WISHES' }] : []),
    ...(isFeatureEnabled('PHOTO_BOOTH') ? [{ key: 'photos' as Tab, label: 'Photos', feature: 'PHOTO_BOOTH' }] : []),
    ...(isFeatureEnabled('SEATING') ? [{ key: 'seating' as Tab, label: 'Seating', feature: 'SEATING' }] : []),
    { key: 'features', label: 'Features' },
    { key: 'templates', label: 'Templates' },
    { key: 'packages', label: 'Packages' },
    { key: 'access', label: 'Access' },
  ];

  // Auto-switch to first available tab if current tab is hidden
  useEffect(() => {
    const isCurrentTabAvailable = availableTabs.some(tab => tab.key === activeTab);
    if (!isCurrentTabAvailable && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].key);
    }
  }, [features]); // Re-run when features change

  const handleDeleteGuest = async (guestId: number) => {
    if (!confirm('Are you sure you want to remove this guest?')) return;
    try {
      await guestService.delete(guestId);
      setGuests((prev) => prev.filter((g) => g.guestId !== guestId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete guest');
    }
  };

  const handleDeleteWish = async (wishId: number) => {
    if (!confirm('Are you sure you want to remove this wish?')) return;
    try {
      await wishService.delete(wishId);
      setWishes((prev) => prev.filter((w) => w.wishId !== wishId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete wish');
    }
  };

  const handleApprovePhoto = async (photoId: number) => {
    try {
      await photoService.approve(photoId, { isApproved: true });
      await fetchData();
    } catch (err) {
      alert('Failed to approve photo');
    }
  };

  const handleRejectPhoto = async (photoId: number) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await photoService.approve(photoId, {
        isApproved: false,
        rejectionReason: reason || undefined,
      });
      await fetchData();
    } catch (err) {
      alert('Failed to reject photo');
    }
  };

  const handleSetFeatured = async (photoId: number, isFeatured: boolean) => {
    try {
      await photoService.setFeatured(photoId, isFeatured);
      await fetchData();
    } catch (err) {
      alert('Failed to update featured status');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      await photoService.delete(photoId);
      await fetchData();
    } catch (err) {
      alert('Failed to delete photo');
    }
  };

  const handleToggleFeature = async (featureId: number, featureCode: string, currentStatus: boolean) => {
    try {
      await weddingFeatureService.toggleFeature(weddingId, {
        featureId: featureId,
        featureCode: featureCode,
        isEnabled: !currentStatus,
      });
      await fetchData();
    } catch (err) {
      alert('Failed to toggle feature');
    }
  };

  const handleChangeTemplate = async (templateId: number) => {
    if (!wedding) return;

    const template = templates.find(t => t.templateId === templateId);
    if (!template) return;

    if (!confirm(`Change to "${template.templateName}"? This will affect the public invitation immediately.`)) {
      return;
    }

    try {
      const updated = await weddingService.updateTemplate(wedding.weddingId, templateId);
      setWedding(updated);
      alert('Template updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update template');
    }
  };

  const handlePreviewTemplate = (templateId: number) => {
    window.open(`/wedding/${wedding?.coupleName}?preview=${templateId}`, '_blank');
  };

  const exportGuestsToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Side', 'Attending', 'Number of Guests', 'Song Request', 'RSVP Date'];
    const rows = guests.map((guest) => [
      guest.guestName,
      guest.email || '',
      guest.phoneNumber || '',
      guest.brideOrGroomSide,
      guest.isAttending ? 'Yes' : 'No',
      guest.numberOfAttendees,
      guest.songRequest || '',
      guest.respondedDate ? new Date(guest.respondedDate).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wedding?.coupleName}-guests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportWishesToCSV = () => {
    const headers = ['Guest Name', 'Message', 'Date'];
    const rows = wishes.map((wish) => [
      wish.guestName,
      wish.message,
      new Date(wish.createdDate).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wedding?.coupleName}-wishes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filtered data
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest.guestName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSide = filterSide === 'All' || guest.brideOrGroomSide === filterSide;
    const matchesAttending =
      filterAttending === 'All' ||
      (filterAttending === 'Yes' && guest.isAttending) ||
      (filterAttending === 'No' && !guest.isAttending);
    return matchesSearch && matchesSide && matchesAttending;
  });

  const filteredPhotos = photos.filter((photo) => {
    switch (photoFilter) {
      case 'pending':
        return !photo.isApproved;
      case 'approved':
        return photo.isApproved;
      case 'featured':
        return photo.isFeatured;
      default:
        return true;
    }
  });

  // Stats
  const stats = {
    totalGuests: guests.length,
    totalAttending: guests.filter((g) => g.isAttending).reduce((sum, g) => sum + g.numberOfAttendees, 0),
    totalNotAttending: guests.filter((g) => !g.isAttending).length,
    brideSide: guests.filter((g) => g.brideOrGroomSide === 'Bride').length,
    groomSide: guests.filter((g) => g.brideOrGroomSide === 'Groom').length,
    totalWishes: wishes.length,
    totalPhotos: photos.length,
    pendingPhotos: photos.filter((p) => !p.isApproved).length,
    approvedPhotos: photos.filter((p) => p.isApproved).length,
    featuredPhotos: photos.filter((p) => p.isFeatured).length,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--lavender-grey-ink)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading wedding…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error || 'Wedding not found'}</p>
        <button onClick={() => router.push('/super-admin')} style={{ color: 'var(--lavender-grey-ink)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>
          ← Back to dashboard
        </button>
      </div>
    );
  }

  const daysToGo = Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / 86400000);
  const weddingDateStr = new Date(wedding.weddingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weddingTimeStr = new Date(wedding.weddingDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const weddingStatus = !wedding.isActive ? 'Draft' : daysToGo > 0 ? 'Upcoming' : 'Live';
  const statusStyle: React.CSSProperties = weddingStatus === 'Upcoming'
    ? { background: 'var(--lavender)', color: 'var(--lavender-grey-ink)' }
    : weddingStatus === 'Live' ? { background: '#e5f1ea', color: 'var(--success)' }
    : { background: 'var(--floral-deep)', color: 'var(--muted)' };

  const inpEdit: React.CSSProperties = { padding: '8px 12px', border: '1px solid rgba(255,255,255,.5)', borderRadius: 10, background: 'rgba(255,255,255,.85)', color: 'var(--ink)', fontSize: 14, outline: 'none' };

  return (
    <div>
      {/* ── Back link (mobile) ───────────────────────────────────────────── */}
      <button onClick={() => router.push('/super-admin')} className="lg:hidden"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--lavender-grey-deep)', marginBottom: 14, padding: '6px 10px 6px 6px', borderRadius: 999, background: 'white', border: '1px solid var(--line-2)', cursor: 'pointer' }}>
        <Icon name="nav-arrow-left" size={16} /> All weddings
      </button>

      {/* ── Detail Hero ──────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(150deg, var(--veil) 0%, var(--lavender) 100%)', borderRadius: 'var(--radius-lg)', padding: '22px 22px 26px', position: 'relative', overflow: 'hidden', border: '1px solid var(--veil-deep)', marginBottom: 18 }}>
        <div style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.6), transparent 70%)', pointerEvents: 'none' }} />

        {isEditingWedding ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={editWeddingData.brideName} onChange={e => setEditWeddingData({ ...editWeddingData, brideName: e.target.value })} placeholder="Bride's Name" style={{ ...inpEdit, flex: 1, fontSize: 16 }} />
              <span style={{ color: 'var(--lavender-grey-deep)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20 }}>&amp;</span>
              <input value={editWeddingData.groomName} onChange={e => setEditWeddingData({ ...editWeddingData, groomName: e.target.value })} placeholder="Groom's Name" style={{ ...inpEdit, flex: 1, fontSize: 16 }} />
            </div>
            <input type="date" value={editWeddingData.weddingDate} onChange={e => setEditWeddingData({ ...editWeddingData, weddingDate: e.target.value })} style={inpEdit} />
            <input value={editWeddingData.venue} onChange={e => setEditWeddingData({ ...editWeddingData, venue: e.target.value })} placeholder="Venue" style={{ ...inpEdit, width: '100%', boxSizing: 'border-box' }} />
            <input value={editWeddingData.venueAddress} onChange={e => setEditWeddingData({ ...editWeddingData, venueAddress: e.target.value })} placeholder="Venue Address" style={{ ...inpEdit, width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleUpdateWedding} style={{ padding: '9px 18px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setIsEditingWedding(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,.5)', border: '1px solid rgba(255,255,255,.6)', borderRadius: 10, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', color: 'var(--ink)' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', padding: '6px 10px', borderRadius: 999, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--lavender-grey-ink)' }}>
                <b style={{ fontFamily: 'var(--serif)', fontSize: 16, letterSpacing: '-0.01em', textTransform: 'none' as const, fontWeight: 400 }}>{Math.max(0, daysToGo)}</b> days to go
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 500, ...statusStyle }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} /> {weddingStatus}
              </span>
            </div>
            <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              {wedding.brideName} <em style={{ fontStyle: 'italic', color: 'var(--lavender-grey-deep)', margin: '0 6px' }}>&amp;</em> {wedding.groomName}
            </h2>
            <div style={{ marginTop: 14, color: 'var(--ink-2)', fontSize: 13.5, display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={14} style={{ color: 'var(--lavender-grey-deep)' }} /> {weddingDateStr}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={14} style={{ color: 'var(--lavender-grey-deep)' }} /> {weddingTimeStr}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="map-pin" size={14} style={{ color: 'var(--lavender-grey-deep)' }} /> {wedding.venue}{wedding.venueAddress ? ` · ${wedding.venueAddress}` : ''}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              <button onClick={() => window.open(`/wedding/${wedding.coupleName}`, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
                <Icon name="eye" size={15} /> View invitation
              </button>
              <button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/wedding/${wedding.coupleName}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', borderRadius: 12, fontSize: 13.5, fontWeight: 500, color: 'var(--lavender-grey-ink)', cursor: 'pointer' }}>
                <Icon name="share-android" size={15} /> Share link
              </button>
              <button onClick={() => setIsEditingWedding(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', borderRadius: 12, fontSize: 13.5, fontWeight: 500, color: 'var(--lavender-grey-ink)', cursor: 'pointer' }}>
                <Icon name="settings" size={15} /> Edit details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 22 }}>
        {availableTabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '12px 14px', fontSize: 13.5, color: activeTab === tab.key ? 'var(--ink)' : 'var(--muted)', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--lavender-grey-ink)' : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: activeTab === tab.key ? 'var(--lavender-grey-ink)' : 'transparent', cursor: 'pointer', transition: 'color .15s ease' }}>
            {tab.label}
            {tab.key === 'photos' && stats.pendingPhotos > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, fontSize: 10, fontWeight: 700, background: 'var(--danger)', color: 'white', borderRadius: '50%' }}>
                {stats.pendingPhotos}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div>
        {activeTab === 'overview' && <OverviewTab stats={stats} guests={guests} />}

        {activeTab === 'guests' && (
          <GuestsTab
            guests={filteredGuests}
            allGuests={guests}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterSide={filterSide}
            setFilterSide={setFilterSide}
            filterAttending={filterAttending}
            setFilterAttending={setFilterAttending}
            onDelete={handleDeleteGuest}
            onExport={exportGuestsToCSV}
          />
        )}

        {activeTab === 'wishes' && (
          <WishesTab
            wishes={wishes}
            onDelete={handleDeleteWish}
            onExport={exportWishesToCSV}
          />
        )}

        {activeTab === 'photos' && (
          <PhotosTab
            photos={filteredPhotos}
            photoFilter={photoFilter}
            setPhotoFilter={setPhotoFilter}
            stats={stats}
            onApprove={handleApprovePhoto}
            onReject={handleRejectPhoto}
            onSetFeatured={handleSetFeatured}
            onDelete={handleDeletePhoto}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesTab
            features={features}
            onToggle={handleToggleFeature}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesTab
            templates={templates}
            currentTemplateId={wedding?.templateId || 1}
            onChangeTemplate={handleChangeTemplate}
            onPreviewTemplate={handlePreviewTemplate}
          />
        )}

        {activeTab === 'packages' && (
          <PackagesTab
            wedding={wedding}
            packages={packages}
            onPackageUpdated={(updated) => setWedding(updated)}
          />
        )}

        {activeTab === 'access' && (
          <AccessTab
            coupleAdmin={coupleAdmin}
            weddingId={weddingId}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'seating' && (
          <SeatingTab
            weddingId={weddingId}
            tables={tables}
            guests={guests}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}