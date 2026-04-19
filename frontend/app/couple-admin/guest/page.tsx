'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getUser } from '@/lib/auth';
import { 
  guestService, 
  weddingService, 
  weddingFeatureService,
  Guest, 
  Wedding,
  WeddingFeature 
} from '@/lib/api';

export default function CoupleGuestsPage() {
  const router = useRouter();
  const user = getUser();
  const weddingId = user?.weddingId;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [features, setFeatures] = useState<WeddingFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'attending' | 'not-attending' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!weddingId) {
      alert('No wedding assigned to this account');
      router.push('/couple-admin');
      return;
    }

    fetchData();
  }, [weddingId]);

  const fetchData = async () => {
    if (!weddingId) return;

    try {
      setLoading(true);
      const [weddingData, guestsData, featuresData] = await Promise.all([
        weddingService.getById(weddingId),
        guestService.getByWeddingId(weddingId),
        weddingFeatureService.getByWeddingId(weddingId),
      ]);

      setWedding(weddingData);
      setGuests(guestsData);
      setFeatures(featuresData);
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (featureCode: string): boolean => {
    const feature = features.find((f) => f.featureCode === featureCode);
    return feature?.isEnabled ?? false;
  };

  // Check if RSVP feature is enabled
  const hasRSVP = isFeatureEnabled('RSVP');

  if (!hasRSVP) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Guest Management Not Available
        </h2>
        <p className="text-gray-600 mb-6">
          The RSVP feature is not enabled for your wedding
        </p>
        <button
          onClick={() => router.push('/couple-admin')}
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const handleDelete = async (guestId: number) => {
    if (!confirm('Are you sure you want to delete this guest?')) return;

    try {
      await guestService.delete(guestId);
      await fetchData();
    } catch (err) {
      alert('Failed to delete guest');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Side', 'Attending', 'Guests Count', 'Song Request'].join(','),
      ...filteredGuests.map((g) =>
        [
          g.guestName,
          g.email || '',
          g.phoneNumber || '',
          g.brideOrGroomSide,
          g.isAttending ? 'Yes' : 'No',
          g.numberOfAttendees,
          g.songRequest || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${wedding?.coupleName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredGuests = guests.filter((guest) => {
    // Filter by status
    let statusMatch = true;
    if (filter === 'attending') statusMatch = guest.isAttending;
    if (filter === 'not-attending') statusMatch = !guest.isAttending;

    // Filter by search
    const searchMatch =
      guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  const stats = {
    total: guests.length,
    attending: guests.filter((g) => g.isAttending).length,
    notAttending: guests.filter((g) => !g.isAttending).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading guests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Guest Management</h1>
            <p className="text-gray-600 mt-1">
              {wedding?.brideName} & {wedding?.groomName}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/couple-admin')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              + Add Guest
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Guests" value={stats.total} icon="👥" color="blue" />
        <StatCard title="Attending" value={stats.attending} icon="✅" color="green" />
        <StatCard title="Not Attending" value={stats.notAttending} icon="❌" color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label={`All (${guests.length})`}
            />
            <FilterButton
              active={filter === 'attending'}
              onClick={() => setFilter('attending')}
              label={`Attending (${stats.attending})`}
            />
            <FilterButton
              active={filter === 'not-attending'}
              onClick={() => setFilter('not-attending')}
              label={`Not Attending (${stats.notAttending})`}
            />
          </div>
        </div>
      </div>

      {/* Guest List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No guests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Side
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Song Request
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGuests.map((guest) => (
                  <tr key={guest.guestId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{guest.guestName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{guest.email}</div>
                      <div className="text-sm text-gray-500">{guest.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          guest.brideOrGroomSide === 'Groom'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {guest.brideOrGroomSide === 'Bride' ? '👰 Bride' : '🤵 Groom'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {guest.isAttending ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          ✅ Attending
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          ❌ Not Attending
                        </span>
                      )
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {guest.numberOfAttendees}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {guest.songRequest || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingGuest(guest)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(guest.guestId)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Guest Modal */}
      {(showAddModal || editingGuest) && (
        <GuestModal
          weddingId={weddingId!}
          guest={editingGuest}
          onClose={() => {
            setShowAddModal(false);
            setEditingGuest(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingGuest(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Component helpers remain the same...
// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    color,
    badge,
    onClick,
}: {
    title: string;
    value: number;
    icon: string;
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'red';
    badge?: boolean;
    onClick?: () => void;
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        yellow: 'from-yellow-500 to-yellow-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600',
        red: 'from-red-500 to-red-600',
    };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md p-6 text-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-lg font-medium transition-all text-sm ${
        active ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
      {badge && !active && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}

// Guest Modal Component (Add/Edit)
function GuestModal({ weddingId, guest, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    guestName: guest?.guestName || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    side: guest?.side || 'BRIDE',
    numberOfGuests: guest?.numberOfGuests || 1,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (guest) {
        await guestService.create(guest.guestId, weddingId);
      }
      onSuccess();
    } catch (err) {
      alert('Failed to save guest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {guest ? 'Edit Guest' : 'Add New Guest'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Side *</label>
            <select
              value={formData.side}
              onChange={(e) => setFormData({ ...formData, side: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
            >
              <option value="BRIDE">👰 Bride's Side</option>
              <option value="GROOM">🤵 Groom's Side</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
            <input
              type="number"
              min="1"
              value={formData.numberOfGuests}
              onChange={(e) =>
                setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg'
              }`}
            >
              {saving ? 'Saving...' : guest ? 'Update' : 'Add Guest'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}