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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading wedding...</p>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error || 'Wedding not found'}</p>
          <button
            onClick={() => router.push('/super-admin')}
            className="text-rose-600 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            {isEditingWedding ? (
              <div className="space-y-3 w-full max-w-2xl">
                <div className="flex gap-2">
                  <input
                    className="text-2xl font-bold border-2 border-gray-300 rounded px-3 py-2 w-full focus:border-rose-400 focus:outline-none"
                    value={editWeddingData.brideName}
                    onChange={(e) =>
                      setEditWeddingData({ ...editWeddingData, brideName: e.target.value })
                    }
                    placeholder="Bride's Name"
                  />
                  <span className="text-2xl font-bold self-center">&</span>
                  <input
                    className="text-2xl font-bold border-2 border-gray-300 rounded px-3 py-2 w-full focus:border-rose-400 focus:outline-none"
                    value={editWeddingData.groomName}
                    onChange={(e) =>
                      setEditWeddingData({ ...editWeddingData, groomName: e.target.value })
                    }
                    placeholder="Groom's Name"
                  />
                </div>
                <input
                  type="date"
                  className="block border-2 border-gray-300 rounded px-3 py-2 focus:border-rose-400 focus:outline-none"
                  value={editWeddingData.weddingDate}
                  onChange={(e) =>
                    setEditWeddingData({ ...editWeddingData, weddingDate: e.target.value })
                  }
                />
                <input
                  className="block border-2 border-gray-300 rounded px-3 py-2 w-full focus:border-rose-400 focus:outline-none"
                  value={editWeddingData.venue}
                  onChange={(e) =>
                    setEditWeddingData({ ...editWeddingData, venue: e.target.value })
                  }
                  placeholder="Venue"
                />
                <input
                  className="block border-2 border-gray-300 rounded px-3 py-2 w-full focus:border-rose-400 focus:outline-none"
                  value={editWeddingData.venueAddress}
                  onChange={(e) =>
                    setEditWeddingData({ ...editWeddingData, venueAddress: e.target.value })
                  }
                  placeholder="Venue Address"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleUpdateWedding}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 font-semibold"
                  >
                    ✓ Save
                  </button>
                  <button
                    onClick={() => setIsEditingWedding(false)}
                    className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-800">
                    {wedding.brideName} & {wedding.groomName}
                  </h1>
                  <button
                    onClick={() => setIsEditingWedding(true)}
                    className="text-gray-400 hover:text-rose-500 transition-colors text-xl"
                    title="Edit wedding details"
                  >
                    ✏️
                  </button>
                </div>
                <p className="text-gray-600 mt-1">
                  📅 {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-gray-500 text-sm mt-1">📍 {wedding.venue} • {wedding.venueAddress}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/super-admin')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ← Back
              </button>
              <button                
                onClick={() =>
                          window.open(`/wedding/${wedding.coupleName}`, '_blank')
                        }
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                👁️ View Invitation
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 font-medium transition-colors relative ${activeTab === tab.key
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                {tab.label}
                {tab.key === 'photos' && stats.pendingPhotos > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {stats.pendingPhotos}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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