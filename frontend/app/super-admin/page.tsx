'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { weddingService, Wedding } from '@/lib/api';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchWeddings();
  }, []);

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
  const upcomingWeddings = weddings.filter(
    (w) => new Date(w.weddingDate) > new Date()
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
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Weddings"
            value={totalWeddings}
            icon="💍"
            color="purple"
          />
          <StatCard
            title="Upcoming"
            value={upcomingWeddings}
            icon="📅"
            color="blue"
          />
          <StatCard
            title="Total Guests"
            value={totalGuests}
            icon="👥"
            color="green"
          />
          <StatCard
            title="Photos Shared"
            value={totalPhotos}
            icon="📸"
            color="pink"
          />
        </div>

        {/* Weddings List */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              All Weddings
            </h2>
          </div>

          {weddings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No weddings yet. Create one to get started!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {weddings.map((wedding, index) => (
                <motion.div
                  key={wedding.weddingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {wedding.brideName} & {wedding.groomName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        /{wedding.coupleName}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                      <div className="mt-3">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {wedding.enabledFeaturesCount} features enabled
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/super-admin/wedding/${wedding.weddingId}`
                          )
                        }
                        className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                      >
                        Manage Features
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/wedding/${wedding.coupleName}`)
                        }
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        View Dashboard
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            `/wedding/${wedding.coupleName}`,
                            '_blank'
                          )
                        }
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        View Invite →
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
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: 'purple' | 'blue' | 'green' | 'pink';
}) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md p-6 text-white`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </motion.div>
  );
}
