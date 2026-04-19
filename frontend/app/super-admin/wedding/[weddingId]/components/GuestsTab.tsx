'use client';

import { motion } from 'framer-motion';
import { Guest } from '@/lib/api';

interface GuestsTabProps {
  guests: Guest[]; // Filtered guests
  allGuests: Guest[]; // All guests (for count)
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterSide: 'All' | 'Bride' | 'Groom';
  setFilterSide: (value: 'All' | 'Bride' | 'Groom') => void;
  filterAttending: 'All' | 'Yes' | 'No';
  setFilterAttending: (value: 'All' | 'Yes' | 'No') => void;
  onDelete: (guestId: number) => void;
  onExport: () => void;
}

export default function GuestsTab({
  guests,
  allGuests,
  searchTerm,
  setSearchTerm,
  filterSide,
  setFilterSide,
  filterAttending,
  setFilterAttending,
  onDelete,
  onExport,
}: GuestsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-rose-400 text-black"
          />
          <select
            value={filterSide}
            onChange={(e) => setFilterSide(e.target.value as any)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-rose-400 text-black"
          >
            <option value="All">All Sides</option>
            <option value="Bride">Bride's Side</option>
            <option value="Groom">Groom's Side</option>
          </select>
          <select
            value={filterAttending}
            onChange={(e) => setFilterAttending(e.target.value as any)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-rose-400 text-black"
          >
            <option value="All">All Status</option>
            <option value="Yes">Attending</option>
            <option value="No">Not Attending</option>
          </select>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            📥 Export CSV
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Showing {guests.length} of {allGuests.length} guests
        </p>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Song Request</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No guests found
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.guestId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{guest.guestName}</div>
                      <div className="text-sm text-gray-500">
                        {guest.respondedDate ? new Date(guest.respondedDate).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guest.email}</div>
                      <div className="text-sm text-gray-500">{guest.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          guest.brideOrGroomSide === 'Bride'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {guest.brideOrGroomSide === 'Bride' ? '👰 Bride' : '🤵 Groom'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          guest.isAttending ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {guest.isAttending ? '✅ Yes' : '❌ No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {guest.numberOfAttendees}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {guest.songRequest || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onDelete(guest.guestId)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}