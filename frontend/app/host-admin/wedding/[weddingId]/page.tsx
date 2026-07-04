'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  weddingService, guestService, wishService, photoService,
  weddingFeatureService, templateService, packageService,
  authService, tableService,
  Wedding, Guest, Wish, Photo, WeddingFeature, Template, Package, CoupleAdminUser, SeatingTable,
} from '@/lib/api';

import OverviewTab from '@/app/super-admin/wedding/[weddingId]/components/OverviewTab';
import GuestsTab from '@/app/super-admin/wedding/[weddingId]/components/GuestsTab';
import WishesTab from '@/app/super-admin/wedding/[weddingId]/components/WishesTab';
import PhotosTab from '@/app/super-admin/wedding/[weddingId]/components/PhotosTab';
import FeaturesTab from '@/app/super-admin/wedding/[weddingId]/components/FeaturesTab';
import TemplatesTab from '@/app/super-admin/wedding/[weddingId]/components/TemplatesTab';
import PackagesTab from '@/app/super-admin/wedding/[weddingId]/components/PackagesTab';
import AccessTab from '@/app/super-admin/wedding/[weddingId]/components/AccessTab';
import SeatingTab from '@/app/super-admin/wedding/[weddingId]/components/SeatingTab';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';

type Tab = 'overview' | 'guests' | 'wishes' | 'photos' | 'features' | 'templates' | 'packages' | 'access' | 'seating';

