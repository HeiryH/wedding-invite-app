'use client';

import { motion } from 'framer-motion';
import { Guest } from '@/lib/api';
import StatCard from './StatCard';

interface OverviewTabProps {
  stats: {
    totalGuests: number;
    totalAttending: number;
    totalNotAttending: number;
    brideSide: number;
    groomSide: number;
    totalWishes: number;
  };
  guests: Guest[];
}

export default function OverviewTab({ stats, guests }: OverviewTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total RSVPs" value={stats.totalGuests} icon="📋" color="blue" />
        <StatCard
          title="Total Attending"
          value={stats.totalAttending}
          subtitle="guests"
          icon="✅"
          color="green"
        />
        <StatCard title="Not Attending" value={stats.totalNotAttending} icon="❌" color="red" />
        <StatCard title="Wishes Received" value={stats.totalWishes} icon="💬" color="purple" />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Guest Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Guest Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">👰 Bride's Side</span>
                <span className="font-semibold text-black">{stats.brideSide} guests</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500"
                  style={{
                    width: `${stats.totalGuests > 0 ? (stats.brideSide / stats.totalGuests) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">🤵 Groom's Side</span>
                <span className="font-semibold text-black">{stats.groomSide} guests</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${stats.totalGuests > 0 ? (stats.groomSide / stats.totalGuests) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Status */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">✅ Attending</span>
                <span className="font-semibold text-black">{stats.totalAttending} people</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${
                      stats.totalGuests > 0
                        ? (stats.totalAttending / (stats.totalAttending + stats.totalNotAttending)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">❌ Not Attending</span>
                <span className="font-semibold text-black">{stats.totalNotAttending} guests</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${stats.totalGuests > 0 ? (stats.totalNotAttending / stats.totalGuests) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent RSVPs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent RSVPs</h3>
        <div className="space-y-3">
          {guests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No RSVPs yet</p>
          ) : (
            guests
              .sort((a, b) => new Date(b.respondedDate || 0).getTime() - new Date(a.respondedDate || 0).getTime())
              .slice(0, 5)
              .map((guest) => (
                <div
                  key={guest.guestId}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-800">{guest.guestName}</p>
                    <p className="text-sm text-gray-500">
                      {guest.brideOrGroomSide} side • {guest.numberOfAttendees} guest(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        guest.isAttending ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {guest.isAttending ? 'Attending' : 'Not Attending'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {guest.respondedDate ? new Date(guest.respondedDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </motion.div>
  );
}