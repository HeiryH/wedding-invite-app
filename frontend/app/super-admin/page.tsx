'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { weddingService, Wedding } from '@/lib/api';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [filteredWeddings, setFilteredWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWeddings();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = weddings;

    // Filter by active status
    if (filter === 'active') {
      filtered = filtered.filter((w) => w.isActive);
    } else if (filter === 'inactive') {
      filtered = filtered.filter((w) => !w.isActive);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.brideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.groomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.coupleName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredWeddings(filtered);
  }, [weddings, filter, searchTerm]);

  const fetchWeddings = async () => {
    try {
      setLoading(true);
      const data = await weddingService.getAll();
      setWeddings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load weddings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (weddingId: number, currentStatus: boolean) => {
    try {
      await weddingService.toggleActive(weddingId, !currentStatus);
      await fetchWeddings();
    } catch (err) {
      alert('Failed to update wedding status');
    }
  };

  const handleDelete = async (weddingId: number, coupleName: string) => {
    if (!confirm(`Are you sure you want to delete ${coupleName}? This cannot be undone!`)) {
      return;
    }

    try {
      await weddingService.delete(weddingId);
      await fetchWeddings();
    } catch (err) {
      alert('Failed to delete wedding');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-rose-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totalWeddings = weddings.length;
  const activeWeddings = weddings.filter((w) => w.isActive).length;
  const inactiveWeddings = weddings.filter((w) => !w.isActive).length; // ADD THIS!
  const upcomingWeddings = weddings.filter(
    (w) => new Date(w.weddingDate) > new Date() && w.isActive
  ).length;
  const totalGuests = weddings.reduce((sum, w) => sum + w.totalAttending, 0);
  const totalPhotos = weddings.reduce((sum, w) => sum + w.totalPhotos, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all wedding invitations
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/super-admin/wedding/create')}
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                + Create Wedding
              </button>
              <button
                onClick={() => router.push('/super-admin/packages')}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
              >
                📦 Packages
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Weddings"
            value={totalWeddings}
            icon="💍"
            color="purple"
          />
          <StatCard
            title="Active"
            value={activeWeddings}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Upcoming"
            value={upcomingWeddings}
            icon="📅"
            color="blue"
          />
          {/* <StatCard
            title="Total Guests"
            value={totalGuests}
            icon="👥"
            color="orange"
          />
          <StatCard
            title="Photos"
            value={totalPhotos}
            icon="📸"
            color="pink"
          /> */}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by couple name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none text-black"
            />

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                All ({totalWeddings})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Active ({activeWeddings})
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'inactive'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Inactive ({inactiveWeddings})
              </button>
            </div>
          </div>
        </div>

        {/* Weddings List */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              All Weddings ({filteredWeddings.length})
            </h2>
          </div>

          {filteredWeddings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchTerm
                ? 'No weddings match your search.'
                : filter === 'inactive'
                  ? 'No inactive weddings found. All weddings are currently active!'
                  : 'No weddings yet. Create one to get started!'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredWeddings.map((wedding, index) => (
                <motion.div
                  key={wedding.weddingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 transition-colors ${!wedding.isActive
                      ? 'bg-gray-100 hover:bg-gray-150' // Different background for inactive
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-semibold ${!wedding.isActive ? 'text-gray-500' : 'text-gray-800'
                          }`}>
                          {wedding.brideName} & {wedding.groomName}
                        </h3>

                        {/* Status Badges */}
                        {!wedding.isActive && (
                          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                            ⛔ INACTIVE
                          </span>
                        )}

                        {wedding.isActive && new Date(wedding.weddingDate) < new Date() && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                            ✅ COMPLETED
                          </span>
                        )}

                        {wedding.isActive && new Date(wedding.weddingDate) > new Date() && (
                          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                            🔔 UPCOMING
                          </span>
                        )}
                      </div>

                      <p className={`text-sm mb-2 ${!wedding.isActive ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        /{wedding.coupleName}
                      </p>

                      <div className={`flex flex-wrap gap-4 text-sm ${!wedding.isActive ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        <span>
                          📅{' '}
                          {new Date(wedding.weddingDate).toLocaleDateString()}
                        </span>
                        <span>📍 {wedding.venue}</span>
                        <span>👥 {wedding.totalAttending} attending</span>
                        <span>💬 {wedding.totalGuests} RSVPs</span>
                        {wedding.totalPhotos > 0 && (
                          <span>📸 {wedding.totalPhotos} photos</span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${!wedding.isActive
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-purple-100 text-purple-700'
                          }`}>
                          {wedding.enabledFeaturesCount} features
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${!wedding.isActive
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          Template: {wedding.templateName || wedding.templateId}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      {/* <button
                        onClick={() =>
                          router.push(
                            `/super-admin/wedding/${wedding.weddingId}/edit`
                          )
                        }
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                      >
                        ✏️ Edit
                      </button> */}

                      {/* <button
                        onClick={() =>
                          router.push(
                            `/super-admin/wedding/${wedding.weddingId}`
                          )
                        }
                        className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium text-sm"
                      >
                        🎨 Features
                      </button> */}

                      <button
                        onClick={() => router.push(`/super-admin/wedding/${wedding.weddingId}`)} // Changed from /edit
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium text-sm"
                      >
                        📊 Manage Wedding
                      </button>

                      <button
                        onClick={() =>
                          window.open(`/wedding/${wedding.coupleName}`, '_blank')
                        }
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                      >
                        👁️ Preview
                      </button>

                      <button
                        onClick={() =>
                          handleToggleActive(wedding.weddingId, wedding.isActive)
                        }
                        className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${wedding.isActive
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                      >
                        {wedding.isActive ? '🔒 Deactivate' : '✅ Activate'}
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(wedding.weddingId, wedding.coupleName)
                        }
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: string;
  color: 'purple' | 'blue' | 'green' | 'pink' | 'orange';
}) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md p-6 text-white`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">
            {value} {subtitle && <span className="text-lg font-normal">{subtitle}</span>}
          </p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </motion.div>
  );
}