export default function HostWeddingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const weddingId = parseInt(params.weddingId as string);

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [features, setFeatures] = useState<WeddingFeature[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [coupleAdmin, setCoupleAdmin] = useState<CoupleAdminUser | null>(null);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
  const [filterAttending, setFilterAttending] = useState<'All' | 'Yes' | 'No'>('All');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

  useEffect(() => { fetchData(); }, [weddingId]);

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
      setPhotos(photosData);
      setFeatures(featuresData);
      setTemplates(templatesData);
      setPackages(packagesData);
      setCoupleAdmin(coupleAdminData);
      setTables(tablesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wedding data');
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (code: string) => features.some(f => f.featureCode === code && f.isEnabled);

  const availableTabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    ...(isFeatureEnabled('RSVP') ? [{ key: 'guests' as Tab, label: 'Guests' }] : []),
    ...(isFeatureEnabled('WISHES') ? [{ key: 'wishes' as Tab, label: 'Wishes' }] : []),
    ...(isFeatureEnabled('PHOTO_BOOTH') ? [{ key: 'photos' as Tab, label: 'Photos' }] : []),
    ...(isFeatureEnabled('SEATING') ? [{ key: 'seating' as Tab, label: 'Seating' }] : []),
    { key: 'features', label: 'Features' },
    { key: 'templates', label: 'Templates' },
    { key: 'packages', label: 'Packages' },
    { key: 'access', label: 'Access' },
  ];

  useEffect(() => {
    if (!availableTabs.some(t => t.key === activeTab) && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].key);
    }
  }, [features]);

  const handleDeleteGuest = async (guestId: number) => {
    if (!confirm('Remove this guest?')) return;
    try { await guestService.delete(guestId); setGuests(prev => prev.filter(g => g.guestId !== guestId)); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteWish = async (wishId: number) => {
    if (!confirm('Remove this wish?')) return;
    try { await wishService.delete(wishId); setWishes(prev => prev.filter(w => w.wishId !== wishId)); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleApprovePhoto = async (photoId: number) => {
    try { await photoService.approve(photoId, { isApproved: true }); await fetchData(); }
    catch { alert('Failed'); }
  };

  const handleRejectPhoto = async (photoId: number) => {
    const reason = prompt('Reason for rejection (optional):');
    try { await photoService.approve(photoId, { isApproved: false, rejectionReason: reason || undefined }); await fetchData(); }
    catch { alert('Failed'); }
  };

  const handleSetFeatured = async (photoId: number, isFeatured: boolean) => {
    try { await photoService.setFeatured(photoId, isFeatured); await fetchData(); }
    catch { alert('Failed'); }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Delete this photo?')) return;
    try { await photoService.delete(photoId); await fetchData(); }
    catch { alert('Failed'); }
  };

  const handleToggleRsvp = async (isRsvpOpen: boolean) => {
    if (!wedding) return;
    try { const updated = await weddingService.toggleRsvp(wedding.weddingId, isRsvpOpen); setWedding(updated); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleToggleFeature = async (featureId: number, featureCode: string, currentStatus: boolean) => {
    try { await weddingFeatureService.toggleFeature(weddingId, { featureId, featureCode, isEnabled: !currentStatus }); await fetchData(); }
    catch { alert('Failed'); }
  };

  const handleChangeTemplate = async (templateId: number) => {
    if (!wedding) return;
    const template = templates.find(t => t.templateId === templateId);
    if (!confirm(`Change to "${template?.templateName}"?`)) return;
    try { const updated = await weddingService.updateTemplate(wedding.weddingId, templateId); setWedding(updated); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const exportGuestsToCSV = () => {
    const rows = guests.map(g => [g.guestName, g.email || '', g.phoneNumber || '', g.brideOrGroomSide, g.isAttending ? 'Yes' : 'No', g.numberOfAttendees, g.songRequest || '', g.respondedDate ? new Date(g.respondedDate).toLocaleDateString() : '']);
    const csv = [['Name', 'Email', 'Phone', 'Side', 'Attending', 'Pax', 'Song', 'Date'].join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${wedding?.coupleName}-guests.csv`; a.click();
  };

  const exportWishesToCSV = () => {
    const rows = wishes.map(w => [w.guestName, w.message, new Date(w.createdDate).toLocaleDateString()]);
    const csv = [['Guest', 'Message', 'Date'].join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${wedding?.coupleName}-wishes.csv`; a.click();
  };

  const filteredGuests = guests.filter(g => {
    if (!g.guestName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterSide !== 'All' && g.brideOrGroomSide !== filterSide) return false;
    if (filterAttending === 'Yes' && !g.isAttending) return false;
    if (filterAttending === 'No' && g.isAttending) return false;
    return true;
  });

  const filteredPhotos = photos.filter(p => {
    if (photoFilter === 'pending') return !p.isApproved;
    if (photoFilter === 'approved') return p.isApproved;
    if (photoFilter === 'featured') return p.isFeatured;
    return true;
  });

  const stats = {
    totalGuests: guests.length,
    totalAttending: guests.filter(g => g.isAttending).reduce((s, g) => s + g.numberOfAttendees, 0),
    totalNotAttending: guests.filter(g => !g.isAttending).length,
    brideSide: guests.filter(g => g.brideOrGroomSide === 'Bride').length,
    groomSide: guests.filter(g => g.brideOrGroomSide === 'Groom').length,
    totalWishes: wishes.length,
    totalPhotos: photos.length,
    pendingPhotos: photos.filter(p => !p.isApproved).length,
    approvedPhotos: photos.filter(p => p.isApproved).length,
    featuredPhotos: photos.filter(p => p.isFeatured).length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error || !wedding) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <p style={{ color: 'var(--danger)', marginBottom: 12, fontFamily: 'var(--font-ui)' }}>{error || 'Wedding not found'}</p>
      <button onClick={() => router.push('/host-admin')} style={{ color: 'var(--brand)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontFamily: 'var(--font-ui)' }}>
        ← Back to dashboard
      </button>
    </div>
  );

  const daysToGo = Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / 86400000);
  const weddingDateStr = new Date(wedding.weddingDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weddingTimeStr = new Date(wedding.weddingDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const weddingStatus = !wedding.isActive ? 'Draft' : daysToGo > 0 ? 'Upcoming' : 'Live';

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.push('/host-admin')} className="lg:hidden"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
        <Icon name="arrow-left" size={15} /> All weddings
      </button>

      {/* Hero */}
      <div style={{
        background: 'var(--brand-gradient)', borderRadius: 'var(--radius-2xl)',
        padding: '22px 22px 26px', position: 'relative', overflow: 'hidden',
        border: '1px solid var(--brand-border)', marginBottom: 18,
        boxShadow: 'var(--shadow-foil)',
      }}>
        <div style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Badge tone={weddingStatus === 'Live' ? 'success' : weddingStatus === 'Upcoming' ? 'info' : 'neutral'} dot>{weddingStatus}</Badge>
            </div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 400, color: '#fff', lineHeight: 1.1, letterSpacing: 'var(--tracking-tight)' }}>
              {wedding.brideName} & {wedding.groomName}
            </h1>
            <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,.75)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>
              {weddingDateStr} · {weddingTimeStr} · {wedding.venue}
            </p>
          </div>
          <button
            onClick={() => window.open(`/wedding/${wedding.coupleName}`, '_blank')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: 'var(--text-sm)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500, flexShrink: 0 }}
          >
            <Icon name="eye" size={15} /> Preview
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
        {availableTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '9px 16px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--brand)' : 'var(--text-muted)',
              fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)',
              fontWeight: activeTab === tab.key ? 600 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'var(--transition-control)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          stats={stats}
          guests={guests}
          isRsvpOpen={wedding.isRsvpOpen ?? true}
          onToggleRsvp={handleToggleRsvp}
        />
      )}
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
          currentTemplateId={wedding.templateId}
          onChangeTemplate={handleChangeTemplate}
          onPreviewTemplate={(id) => window.open(`/wedding/${wedding.coupleName}?preview=${id}`, '_blank')}
        />
      )}
      {activeTab === 'packages' && (
        <PackagesTab
          wedding={wedding}
          packages={packages}
          onPackageUpdated={setWedding}
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
  );
}
